// Focused acceptance of the production HUD, real input and safe reset.
import {chromium} from "playwright";
import {fileURLToPath} from "node:url";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {createStaticServer} from "./serve.mjs";
import {verifyDist} from "./verify-dist.mjs";
import {LEVELS} from "../src/levels/campaign.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
const root=fileURLToPath(new URL("../dist/",import.meta.url));
await verifyDist(root);
const server=createStaticServer({root,basePath:"/Shapeweaver/"});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const url="http://127.0.0.1:"+server.address().port+"/Shapeweaver/",browser=await chromium.launch({headless:true});
const out="browser-qa/gameplay-hud-review";await mkdir(out,{recursive:true});
const report=[],cases=[
 {name:"classroom",width:1366,height:768},
 {name:"small-desktop",width:1024,height:600},
 {name:"landscape",width:844,height:390,touch:true},
 {name:"portrait",width:390,height:844,touch:true},
 {name:"compact",width:320,height:568,touch:true},
 {name:"tablet",width:768,height:1024,touch:true},
 {name:"enlarged-text",width:390,height:844,touch:true,zoom:2}
];
const ladder=LEVELS.find(l=>createPhysicsWorld(l.room).ladders.length>0);
assert.ok(ladder,"campaign has a ladder room");
const box=async(locator)=>{const b=await locator.boundingBox();assert.ok(b,"expected visible "+locator);return b;};
const centre=b=>({x:b.x+b.width/2,y:b.y+b.height/2});
const held=(page,action)=>page.locator('[data-move="'+action+'"][data-held="true"]');
async function geometry(page,c){
 const info=await page.evaluate(()=>{
  const rect=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
  const q=id=>document.getElementById(id),canvas=rect(q("room-canvas")),field=rect(q("room-playfield")),stage=rect(q("room-stage")),dock=rect(q("movement-controls")),tools=rect(document.querySelector(".stage-tools"));
  const visible=[...q("room-view").querySelectorAll("button")].filter(b=>b.getClientRects().length&&!b.closest("dialog:not([open])")).map(b=>({id:b.id||b.dataset.move,rect:rect(b)}));
  const css=getComputedStyle(q("movement-controls").querySelector("[data-move=left]"));
  return {canvas,field,stage,dock,tools,visible,round:css.borderRadius,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth};
 });
 assert.ok(info.documentWidth<=info.viewport+1,c.name+" horizontal overflow "+JSON.stringify(info));
 assert.ok(info.field.height>=138,c.name+" playable area too short");
 assert.ok(Math.abs(info.canvas.width-info.field.width)<=1&&Math.abs(info.canvas.height-info.field.height)<=1,c.name+" canvas uses measured playfield");
 assert.ok(info.tools.bottom<=info.field.y+1,c.name+" toolbar outside maths");
 assert.ok(info.dock.y>=info.field.bottom-1&&info.dock.bottom<=info.stage.bottom+1,c.name+" gamepad in stage but outside maths");
 assert.match(info.round,/50%/);
 for(const item of info.visible){
  const b=item.rect;
  assert.ok(b.x>=-1&&b.right<=c.width+1,c.name+" "+item.id+" outside horizontal viewport");
  if(c.touch)assert.ok(b.height>=44||!["left","right","up","down","jump","close-room","room-tools-toggle","tutorial-hint","return-safety","undo-cast","object-toggle","grid-toggle","quick-camera"].includes(item.id),c.name+" "+item.id+" touch target "+b.height);
 }
 const left=await box(page.locator('[data-move="left"]')),jump=await box(page.locator('[data-move="jump"]'));
 assert.ok(left.width>=44&&left.height>=44&&jump.width>left.width&&jump.height>left.height);
 assert.ok(left.x<info.field.x+info.field.width/2&&jump.x>info.field.x+info.field.width/2);
 return info;
}
async function reset(page,confirm=true){
 const settings=page.locator("#room-tools-toggle"),dialog=page.locator("#room-reset-dialog");
 if(await settings.getAttribute("aria-expanded")==="false")await settings.click();
 await page.locator("#reset-practice").click();await dialog.waitFor({state:"visible"});
 assert.equal(await page.evaluate(()=>document.activeElement.id),"room-reset-cancel");
 if(confirm){await page.locator("#room-reset-confirm").click();await dialog.waitFor({state:"hidden"});assert.equal(await settings.getAttribute("aria-expanded"),"false");}
 else{await page.keyboard.press("Escape");await dialog.waitFor({state:"hidden"});assert.equal(await page.evaluate(()=>document.activeElement.id),"reset-practice");}
}
async function testInput(page,c){
 const left=page.locator('[data-move="left"]'),right=page.locator('[data-move="right"]'),jump=page.locator('[data-move="jump"]');
 if(c.touch){
  await right.scrollIntoViewIfNeeded();await jump.scrollIntoViewIfNeeded();
  const a=centre(await box(right)),b=centre(await box(jump)),cdp=await page.context().newCDPSession(page);
  try{
   await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...a,id:1},{...b,id:2}]});
   await held(page,"right").waitFor();await held(page,"jump").waitFor();
   await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
   await held(page,"right").waitFor({state:"detached"});await held(page,"jump").waitFor({state:"detached"});
  }finally{await cdp.send("Input.dispatchTouchEvent",{type:"touchCancel",touchPoints:[]}).catch(()=>{});await cdp.detach();}
 }else{
  await page.locator("#room-canvas").focus();await page.keyboard.down("ArrowRight");
  try{
   await held(page,"right").waitFor();
   const p=centre(await box(jump));await page.mouse.move(p.x,p.y);await page.mouse.down();
   try{
    await held(page,"jump").waitFor();await page.keyboard.up("ArrowRight");
    await held(page,"right").waitFor({state:"detached"});assert.equal(await jump.getAttribute("data-held"),"true");
   }finally{await page.mouse.up();}
  }finally{await page.keyboard.up("ArrowRight");}
  assert.equal(await jump.getAttribute("data-held"),"false");
  await left.focus();await page.keyboard.down("Space");
  try{await held(page,"left").waitFor();}finally{await page.keyboard.up("Space");}
  assert.equal(await left.getAttribute("data-held"),"false");
 }
}
try{
 for(const c of cases){
  const page=await browser.newPage({viewport:{width:c.width,height:c.height},hasTouch:Boolean(c.touch),reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto(url);await page.locator("#open-continue").click();
   if(c.zoom)await page.evaluate(n=>document.documentElement.style.fontSize=(100*n)+"%",c.zoom);
   await page.locator("#room-canvas").waitFor();
   const settings=page.locator("#room-tools-toggle"),moves=page.locator("#tutorial-moves"),pad=page.locator("#movement-controls");
   assert.match(await page.locator("#room-heading").innerText(),/Across the Brook/);
   assert.equal(await settings.getAttribute("aria-expanded"),"false");
   assert.equal(await page.locator("#reset-practice").isHidden(),true);
   assert.equal(await page.locator("#room-secondary-tools").isHidden(),true);
   assert.equal(await page.locator("#climb-controls").isHidden(),true);
   assert.equal(await moves.innerText(),"Moves: 0");
   assert.equal(await page.locator("#undo-cast").isDisabled(),true);
   const g=await geometry(page,c);
   await page.screenshot({path:out+"/"+c.name+"-play.png",fullPage:true});
   await testInput(page,c);await reset(page);
   // Quick tools retain their original behavior and SVG after label updates.
   for(const id of ["grid-toggle","quick-camera"]){
    const button=page.locator("#"+id),initial=await button.getAttribute("aria-pressed");
    await button.click();assert.notEqual(await button.getAttribute("aria-pressed"),initial);
    await button.click();assert.equal(await button.getAttribute("aria-pressed"),initial);
    assert.equal(await button.locator("svg.hud-icon").count(),1);
   }
   await settings.click();assert.equal(await settings.getAttribute("aria-expanded"),"true");
   assert.equal(await page.locator(".hud-group-label").count(),4);
   await page.locator("#tutorial-guidance-toggle").click();assert.equal(await page.locator("#tutorial-guide").isHidden(),true);
   await page.locator("#tutorial-guidance-toggle").click();
   if(c.name==="classroom"||c.name==="portrait")await page.screenshot({path:out+"/"+c.name+"-settings.png",fullPage:true});
   await page.keyboard.press("Escape");assert.equal(await settings.getAttribute("aria-expanded"),"false");assert.equal(await page.evaluate(()=>document.activeElement.id),"room-tools-toggle");
   await page.locator("#object-toggle").click();assert.equal(await pad.isHidden(),true);
   assert.equal(await page.locator("#object-toggle svg").count(),1);
   await page.locator("#object-select").selectOption("brook-beam");
   await page.locator("#object-spell").selectOption("translate");
   await page.locator('#object-fields [name="dx"]').fill("12");
   await page.locator('#object-fields [name="dy"]').fill("0");
   await page.locator('#object-form button[type="submit"]').click();
   assert.ok(await page.locator("#object-apply").isEnabled());
   if(c.name==="classroom"||c.name==="landscape")await page.screenshot({path:out+"/"+c.name+"-inspector.png",fullPage:true});
   await page.locator("#object-apply").click();
   assert.equal(await moves.innerText(),"Moves: 1");assert.equal(await pad.isVisible(),true);
   assert.equal(await page.locator("#undo-cast svg").count(),1);assert.equal(await page.locator("#undo-cast").isEnabled(),true);
   await reset(page,false);assert.equal(await moves.innerText(),"Moves: 1");assert.ok(await page.locator("#undo-cast").isEnabled());
   await page.locator("#reset-practice").click();await page.locator("#room-reset-dialog").waitFor();
   if(c.name==="classroom")await page.screenshot({path:out+"/classroom-reset.png",fullPage:true});
   await page.locator("#room-reset-cancel").click();assert.equal(await moves.innerText(),"Moves: 1");
   await reset(page,true);assert.equal(await moves.innerText(),"Moves: 0");assert.ok(await page.locator("#undo-cast").isDisabled());
   await page.locator("#close-room").click();await page.locator("#campaign-view").waitFor();
   await page.locator("#library-back").click();await page.locator('.chapter-card[data-chapter="'+ladder.chapter+'"]').click();
   await page.locator('.library-level[data-level="'+ladder.number+'"]').click();await page.locator("#library-play").click();
   await page.locator("#climb-controls").waitFor();await geometry(page,c);
   if(c.name==="portrait"||c.name==="landscape")await page.screenshot({path:out+"/"+c.name+"-ladder.png",fullPage:true});
   assert.deepEqual(errors,[]);
   report.push({name:c.name,width:c.width,height:c.height,zoom:c.zoom??1,playfieldHeight:g.field.height,touch:Boolean(c.touch),controlsInStage:true,independentInput:true,settings:true,resetConfirmation:true,ladderControls:true});
  }catch(error){await page.screenshot({path:out+"/"+c.name+"-failure.png",fullPage:true}).catch(()=>{});throw error;}
  finally{await page.close();}
 }
 assert.equal(report.length,cases.length);
 console.log("GAMEPLAY HUD ACCEPTANCE: "+report.length+" layouts; independent inputs, safe canvas, settings, spell editor and reset confirmed.");
}finally{await writeFile(out+"/report.json",JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
