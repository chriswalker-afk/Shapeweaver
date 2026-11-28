import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {APP} from "../src/core/app-state.js";
/** Fail on an old or misrouted deployment, not only a non-200 response. */
export async function verifyHostedRelease(url,commit,{fetcher=fetch,version=APP.version}={}){
 if(!/^[a-f0-9]{40}$/i.test(commit??""))throw Error("Expected full release commit SHA");
 const base=new URL(url);
 if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash)throw Error("Expected HTTPS Pages base URL");
 if(!base.pathname.endsWith("/"))base.pathname+="/";
 async function load(path,mime){
  const u=new URL(path,base);
  const res=await fetcher(u,{cache:"no-store",redirect:"follow",signal:AbortSignal.timeout(15000)});
  if(!res.ok||new URL(res.url||u).protocol!=="https:"||!mime.test(res.headers.get("content-type")??""))throw Error("Unexpected hosted response for "+path+": "+res.status);
  return res;
 }
 const home=await load("./",/text\/html/i);
 if(!(await home.text()).includes('name="application-version" content="'+version+'"'))throw Error("Hosted application version mismatch");
 const metadata=await (await load("assets/release.json",/application\/json/i)).json();
 if(metadata.name!=="Shapeweaver"||metadata.version!==version||metadata.commit!==commit.toLowerCase())throw Error("Hosted commit mismatch");
 const module=await load("src/main.js",/javascript/i);
 if(!(await module.text()).includes("startApp"))throw Error("Hosted module is not the app");
 await load("assets/ui/crest.svg",/image\/svg\+xml/i);
 return {url:home.url||base.href,version,commit:metadata.commit};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let result,last;
 for(let i=0;i<6&&!result;i++){
  try{result=await verifyHostedRelease(process.argv[2],process.argv[3]);}
  catch(e){last=e;console.warn("Hosted verification attempt "+(i+1)+": "+e.message);if(i<5)await new Promise(r=>setTimeout(r,5000));}
 }
 if(!result)throw last;
 console.log("HOSTED RELEASE VERIFIED: "+JSON.stringify(result));
}
