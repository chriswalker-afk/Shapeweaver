import {readFile,readdir,lstat} from "node:fs/promises";
import {resolve,relative,dirname,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {APP} from "../src/core/app-state.js";
import {WORLD_ASSETS} from "../src/rendering/world-art.js";
import {SPELLS} from "../src/ui/identity.js";
import {HOME_ART,HOME_HERO} from "../src/ui/home.js";

const projectRoot=fileURLToPath(new URL("../",import.meta.url));
const publicExtensions={src:new Set([".js",".css"]),assets:new Set([".svg",".json",".md",".png",".jpg",".webp",".woff2",".ogg",".mp3"])};
async function walk(root,dir=root){
 const files=[];
 for(const name of (await readdir(dir)).sort()){
  const path=resolve(dir,name),info=await lstat(path);
  if(info.isSymbolicLink()||name.startsWith("."))throw Error("Forbidden published entry: "+relative(root,path));
  if(info.isDirectory())files.push(...await walk(root,path));else if(info.isFile())files.push(relative(root,path).split(sep).join("/"));else throw Error("Not a regular file: "+path);
 }
 return files;
}
/** Inspect the actual public artifact, not the source server's URL allowlist. */
export async function verifyDist(dist=resolve(projectRoot,"dist"),expectedCommit=process.env.GITHUB_SHA??null){
 const root=resolve(dist),entries=(await readdir(root)).sort();
 if(JSON.stringify(entries)!==JSON.stringify(["assets","index.html","src"]))throw Error("Unexpected production root: "+entries.join(", "));
 const files=await walk(root),set=new Set(files);
 for(const path of files){
  if(path==="index.html")continue;
  const group=path.split("/")[0];
  if(!publicExtensions[group]?.has(extname(path)))throw Error("Unexpected public file: "+path);
 }
 function reference(from,target){
  if(target==="."||target==="./"||target.startsWith("#"))return;
  if(!/^\.{1,2}\//.test(target)||/[?#]/.test(target))throw Error("Non-relative or unsupported reference: "+from+" -> "+target);
  const path=relative(root,resolve(root,dirname(from),target)).split(sep).join("/");
  if(!set.has(path))throw Error("Missing published reference: "+from+" -> "+target);
 }
 const html=await readFile(resolve(root,"index.html"),"utf8");
 for(const m of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g))reference("index.html",m[1]);
 const app=await readFile(resolve(root,"src/core/app-state.js"),"utf8");
 if(!html.includes('name="application-version" content="'+APP.version+'"')||!app.includes('version: "'+APP.version+'"'))throw Error("Published version mismatch");
 const pkg=JSON.parse(await readFile(resolve(projectRoot,"package.json"),"utf8"));
 if(pkg.version!==APP.version)throw Error("Package and application versions differ");
 for(const path of files.filter(p=>p.endsWith(".js"))){
  const code=await readFile(resolve(root,path),"utf8");
  // Static ESM imports and re-exports. No bare package or absolute site URLs.
  for(const m of code.matchAll(/^\s*import\s+(?:[^;]*?\bfrom\s*)?["']([^"']+)["']/gm))reference(path,m[1]);
  for(const m of code.matchAll(/^\s*export\s+(?:\*|\{[^}]*\})\s+from\s*["']([^"']+)["']/gm))reference(path,m[1]);
 }
 for(const path of files.filter(p=>p.endsWith(".css"))){
  const code=await readFile(resolve(root,path),"utf8");
  for(const m of code.matchAll(/url\(\s*["']?([^"'\s)]+)["']?\s*\)/g))reference(path,m[1]);
 }
 const manifest=JSON.parse(await readFile(resolve(root,"assets/manifest.json"),"utf8")),listed=manifest.assets.map(a=>a.path);
 if(new Set(listed).size!==listed.length||manifest.assets.some(a=>!a.provenance||!a.rights))throw Error("Asset provenance missing or duplicated");
 for(const path of listed)if(!set.has("assets/"+path))throw Error("Manifest asset missing: "+path);
 for(const path of [...Object.values(WORLD_ASSETS),...SPELLS.map(s=>s.icon.slice("assets/".length)),...HOME_ART,HOME_HERO])if(!listed.includes(path))throw Error("Unmanifested runtime asset: "+path);
 const release=JSON.parse(await readFile(resolve(root,"assets/release.json"),"utf8"));
 if(release.name!==APP.name||release.version!==APP.version||!(release.commit===null||/^[a-f0-9]{40}$/.test(release.commit)))throw Error("Invalid artifact release identity");
 if(expectedCommit&&release.commit!==expectedCommit.toLowerCase())throw Error("Artifact commit mismatch");
 return {version:release.version,commit:release.commit,files:files.length,assets:listed.length};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log("PRODUCTION ARTIFACT: "+JSON.stringify(await verifyDist()));
