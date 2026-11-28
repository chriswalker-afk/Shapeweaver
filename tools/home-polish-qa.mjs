// Focused home-screen acceptance, using the actual built application.
import {chromium} from "playwright";
import {createStaticServer} from "./serve.mjs";
import {verifyDist} from "./verify-dist.mjs";
import {LEVELS} from "../src/levels/campaign.js";
import {BEST_RESULTS_KEY} from "../src/core/best-results.js";
import {RESUME_KEY} from "../src/core/home-progress.js";
import {PRESENTATION_KEY} from "../src/core/presentation.js";
import {mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";

const root=fileURLToPath(new URL("../dist/",import.meta.url));
await verifyDist(root);
const server=createStaticServer({root,basePath:"/Shapeweaver/"});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port+"/Shapeweaver/";
const browser=await chromium.launch({headless:true});
const out="browser-qa/home-review";await mkdir(out,{recursive:true});
const report=[];
const labels=["Continue","Puzzle Library","Spellbook","Practice Room"];
const ids=["open-continue","open-campaign","open-spellbook","open-room"];
const longLevel=[...LEVELS].sort((a,b)=>b.title.length-a.title.length)[0];
const allScores=Object.fromEntries(LEVELS.map(l=>[l.id,{moves:l.room.tutorial.efficientMoves,stars:3}]));
const cases=[
 {name:"compact-phone",width:320,height:568,touch:true,compact:true},
 {name:"narrow-phone",width:360,height:640,touch:true,compact:true},
 {name:"portrait-phone",width:390,height:844,touch:true},
 {name:"tablet-portrait",width:768,height:1024,touch:true},
 {name:"short-landscape",width:640,height:360,touch:true,compact:true},
 {name:"landscape-phone",width:844,height:390,touch:true},
 {name:"small-desktop",width:1024,height:600},
 {name:"classroom-desktop",width:1366,height:768},
 {name:"full-hd",width:1920,height:1080},
 {name:"ultrawide",width:2560,height:1080},
 {name:"long-continue",width:390,height:844,touch:true,seed:"resume"},
 {name:"campaign-complete",width:1024,height:600,seed:"complete"},
 {name:"enlarged-text",width:390,height:844,touch:true,zoom:2,seed:"resume"}
];
const waitForMotion=async(page,state)=>{await page.waitForFunction(s=>document.getElementById("title-art").getAttribute("data-home-motion")===s,state);};
async function seed(page,mode){
 if(!mode)return;
 await page.addInitScript(({mode,bestKey,resumeKey,level,scores})=>{
  if(mode==="resume")localStorage.setItem(resumeKey,JSON.stringify({version:1,route:level}));
  if(mode==="complete")localStorage.setItem(bestKey,JSON.stringify({version:1,levels:scores}));
 },{mode,bestKey:BEST_RESULTS_KEY,resumeKey:RESUME_KEY,level:longLevel.route,scores:allScores});
}
async function verifyLayout(page,c){
 const result=await page.evaluate(()=>{
  const $=s=>document.querySelector(s),rect=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top+scrollY,bottom:b.bottom+scrollY,width:b.width,height:b.height};};
  const doc=document.documentElement,menu=rect($(".title-content")),scene=rect($(".home-scene-space")),svg=$("#home-showcase");
  const rgb=s=>s.startsWith("#")?s.slice(1).match(/../g).map(x=>parseInt(x,16)):s.match(/[\d.]+/g).map(Number);
  const lum=a=>a.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const contrast=(fg,bg)=>(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
  const cards=[...document.querySelectorAll(".home-card")].map(card=>{
   const style=getComputedStyle(card),base=rgb(style.getPropertyValue("--card-base").trim()),light=rgb(style.getPropertyValue("--card-light").trim());
   const alpha=(light[3]??255)/255;
   // Upper bound per channel: the light overlay at maximum opacity on
   // the brighter of the two gradient endpoints. Conservative for text.
   const bg=base.slice(0,3).map((v,i)=>Math.max(Math.max(v,[37,35,56][i]),Math.max(v,[37,35,56][i])*(1-alpha)+light[i]*alpha));
   const texts=[...card.querySelectorAll(".home-card-copy strong,.home-card-copy > span,.home-card-copy small")].filter(e=>!e.hidden);
   const b=rect(card),art=rect(card.querySelector("img")),copy=rect(card.querySelector(".home-card-copy"));
   return {id:card.id,b,art,copy,copyFits:card.scrollWidth<=card.clientWidth+1&&card.scrollHeight<=card.clientHeight+1&&texts.every(e=>e.scrollWidth<=e.clientWidth+1),
    contrast:Math.min(...texts.map(e=>contrast(rgb(getComputedStyle(e).color),bg)))};
  });
  return {width:innerWidth,height:innerHeight,scrollWidth:doc.scrollWidth,scrollHeight:doc.scrollHeight,menu,scene,
   projection:getComputedStyle(svg).display!=="none"&&svg.getBoundingClientRect().width>0&&svg.getBoundingClientRect().height>0?rect(svg):null,
   pointer:getComputedStyle(svg).pointerEvents,cards,progressFits:$(".home-progress").scrollWidth<=$(".home-progress").clientWidth+1};
 });
 assert.ok(result.scrollWidth<=c.width+1,c.name+" no horizontal scrolling");
 assert.ok(result.progressFits,c.name+" progress strip fits");
 for(const {id,b,art,copy,copyFits,contrast} of result.cards){
  assert.ok(b.width>=44&&b.height>=44,c.name+" "+id+" touch target");
  assert.ok(b.left>=-1&&b.right<=c.width+1&&b.top>=0&&b.bottom<=result.scrollHeight+1,c.name+" "+id+" inside document");
  assert.ok(art.width>=30&&art.height>=30,c.name+" "+id+" art visible");
  assert.ok(art.right<=copy.left+1||art.bottom<=copy.top+1,c.name+" "+id+" art clear of copy");
  assert.ok(copyFits,c.name+" "+id+" copy fits without clipping");
  assert.ok(contrast>=4.5,c.name+" "+id+" text contrast lower bound "+contrast.toFixed(2));
 }
 assert.equal(result.pointer,"none");
 if(c.compact)assert.equal(result.projection,null,c.name+" compact projection suppressed");
 else if(!c.zoom){
  assert.ok(result.projection,c.name+" projection visible");
  const p=result.projection,m=result.menu,s=result.scene;
  assert.ok(p.left>=s.left-1&&p.right<=s.right+1&&p.top>=s.top-1&&p.bottom<=s.bottom+1,c.name+" projection contained by scenery");
  assert.ok(p.left>=m.right-1||p.bottom<=m.top+1,c.name+" projection clear of menu");
 }
 return result;
}
try{
 for(const c of cases){
  const page=await browser.newPage({viewport:{width:c.width,height:c.height},hasTouch:Boolean(c.touch),reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   await seed(page,c.seed);await page.goto(url);
   await waitForMotion(page,c.compact?"inactive":"static");
   if(c.zoom)await page.evaluate(n=>document.documentElement.style.fontSize=(n*100)+"%",c.zoom);
   await page.locator("#open-continue").waitFor();
   const home=page.locator("#title-view");assert.equal(await home.locator("button").count(),4);
   for(const [i,name] of labels.entries())assert.equal(await home.getByRole("button",{name,exact:true}).getAttribute("id"),ids[i]);
   if(c.seed==="resume"){assert.match(await page.locator("#continue-detail").innerText(),new RegExp("Return to Level "+longLevel.number));assert.match(await page.locator("#continue-note").innerText(),/entrance/);}
   else if(c.seed==="complete"){assert.equal(await page.locator("#continue-detail").innerText(),"Adventure complete");assert.equal(await page.locator("#home-stars-text").innerText(),"108 / 108 stars");}
   else{assert.match(await page.locator("#continue-detail").innerText(),/Begin · Level 1/);assert.equal(await page.locator("#home-stars-text").innerText(),"0 / 108 stars");}
   const layout=await verifyLayout(page,c);
   await page.screenshot({path:out+"/"+c.name+".png",fullPage:true});
   await page.locator("#open-continue").focus();
   for(const [i,id] of ids.entries()){
    if(i)await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(()=>document.activeElement.id),id,c.name+" tab order");
    const focus=await page.locator("#"+id).evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:parseFloat(getComputedStyle(e).outlineWidth)}));
    assert.ok(focus.style!=="none"&&focus.width>=2,c.name+" visible keyboard focus");
   }
   if(c.seed==="complete"){
    await page.locator("#open-continue").focus();await page.keyboard.press("Enter");await page.locator("#campaign-view").waitFor();
    assert.equal(await page.evaluate(()=>document.activeElement.id),"campaign-heading");
    await page.locator("#close-campaign").click();
   }else{
    if(c.touch)await page.locator("#open-room").tap();else await page.keyboard.press("Enter");
    await page.locator("#room-view").waitFor();assert.equal(await page.evaluate(()=>document.activeElement.id),"room-heading");
    await page.locator("#close-room").click();
   }
   assert.equal(await page.evaluate(()=>document.activeElement.id),"open-continue");
   assert.deepEqual(errors,[]);
   report.push({name:c.name,width:c.width,height:c.height,zoom:c.zoom??1,compact:Boolean(c.compact),documentHeight:layout.scrollHeight,minimumCardContrast:Math.min(...layout.cards.map(x=>x.contrast)),keyboard:true,touch:Boolean(c.touch),projection:Boolean(layout.projection)});
  }finally{await page.close();}
 }
 // Normal motion and mutation budget: actual SVG attributes, not a timer mock.
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:"no-preference"});
 try{
  await page.clock.install();await page.goto(url);await waitForMotion(page,"running");
  await page.clock.runFor(3100); // settled translation, before the fade out
  assert.equal(await page.locator("#home-showcase").getAttribute("data-showcase-progress"),"1");
  await page.evaluate(()=>{window.__homeMutations=0;window.__homeObserver=new MutationObserver(records=>window.__homeMutations+=records.length);window.__homeObserver.observe(document.getElementById("home-showcase"),{attributes:true,subtree:true,childList:true,characterData:true});});
  await page.clock.runFor(700);
  const idle=await page.evaluate(()=>window.__homeMutations);
  assert.equal(idle,0,"no redundant writes during settled hold");
  await page.locator("#home-motion-toggle").focus();await page.keyboard.press("Space");await waitForMotion(page,"paused");
  await page.evaluate(()=>window.__homeMutations=0);await page.clock.runFor(2000);
  assert.equal(await page.evaluate(()=>window.__homeMutations),0,"no writes when paused");
  await page.screenshot({path:out+"/classroom-desktop-magic-paused.png",fullPage:true});
  await page.setViewportSize({width:360,height:640});await waitForMotion(page,"inactive");
  assert.equal(await page.locator("#home-showcase").isHidden(),true);
  assert.equal(await page.locator("#home-motion-toggle").isHidden(),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),"open-continue","focus returns to menu when control disappears");
  await page.setViewportSize({width:1366,height:768});await waitForMotion(page,"paused");
  await page.locator("#home-motion-toggle").focus();await page.keyboard.press("Enter");await waitForMotion(page,"running");
  await page.locator("#home-motion-toggle").focus();await page.emulateMedia({reducedMotion:"reduce"});await waitForMotion(page,"static");
  assert.equal(await page.evaluate(()=>document.activeElement.id),"open-continue");
  assert.equal(await page.locator("#home-showcase").getAttribute("data-showcase-progress"),"1");
  await page.emulateMedia({reducedMotion:"no-preference"});await waitForMotion(page,"running");
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({version:1,sound:false,reduced:true})),PRESENTATION_KEY);
  await page.reload();await waitForMotion(page,"static");
  assert.equal(await page.locator("#home-motion-toggle").isHidden(),true);
  report.push({name:"motion-lifecycle",settledMutations:idle,pausedMutations:0,resizeFocus:true,systemReduced:true,persistedReduced:true});
 }finally{await page.close();}
 assert.equal(report.length,cases.length+1);
 console.log("HOME ACCEPTANCE: "+cases.length+" layout/progress cases, motion lifecycle and screenshot artifact.");
}finally{
 await writeFile(out+"/report.json",JSON.stringify(report,null,2));
 await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
