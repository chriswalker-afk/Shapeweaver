import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,cp,rm,writeFile,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {build} from "../tools/build.mjs";
import {verifyDist} from "../tools/verify-dist.mjs";
import {verifyHostedRelease} from "../tools/verify-live.mjs";
import {APP,createAppState} from "../src/core/app-state.js";
const root=fileURLToPath(new URL("../",import.meta.url)),sha="a".repeat(40);
test("release version and production identity agree",async()=>{
 assert.equal(APP.version,"1.0.0");assert.equal(createAppState().mode,"production");
 assert.equal(JSON.parse(await readFile(join(root,"package.json"),"utf8")).version,APP.version);
});
test("artifact verifier checks references, provenance, release identity and public boundary",async()=>{
 const fixture=await mkdtemp(join(tmpdir(),"shapeweaver-release-"));
 try{
  for(const path of ["index.html","src","assets"])await cp(join(root,path),join(fixture,path),{recursive:true});
  const dist=await build(fixture),report=await verifyDist(dist,null);assert.equal(report.version,APP.version);assert.equal(report.assets,19);assert.ok(report.files>70);
  await assert.rejects(verifyDist(dist,sha),/commit mismatch/);
  await writeFile(join(dist,"private.txt"),"not public");await assert.rejects(verifyDist(dist,null),/Unexpected production root/);await rm(join(dist,"private.txt"));
  await rm(join(dist,"src/core/game-audio.js"));await assert.rejects(verifyDist(dist,null),/Missing published reference.*game-audio/);
  await build(fixture);await rm(join(dist,"assets/ui/crest.svg"));await assert.rejects(verifyDist(dist,null),/Missing published reference.*crest/);
 }finally{await rm(fixture,{recursive:true,force:true});}
});
test("hosted verification checks exact commit, MIME and HTTPS rather than accepting arbitrary 200",async()=>{
 const fetcher=async u=>{
  assert.equal(u.origin,"https://example.github.io");assert.ok(u.pathname.startsWith("/Shapeweaver/"));
  const p=u.pathname.split("/Shapeweaver/")[1],responses={
   "":['<meta name="application-version" content="'+APP.version+'">',"text/html"],
   "assets/release.json":[JSON.stringify({name:"Shapeweaver",version:APP.version,commit:sha}),"application/json"],
   "src/main.js":["export function startApp(){}","text/javascript"],
   "assets/ui/crest.svg":["<svg/>","image/svg+xml"]};
  const [body,type]=responses[p]??["missing","text/plain"];return new Response(body,{status:responses[p]?200:404,headers:{"content-type":type}});
 };
 assert.equal((await verifyHostedRelease("https://example.github.io/Shapeweaver",sha,{fetcher})).commit,sha);
 await assert.rejects(verifyHostedRelease("https://example.github.io/Shapeweaver/","b".repeat(40),{fetcher}),/Hosted commit mismatch/);
 await assert.rejects(verifyHostedRelease("http://example.github.io/Shapeweaver/",sha,{fetcher}),/HTTPS/);
});
