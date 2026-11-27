import {chromium} from "playwright";
import {createStaticServer} from "./serve.mjs";
import {verifyWorkshopBundle} from "../workshop/replay.js";
import {mkdir,readFile} from "node:fs/promises";
import assert from "node:assert/strict";
const server=createStaticServer({workshop:true});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port+"/";
const browser=await chromium.launch({headless:true});
const out="browser-qa";await mkdir(out,{recursive:true});
try{
 for(const [name,width,height] of [["desktop",1366,768],["compact",844,650]]){
  const page=await browser.newPage({viewport:{width,height},acceptDownloads:true,reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(origin+"workshop/index.html");await page.locator('#palette button[data-type="crate"]').waitFor();
  const canvas=page.locator("#workshop-canvas");
  async function point(x,y){
   await canvas.scrollIntoViewIfNeeded();
   const b=await canvas.boundingBox(),host=await page.locator("#canvas-host").boundingBox(),s=Math.min(host.width/40,host.height/14);
   return {x:b.x+b.width*(.5+(x-20)*s/host.width),y:b.y+b.height*(.5-(y-7)*s/host.height)};
  }
  await page.locator('#palette button[data-type="crate"]').click();
  let a=await point(8,3);await page.mouse.click(a.x,a.y);
  const props=page.locator("#properties");
  assert.deepEqual(JSON.parse(await props.inputValue()).vertices[0],[8,3]);
  a=await point(9,4);const b=await point(11,4);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:5});await page.mouse.up();
  assert.deepEqual(JSON.parse(await props.inputValue()).vertices[0],[10,3]);
  await page.locator("#validate").click();assert.match(await page.locator("#status").innerText(),/validated/);
  await page.screenshot({path:out+"/workshop-"+name+"-editor.png",fullPage:true});
  const bad=JSON.parse(await props.inputValue());bad.vertices=bad.vertices.map(([x,y])=>[x,y+2]);
  await props.fill(JSON.stringify(bad));await page.locator("#apply-properties").click();
  await page.locator("#validate").click();assert.match(await page.locator("#status").innerText(),/no support/);
  await page.locator("#template").selectOption("1");await page.locator("#load-template").click();
  await page.locator("#start").click();assert.match(await page.locator("#status").innerText(),/Playtest started/);
  assert.equal(await page.locator("#download").isDisabled(),true);
  async function step(n,jump=false){
   await page.locator("#ticks").fill(String(n));await page.locator("#step-move").selectOption("1");
   if(jump)await page.locator("#step-jump").check();await page.locator("#step").click();
  }
  await step(20);
  await page.locator('#spell-fields [name="dx"]').fill("12");await page.locator('#spell-fields [name="dy"]').fill("0");
  await page.locator("#preview").click();assert.equal(await page.locator("#apply-cast").isEnabled(),true);
  await page.screenshot({path:out+"/workshop-"+name+"-preview.png",fullPage:true});
  await page.locator("#apply-cast").click();assert.match(await page.locator("#attempt").innerText(),/1 moves/);
  await step(195);await step(120,true);await step(400);
  assert.match(await page.locator("#proof").innerText(),/VERIFIED/);
  assert.equal(await page.locator("#download").isEnabled(),true);
  await page.locator("#verify").click();assert.match(await page.locator("#proof").innerText(),/VERIFIED/);
  const [download]=await Promise.all([page.waitForEvent("download"),page.locator("#download").click()]);
  const bundle=JSON.parse(await readFile(await download.path(),"utf8"));assert.equal(verifyWorkshopBundle(bundle).ok,true);
  assert.deepEqual(bundle.actions.slice(0,2).map(a=>a.kind),["step","cast"]);
  await page.screenshot({path:out+"/workshop-"+name+"-verified.png",fullPage:true});
  await page.locator("#copy-bundle").click();await page.locator("#apply-json").click();
  assert.match(await page.locator("#proof").innerText(),/Imported proof replayed successfully/);
  await page.locator("#item-list").selectOption("objects:brook-beam");await page.locator("#apply-properties").click();
  assert.equal(await page.locator("#download").isDisabled(),true);
  assert.deepEqual(errors,[],name+" runtime errors");await page.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
