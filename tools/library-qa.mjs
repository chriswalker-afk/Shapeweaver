// Focused acceptance of the real production chapter-first library.
import {chromium} from "playwright";
import {createStaticServer} from "./serve.mjs";
import {verifyDist} from "./verify-dist.mjs";
import {CHAPTERS,LEVELS} from "../src/levels/campaign.js";
import {BEST_RESULTS_KEY} from "../src/core/best-results.js";
import {mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const root=fileURLToPath(new URL("../dist/",import.meta.url));
await verifyDist(root);
const server=createStaticServer({root,basePath:"/Shapeweaver/"});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({headless:true}),url="http://127.0.0.1:"+server.address().port+"/Shapeweaver/";
const out="browser-qa/library-review";await mkdir(out,{recursive:true});
const report=[];
const viewports=[
 {name:"classroom",width:1366,height:768},{name:"small-desktop",width:1024,height:600},
 {name:"full-hd",width:1920,height:1080},{name:"tablet",width:768,height:1024,touch:true},
 {name:"landscape",width:844,height:390,touch:true},{name:"portrait",width:390,height:844,touch:true},
 {name:"compact",width:320,height:568,touch:true},{name:"text-zoom",width:390,height:844,touch:true,zoom:2}
];
async function noOverflow(page,name){
 const geometry=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll(".chapter-card,.library-level")].filter(e=>e.getClientRects().length);
  const bad=cards.filter(e=>{const r=e.getBoundingClientRect();return r.x< -1||r.right>innerWidth+1||r.width<44||r.height<44||e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1;}).map(e=>e.getAttribute("aria-label"));
  return {width:document.documentElement.scrollWidth,viewport:innerWidth,bad};
 });
 assert.ok(geometry.width<=geometry.viewport+1,name+" horizontal overflow "+JSON.stringify(geometry));
 assert.deepEqual(geometry.bad,[],name+" visible cards fit");
}
try{
 for(const v of viewports){
  const page=await browser.newPage({viewport:{width:v.width,height:v.height},hasTouch:Boolean(v.touch),reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const failed=[];page.on("response",r=>{if(r.status()>=400)failed.push(r.url());});
  try{
   await page.addInitScript(({key,id})=>localStorage.setItem(key,JSON.stringify({version:1,levels:{[id]:{moves:2,stars:2}}})),{key:BEST_RESULTS_KEY,id:LEVELS[0].id});
   await page.goto(url);await page.locator("#open-campaign").click();
   if(v.zoom)await page.evaluate(n=>document.documentElement.style.fontSize=(100*n)+"%",v.zoom);
   const root=page.locator("#campaign-view"),map=page.locator("#campaign-map"),cards=map.locator(".chapter-card"),tiles=page.locator(".library-level"),play=page.locator("#library-play");
   assert.equal(await root.getAttribute("data-library-mode"),"atlas");
   assert.equal(await cards.count(),7);assert.equal(await tiles.count(),0);
   assert.equal(await page.locator("#library-search").isHidden(),true);
   assert.equal(await page.locator("#library-completed").innerText(),"1 / 36 puzzles");
   assert.equal(await page.locator("#library-stars").innerText(),"★ 2 / 108");
   assert.deepEqual(await cards.locator("strong").allTextContents(),CHAPTERS.map(c=>c.title));
   assert.deepEqual(await cards.locator("small").allTextContents(),["1/4","0/4","0/4","0/6","0/6","0/6","0/6"]);
   for(const art of await cards.locator("img").all())assert.deepEqual(await art.evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight,img.alt];}),[320,160,""]);
   await noOverflow(page,v.name+" atlas");
   const rows=await cards.evaluateAll(els=>{
    const rows=[];for(const e of els){const b=e.getBoundingClientRect();let row=rows.find(r=>Math.abs(r.y-b.top)<2);if(!row){row={y:b.top,left:b.left,right:b.right,count:0};rows.push(row);}row.left=Math.min(row.left,b.left);row.right=Math.max(row.right,b.right);row.count++;}
    return rows;
   });
   const mapBox=await map.boundingBox();
   for(const row of rows)assert.ok(Math.abs((row.left+row.right)/2-(mapBox.x+mapBox.width/2))<=3,v.name+" balanced chapter rows");
   await page.screenshot({path:out+"/"+v.name+"-atlas.png",fullPage:true});
   const gate=cards.filter({hasText:"The Gatehouse"});
   if(v.touch)await gate.tap();else{await gate.focus();await page.keyboard.press("Enter");}
   assert.equal(await root.getAttribute("data-library-mode"),"chapter");assert.equal(await map.isHidden(),true);
   assert.equal(await page.locator("#library-selected-detail").isVisible(),true);
   assert.equal(await play.isVisible(),true);
   assert.equal(await tiles.count(),4);assert.equal(await page.locator("#library-search").isHidden(),true);
   assert.equal(await page.locator('.library-level[aria-pressed="true"]').getAttribute("data-level"),"2");
   const first=page.locator('.library-level[data-level="1"]');
   await first.click();assert.equal(await root.isVisible(),true);assert.equal(await page.locator("#library-detail-title").innerText(),LEVELS[0].title);
   assert.match(await page.locator("#library-detail-score").innerText(),/2\/3 stars.*2 moves/);
   assert.equal(await first.getAttribute("data-completed"),"true");
   await first.focus();await page.keyboard.press("ArrowRight");
   assert.equal(await page.evaluate(()=>document.activeElement.getAttribute("data-level")),"2");
   assert.equal(await page.locator("#library-detail-title").innerText(),LEVELS[1].title);
   assert.equal(await page.locator("#library-detail-spells").innerText(),"Rotation");
   await page.keyboard.press("Tab");assert.equal(await page.evaluate(()=>document.activeElement.id),"library-play");
   await noOverflow(page,v.name+" chapter");
   await page.screenshot({path:out+"/"+v.name+"-chapter.png",fullPage:true});
   await page.keyboard.press("Enter");await page.locator("#room-view").waitFor();
   assert.match(await page.locator("#room-heading").innerText(),/The Stubborn Gate/);
   await page.locator("#close-room").click();await root.waitFor();
   assert.equal(await root.getAttribute("data-library-mode"),"chapter");
   assert.equal(await page.locator('.library-level[aria-pressed="true"]').getAttribute("data-level"),"2");
   await page.locator("#library-back").click();
   assert.equal(await page.evaluate(()=>document.activeElement.getAttribute("data-chapter")),"1");
   await page.locator('.chapter-card[data-chapter="7"]').click();assert.equal(await tiles.count(),6);
   await page.locator('.library-level[data-level="36"]').click();
   assert.equal(await page.locator("#library-detail-title").innerText(),LEVELS[35].title);
   await noOverflow(page,v.name+" final chapter");
   if(v.name==="classroom")await page.screenshot({path:out+"/classroom-observatory.png",fullPage:true});
   await page.locator("#library-find-secondary").click();assert.equal(await tiles.count(),36);
   await page.locator("#filter-spell").selectOption("reflect");assert.equal(await tiles.count(),13);
   await page.locator("#filter-math").selectOption("5");assert.deepEqual(await tiles.evaluateAll(es=>es.map(e=>Number(e.dataset.level))),[32,35,36]);
   await page.locator("#filter-chapter").selectOption("1");assert.equal(await tiles.count(),0);assert.ok(await play.isDisabled());assert.equal(await page.locator("#library-empty").isVisible(),true);
   await page.locator("#campaign-clear").click();assert.equal(await tiles.count(),36);
   const scroll=await page.locator("#campaign-levels").evaluate(e=>({client:e.clientHeight,full:e.scrollHeight}));
   assert.ok(scroll.full>scroll.client,v.name+" bounded search");
   await page.locator("#filter-puzzle").selectOption("1");assert.equal(await tiles.count(),LEVELS.filter(l=>l.puzzle===1).length);
   await noOverflow(page,v.name+" search");
   if(v.name==="classroom"||v.name==="portrait")await page.screenshot({path:out+"/"+v.name+"-search.png",fullPage:true});
   await page.locator("#close-campaign").click();await page.locator("#open-campaign").click();assert.equal(await root.getAttribute("data-library-mode"),"atlas");assert.equal(await tiles.count(),0);
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
   report.push({name:v.name,width:v.width,height:v.height,zoom:v.zoom??1,atlasRows:rows.map(r=>r.count),artDecoded:7,selection:true,keyboard:true,filters:true,returnSelection:true});
  }finally{await page.close();}
 }
 assert.equal(report.length,viewports.length);
 console.log("LIBRARY ACCEPTANCE: "+report.length+" layouts, illustrated atlas, selected details, explicit play, return and filters.");
}finally{await writeFile(out+"/report.json",JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
