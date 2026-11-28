// Test the actual built public app, under both supported hosting paths.
import {chromium} from "playwright";
import {fileURLToPath} from "node:url";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {createStaticServer} from "./serve.mjs";
import {verifyDist} from "./verify-dist.mjs";
import {APP} from "../src/core/app-state.js";
const root=fileURLToPath(new URL("../dist/",import.meta.url));
await verifyDist(root);
const browser=await chromium.launch({headless:true}),report=[];
await mkdir("browser-qa",{recursive:true});
try{
 for(const basePath of ["/","/Shapeweaver/"]){
  const server=createStaticServer({root,basePath});
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const origin="http://127.0.0.1:"+server.address().port,url=origin+basePath;
  const page=await browser.newPage({viewport:{width:1024,height:600},reducedMotion:"reduce"});
  const errors=[],external=[],failed=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("requestfailed",r=>failed.push(r.url()));
  page.on("response",r=>{if(r.status()>=400)failed.push(r.status()+" "+r.url());});
  await page.route("**/*",route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  try{
   assert.equal((await page.request.get(url+"workshop/index.html")).status(),404);
   assert.equal((await page.request.get(url+"docs/roadmap.md")).status(),404);
   await page.goto(url);
   assert.equal(await page.locator('meta[name="application-version"]').getAttribute("content"),APP.version);
   await page.locator("#open-campaign").click();
   assert.equal(await page.locator(".library-level").count(),36);
   await page.locator(".library-level").filter({hasText:"The Stubborn Gate"}).click();
   await page.locator("#object-toggle").click();
   await page.locator("#object-select").selectOption("stubborn-gate");
   await page.locator("#object-spell").selectOption("rotate");
   for(const [key,value] of Object.entries({angle:"90",direction:"anticlockwise",cx:"14",cy:"8"})){
    const field=page.locator('#object-fields [name="'+key+'"]');
    if(await field.evaluate(e=>e.tagName==="SELECT"))await field.selectOption(value);else await field.fill(value);
   }
   await page.locator('#object-form button[type="submit"]').click();
   assert.ok(await page.locator("#object-apply").isEnabled());
   await page.locator("#object-apply").click();
   await page.keyboard.down("ArrowRight");
   try{await page.locator("#results-view").waitFor({state:"visible",timeout:15000});}
   finally{await page.keyboard.up("ArrowRight");}
   assert.equal(await page.locator("#results-stars").getAttribute("aria-label"),"3 out of 3 stars");
   assert.match(await page.locator("#results-history").innerText(),/90° anticlockwise/);
   assert.match(await page.locator("#results-campaign-progress").innerText(),/1 \/ 36 puzzles.*3 \/ 108 stars/);
   await page.screenshot({path:"browser-qa/production-"+(basePath==="/"?"root":"subpath")+"-results.png",fullPage:true});
   await page.locator("#results-title").click();
   assert.match(await page.locator("#campaign-progress").innerText(),/1 \/ 36 released puzzles complete/);
   await page.reload();await page.locator("#open-campaign").click();
   assert.match(await page.locator("#campaign-progress").innerText(),/1 \/ 36 released puzzles complete.*3 \/ 108 stars/);
   assert.equal(await page.locator(".library-level").count(),36);
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
   report.push({basePath,version:APP.version,completedLevel:2,stars:3,progressSurvivesReload:true,externalRequests:0});
  }finally{await page.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 }
 assert.equal(report.length,2);
 console.log("PRODUCTION BROWSER: "+report.length+"/2 hosting paths passed actual rotation, keyboard traversal, results and reload.");
}finally{
 await writeFile("browser-qa/production-report.json",JSON.stringify(report,null,2));
 await browser.close();
}
