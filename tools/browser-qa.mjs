// Optional browser-only QA dependency installed by .github/workflows/browser-qa.yml.
import {chromium} from "playwright";
import {createStaticServer} from "./serve.mjs";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const server=createStaticServer();
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port+"/";
const browser=await chromium.launch({headless:true});
const out="browser-qa";await mkdir(out,{recursive:true});
const report=[];
const cases=[
 ["brook-beam","translate",{dx:"12",dy:"0"}],
 ["stubborn-gate","rotate",{angle:"90",direction:"anticlockwise",cx:"14",cy:"8"}],
 ["cheesy-wedge","enlarge",{factor:"3",cx:"25",cy:"3"}],
 ["missing-barrel","reflect",{line:"x=15"}]
];
const clockwork=[[["socket-beam","translate",{dx:"11",dy:"0"}],["socket-beam","rotate",{angle:"90",direction:"clockwise",cx:"17",cy:"3"}]],[["clearance-plank","rotate",{angle:"90",direction:"clockwise",cx:"6",cy:"3"}],["clearance-plank","translate",{dx:"17",dy:"0"}]]];
const gardens=[ [["garden-beam","translate",{dx:"12",dy:"0"}],["garden-hinge","rotate",{angle:"90",direction:"anticlockwise",cx:"37",cy:"8"}]], [["garden-barrel","reflect",{line:"x=9"}],["garden-mushroom","enlarge",{factor:"2",cx:"30",cy:"3"}]], [["garden-ladder","rotate",{angle:"90",direction:"anticlockwise",cx:"24",cy:"12"}],["ladder-crate","translate",{dx:"17",dy:"0"}]], [["mirror-platform","reflect",{line:"y=3"}],["garden-wedge","enlarge",{factor:"3",cx:"34",cy:"7"}]] ];
try{
 for(const [name,width,height,touch] of [["desktop",1366,768,false],["small-desktop",1024,600,false],["landscape-phone",844,390,true],["portrait-phone",390,844,true]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(origin);await page.locator("#open-level1").waitFor();
  await page.locator("#open-campaign").click();
  await page.locator("#campaign-view").waitFor();
  assert.equal(await page.locator(".chapter-card").count(),7);
  assert.equal(await page.locator(".chapter-card:disabled").count(),4);
  assert.equal(await page.locator(".library-level").count(),10);
  await page.locator("#filter-spell").selectOption("reflect");
  assert.equal(await page.locator(".library-level").count(),3);
  await page.locator(".library-level").filter({hasText:"The Missing Barrel"}).click();
  assert.match(await page.locator("#room-heading").innerText(),/The Missing Barrel/);
  await page.locator("#close-room").click();
  await page.locator("#open-campaign").click();
  await page.locator("#campaign-clear").click();
  assert.equal(await page.locator(".library-level").count(),10);
  await page.screenshot({path:out+"/"+name+"-campaign.png",fullPage:true});
  await page.locator("#campaign-resume").click();
  assert.match(await page.locator("#room-heading").innerText(),/Across the Brook/);
  await page.locator("#close-room").click();
  for(const [index,[id,type,fields]] of cases.entries()){
   await page.locator("#open-level"+(index+1)).click();
   await page.locator("#room-canvas").waitFor();
   const initial=await page.locator("#room-stage").boundingBox();
   assert.ok(initial&&initial.height>=138,name+" stage");
   assert.ok(await page.locator("#room-secondary-tools").isHidden(),name+" tools initially collapsed");
   await page.screenshot({path:out+"/"+name+"-level"+(index+1)+"-initial.png",fullPage:true});
   await page.locator("#object-toggle").click();
   await page.locator("#object-select").selectOption(id);
   await page.locator("#object-spell").selectOption(type);
   for(const [key,value] of Object.entries(fields)){
    const field=page.locator('#object-fields [name="'+key+'"]');
    if(await field.evaluate(e=>e.tagName==="SELECT"))await field.selectOption(value);else await field.fill(value);
   }
   await page.locator('#object-form button[type="submit"]').click();
   assert.equal(await page.locator("#object-apply").isEnabled(),true,name+" legal preview "+id);
   const inspected=await page.locator("#room-stage").boundingBox();
   await page.screenshot({path:out+"/"+name+"-level"+(index+1)+"-preview.png",fullPage:true});
   await page.locator("#object-apply").click();
   assert.match(await page.locator("#tutorial-moves").innerText(),/Moves: 1/);
   report.push({viewport:name,level:index+1,stageHeight:initial.height,inspectionHeight:inspected.height});
   await page.locator("#close-room").click();
  }
  for(const [index,spells] of [...gardens,...clockwork].entries()){
   await page.locator("#open-campaign").click();
   await page.locator("#campaign-clear").click();
   const chapter=index<4?"2":"3";
   await page.locator("#filter-chapter").selectOption(chapter);
   assert.equal(await page.locator(".library-level").count(),chapter==="2"?4:2);
   await page.locator(".library-level").nth(index<4?index:index-4).click();
   await page.locator("#room-canvas").waitFor();
   const initial=await page.locator("#room-stage").boundingBox();
   assert.ok(initial.height>=138);
   await page.screenshot({path:out+"/"+name+"-level"+(index+5)+"-initial.png",fullPage:true});
   for(const [move,[id,type,fields]] of spells.entries()){
    await page.locator("#object-toggle").click();
    await page.locator("#object-select").selectOption(id);await page.locator("#object-spell").selectOption(type);
    for(const [key,value] of Object.entries(fields)){
     const field=page.locator('#object-fields [name="'+key+'"]');
     if(await field.evaluate(e=>e.tagName==="SELECT"))await field.selectOption(value);else await field.fill(value);
    }
    await page.locator('#object-form button[type="submit"]').click();
    assert.equal(await page.locator("#object-apply").isEnabled(),true,name+" legal preview "+id);
    if(id==="garden-barrel")assert.match(await page.locator("#object-result").innerText(),/gate will open/);
    if(id==="garden-ladder")assert.match(await page.locator("#object-result").innerText(),/upright and climbable/);
    if(id==="socket-beam"&&type==="translate")assert.match(await page.locator("#object-result").innerText(),/Hinge will dock/);
    if(id==="socket-beam"&&type==="rotate")assert.match(await page.locator("#object-permissions").innerText(),/\(docked\)/);
    await page.screenshot({path:out+"/"+name+"-level"+(index+5)+"-cast"+(move+1)+".png",fullPage:true});
    await page.locator("#object-apply").click();
    assert.match(await page.locator("#tutorial-moves").innerText(),new RegExp("Moves: "+(move+1)));
    if(id==="garden-ladder")assert.equal(await page.locator("#climb-controls").isVisible(),true);
   }
   await page.screenshot({path:out+"/"+name+"-level"+(index+5)+"-ready.png",fullPage:true});
   report.push({viewport:name,level:index+5,stageHeight:initial.height,casts:2});
   await page.locator("#close-room").click();
  }
  assert.deepEqual(errors,[],name+" runtime errors");await page.close();
 }
}finally{
 await writeFile(out+"/layout-report.json",JSON.stringify(report,null,2));
 await browser.close();await new Promise(resolve=>server.close(resolve));
}
