// Optional browser-only QA dependency installed by .github/workflows/browser-qa.yml.
import {chromium} from "playwright";
import {createStaticServer} from "./serve.mjs";
import {build} from "./build.mjs";
import {verifyDist} from "./verify-dist.mjs";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {browserQaOptions,captureLevel,assertBrowserCoverage} from "./browser-qa-plan.mjs";
const options=browserQaOptions(process.argv.slice(2)),started=Date.now();
const dist=await build();await verifyDist(dist);
const server=createStaticServer({root:dist,basePath:"/Shapeweaver/"});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port+"/Shapeweaver/";
const browser=await chromium.launch({headless:true});
const out=options.viewport?"browser-qa/campaign-"+options.viewport:"browser-qa";
await mkdir(out,{recursive:true});
let screenshotCount=0,passed=false;
async function capture(page,file,level=null){
 if(level!==null&&!captureLevel(level,options.screenshots))return;
 await page.screenshot({path:out+"/"+file,fullPage:true});screenshotCount++;
}
async function captureFailure(page,file){
 try{await capture(page,file);}catch(error){console.warn("Failure screenshot unavailable:",error.message);}
}
async function backToTitle(page){await page.locator("#close-room").click();await page.locator("#campaign-view").waitFor();await page.locator("#close-campaign").click();}
const report=[],showcaseReport=[];
const viewports=options.viewports.map(v=>v[0]);
const cases=[
 ["brook-beam","translate",{dx:"12",dy:"0"}],
 ["stubborn-gate","rotate",{angle:"90",direction:"anticlockwise",cx:"14",cy:"8"}],
 ["cheesy-wedge","enlarge",{factor:"3",cx:"25",cy:"3"}],
 ["missing-barrel","reflect",{line:"x=15"}]
];
const clockwork=[[["socket-beam","translate",{dx:"11",dy:"0"}],["socket-beam","rotate",{angle:"90",direction:"clockwise",cx:"17",cy:"3"}]],[["clearance-plank","rotate",{angle:"90",direction:"clockwise",cx:"6",cy:"3"}],["clearance-plank","translate",{dx:"17",dy:"0"}]],[["clockwork-wedge","reflect",{line:"x=13"}],["clockwork-wedge","enlarge",{factor:"3",cx:"10",cy:"3"}]],[["brass-key","enlarge",{factor:"2",cx:"8",cy:"5"}],["brass-key","rotate",{angle:"90",direction:"clockwise",cx:"13",cy:"8"}]]];
const riverworks=[[["east-span","translate",{dx:"25",dy:"0"}],["west-span","translate",{dx:"26",dy:"0"}]],[["lower-step","translate",{dx:"15",dy:"0"}],["upper-step","translate",{dx:"26",dy:"0"}],["service-ladder","rotate",{angle:"90",direction:"anticlockwise",cx:"34",cy:"15"}]],[["sluice-barrel","reflect",{line:"x=10"}],["sluice-crate","translate",{dx:"6",dy:"0"}]],[["diagonal-bracket","reflect",{line:"y=x"}],["dock-span","translate",{dx:"-12",dy:"0"}]],[["mill-rotor","rotate",{angle:"90",direction:"clockwise",cx:"32",cy:"11"}],["mill-ramp","enlarge",{factor:"3",cx:"24",cy:"3"}]],[["orbit-walkway","rotate",{angle:"180",direction:"clockwise",cx:"32",cy:"11"}],["tower-span","translate",{dx:"14",dy:"0"}]]];
const archives=[[["archive-crate","translate",{dx:"13",dy:"0"}]],[["archive-ladder","translate",{dx:"14",dy:"0"}]],[["latch-weight","translate",{dx:"6",dy:"0"}]],[["passage-weight","translate",{dx:"6",dy:"0"}]],[["double-seal","rotate",{angle:"180",direction:"clockwise",cx:"7.5",cy:"13.5"}],["double-seal","translate",{dx:"12",dy:"-3"}]],[["chain-comb","translate",{dx:"8",dy:"0"}],["chain-key","rotate",{angle:"90",direction:"clockwise",cx:"5",cy:"14"}],["chain-key","translate",{dx:"27",dy:"0"}]]];
const alchemists=[[["oversized-block","enlarge",{factor:"1/2",cx:"20",cy:"3"}]],[["resizable-bridge","enlarge",{factor:"1/2",cx:"4",cy:"11"}],["resizable-bridge","translate",{dx:"27",dy:"0"}],["resizable-bridge","enlarge",{factor:"2",cx:"34",cy:"19.5"}]],[["wandering-socket","translate",{dx:"14",dy:"0"}],["wandering-beam","rotate",{angle:"90",direction:"clockwise",cx:"22",cy:"4"}]],[["mirror-socket","reflect",{line:"x=17"}],["mirror-beam","rotate",{angle:"90",direction:"clockwise",cx:"24",cy:"4"}]],[["selector-weight","translate",{dx:"-6",dy:"0"}]],[["trial-bridge","enlarge",{factor:"1/2",cx:"4",cy:"11"}],["trial-bridge","translate",{dx:"27",dy:"0"}],["trial-bridge","enlarge",{factor:"2",cx:"34",cy:"18"}]]];
const observatory=[[["star-mirror","translate",{dx:"9",dy:"0"}],["star-deck","reflect",{line:"x=19"}]],[["orbit-socket","translate",{dx:"14",dy:"0"}],["orbit-beam","rotate",{angle:"90",direction:"clockwise",cx:"22",cy:"4"}]],[["long-star-deck","translate",{dx:"18",dy:"-13"}]],[["rescue-deck","translate",{dx:"18",dy:"0"}],["lost-crystal","reflect",{line:"x=23"}]],[["machine-fork","translate",{dx:"4",dy:"0"}],["machine-deck","translate",{dx:"18",dy:"0"}]],[["ascent-deck","translate",{dx:"20",dy:"-3"}]]];
const gardens=[ [["garden-beam","translate",{dx:"12",dy:"0"}],["garden-hinge","rotate",{angle:"90",direction:"anticlockwise",cx:"37",cy:"8"}]], [["garden-barrel","reflect",{line:"x=9"}],["garden-mushroom","enlarge",{factor:"2",cx:"30",cy:"3"}]], [["garden-ladder","rotate",{angle:"90",direction:"anticlockwise",cx:"24",cy:"12"}],["ladder-crate","translate",{dx:"17",dy:"0"}]], [["mirror-platform","reflect",{line:"y=3"}],["garden-wedge","enlarge",{factor:"3",cx:"34",cy:"7"}]] ];
try{
 for(const [name,width,height,touch] of options.viewports){
  const page=await browser.newPage({viewport:{width,height},hasTouch:touch,reducedMotion:"reduce"});
  try{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(origin);await page.locator("#open-continue").waitFor();
  const home=page.locator("#title-view"),cards=home.locator(".home-card");
  assert.equal(await home.locator("button").count(),4);
  assert.deepEqual(await cards.locator("strong").allTextContents(),["Continue","Puzzle Library","Spellbook","Practice Room"]);
  assert.match(await page.locator("#continue-detail").innerText(),/Begin · Level 1/);
  const hero=page.locator(".home-kingdom-composition"),legacy=page.locator(".legacy-menu-composition");
  assert.equal(await hero.isVisible(),true);assert.equal(await legacy.isVisible(),false);
  assert.equal(await hero.getAttribute("aria-hidden"),"true");
  const heroSize=await page.locator("#home-kingdom-art").evaluate(async el=>{
   const img=new Image();img.src=el.getAttribute("href");await img.decode();
   return [img.naturalWidth,img.naturalHeight];
  });
  assert.deepEqual(heroSize,[1440,800],name+" home hero decoded");
  for(const card of await cards.all()){
   const b=await card.boundingBox();assert.ok(b&&b.x>=0&&b.x+b.width<=width+1&&b.y>=0&&b.y+b.height<=height+1,name+" home card fits");
   assert.ok(b.height>=44);
   const image=card.locator("img"),copy=card.locator(".home-card-copy");
   assert.deepEqual(await image.evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight,img.alt];}),[160,132,""]);
   const artBox=await image.boundingBox(),copyBox=await copy.boundingBox();
   assert.ok(artBox&&copyBox&&artBox.width>=30&&artBox.height>=30,name+" art visible");
   assert.ok(artBox.x+artBox.width<=copyBox.x+1||artBox.y+artBox.height<=copyBox.y+1,name+" art never covers copy");
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+" no horizontal overflow");
  const projection=page.locator("#home-showcase");
  assert.equal(await projection.isVisible(),true);
  assert.equal(await projection.getAttribute("aria-hidden"),"true");
  assert.equal(await page.locator("#title-art").getAttribute("data-home-motion"),"static");
  assert.equal(await projection.getAttribute("data-showcase-progress"),"1");
  assert.equal(await page.locator("#home-motion-toggle").isHidden(),true);
  assert.equal(await page.locator("#showcase-moving").getAttribute("points"),await page.locator("#showcase-target").getAttribute("points"));
  const projectionBounds=await projection.boundingBox(),menuBounds=await home.locator(".title-content").boundingBox();
  assert.ok(projectionBounds&&menuBounds&&(projectionBounds.x>=menuBounds.x+menuBounds.width-1||projectionBounds.y+projectionBounds.height<=menuBounds.y+1),name+" projection stays outside menu copy");
  await capture(page,name+"-home.png");
  // Exercise normal motion too, without duplicating the whole campaign.
  const motion=await browser.newPage({viewport:{width,height},hasTouch:touch,reducedMotion:"no-preference"});
  const motionErrors=[];motion.on("pageerror",e=>motionErrors.push(e.message));
  try{
   await motion.clock.install();
   await motion.goto(origin);
   const art=motion.locator("#title-art"),magic=motion.locator("#home-motion-toggle"),svg=motion.locator("#home-showcase"),moving=motion.locator("#showcase-moving");
   await magic.waitFor();
   assert.equal(await art.getAttribute("data-home-motion"),"running");
   assert.equal(await svg.evaluate(el=>getComputedStyle(el).pointerEvents),"none");
   assert.equal(await motion.locator("#title-view button").count(),4);
   const motionBox=await svg.boundingBox(),contentBox=await motion.locator(".title-content").boundingBox();
   assert.ok(motionBox&&contentBox&&(motionBox.x>=contentBox.x+contentBox.width-1||motionBox.y+motionBox.height<=contentBox.y+1),name+" animated art clear of menu");
   assert.ok(await motion.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(const card of await motion.locator(".home-card").all()){
    const b=await card.boundingBox();assert.ok(b&&b.y>=0&&b.y+b.height<=height+1&&b.x>=0&&b.x+b.width<=width+1,name+" motion control leaves cards visible");
   }
   await motion.clock.runFor(1400);
   assert.equal(await svg.getAttribute("data-showcase-spell"),"translate");
   assert.ok(Number(await svg.getAttribute("data-showcase-progress"))>0);
   await magic.click();assert.equal(await art.getAttribute("data-home-motion"),"paused");
   const pausedPoints=await moving.getAttribute("points");
   await motion.clock.runFor(1500);assert.equal(await moving.getAttribute("points"),pausedPoints);
   await motion.locator("#open-spellbook").click();
   assert.equal(await svg.isHidden(),true);assert.equal(await magic.isHidden(),true);
   assert.equal(await art.getAttribute("data-home-motion"),"inactive");
   await motion.clock.runFor(1000);
   await motion.locator("#close-spellbook").click();
   assert.equal(await art.getAttribute("data-home-motion"),"paused");
   assert.equal(await moving.getAttribute("points"),pausedPoints);
   await magic.click();assert.equal(await art.getAttribute("data-home-motion"),"running");
   await motion.clock.runFor(850);
   // The phase advances after resume; check the complete cycle on desktop.
   if(name==="desktop"){
    for(const spell of ["rotate","reflect","enlarge"]){
     await motion.clock.runFor(6000);
     assert.equal(await svg.getAttribute("data-showcase-spell"),spell);
     await capture(motion,"desktop-home-"+spell+".png");
    }
    await motion.emulateMedia({reducedMotion:"reduce"});
    await motion.waitForFunction(()=>document.getElementById("title-art").getAttribute("data-home-motion")==="static");
    assert.equal(await magic.isHidden(),true);
    assert.equal(await svg.getAttribute("data-showcase-spell"),"translate");
    assert.equal(await svg.getAttribute("data-showcase-progress"),"1");
    await motion.emulateMedia({reducedMotion:"no-preference"});
    await motion.waitForFunction(()=>document.getElementById("title-art").getAttribute("data-home-motion")==="running");
    // Existing in-game reduced-motion preference is shared, not overridden.
    await motion.locator("#open-room").click();await motion.locator("#room-tools-toggle").click();
    await motion.locator("#motion-toggle").click();await motion.locator("#close-room").click();
    assert.equal(await art.getAttribute("data-home-motion"),"static");
    assert.equal(await magic.isHidden(),true);
   }
   assert.deepEqual(motionErrors,[]);
   showcaseReport.push({viewport:name,static:true,animated:true,pause:true,navigation:true,unobstructed:true});
  }catch(error){await captureFailure(motion,name+"-motion-failure.png");throw error;}
  finally{await motion.close();}
  await page.locator("#open-continue").focus();await page.keyboard.press("Enter");
  assert.match(await page.locator("#room-heading").innerText(),/Across the Brook/);await backToTitle(page);
  assert.match(await page.locator("#continue-detail").innerText(),/Resume Level 1/);
  await page.locator("#open-spellbook").click();await page.locator("#spellbook-view").waitFor();await page.locator("#close-spellbook").click();
  await page.locator("#open-room").click();await page.locator("#room-view").waitFor();await page.locator("#close-room").click();
  await page.locator("#title-view").waitFor();assert.match(await page.locator("#continue-detail").innerText(),/Resume Level 1/);
  await page.locator("#open-campaign").click();
  await page.locator("#campaign-view").waitFor();
  assert.equal(await hero.isVisible(),false);assert.equal(await legacy.isVisible(),true);
  assert.equal(await projection.isHidden(),true);
  assert.equal(await page.locator("#title-art").getAttribute("data-home-motion"),"inactive");
  assert.equal(await page.locator(".chapter-card").count(),7);
  assert.equal(await page.locator(".chapter-card:disabled").count(),0);
  assert.equal(await page.locator(".library-level").count(),0);
  await page.locator("#library-find").click();
  assert.equal(await page.locator(".library-level").count(),36);
  await page.locator("#filter-spell").selectOption("reflect");
  assert.equal(await page.locator(".library-level").count(),13);
  await page.locator('.library-level[data-level="4"]').click();await page.locator("#library-play").click();
  assert.match(await page.locator("#room-heading").innerText(),/The Missing Barrel/);
  await backToTitle(page);
  await page.locator("#open-campaign").click();
  assert.equal(await page.locator(".library-level").count(),0);
  await capture(page,name+"-campaign.png");
  await page.locator("#campaign-resume").click();
  assert.match(await page.locator("#room-heading").innerText(),/Across the Brook/);
  await backToTitle(page);
  for(const [index,[id,type,fields]] of cases.entries()){
   await page.locator("#open-campaign").click();await page.locator('.chapter-card[data-chapter="1"]').click();
   assert.equal(await page.locator(".library-level").count(),4);
   await page.locator('.library-level[data-level="'+(index+1)+'"]').click();await page.locator("#library-play").click();
   await page.locator("#room-canvas").waitFor();
   const initial=await page.locator("#room-stage").boundingBox();
   assert.ok(initial&&initial.height>=138,name+" stage");
   assert.ok((await page.locator("#room-playfield").boundingBox()).height>=138,name+" unobstructed playfield");
   assert.ok(await page.locator("#room-secondary-tools").isHidden(),name+" tools initially collapsed");
   if(index===0){
    await page.locator("#quick-camera").click();assert.equal(await page.locator("#quick-camera").getAttribute("aria-pressed"),"true");
    await page.locator("#quick-camera").click();assert.equal(await page.locator("#quick-camera").getAttribute("aria-pressed"),"false");
    await page.locator("#room-tools-toggle").click();assert.equal(await page.locator("#sound-toggle").getAttribute("aria-pressed"),"false");
    await page.locator("#sound-toggle").click();assert.equal(await page.locator("#sound-toggle").getAttribute("aria-pressed"),"true");
    await page.locator("#sound-toggle").click();assert.equal(await page.locator("#sound-toggle").getAttribute("aria-pressed"),"false");
    await page.locator("#motion-toggle").click();assert.equal(await page.locator("html").getAttribute("data-motion"),"reduced");
    await page.locator("#motion-toggle").click();assert.equal(await page.locator("html").getAttribute("data-motion"),"system");
    await page.locator("#focus-toggle").click();assert.equal(await page.locator("#room-view").getAttribute("data-focus"),"true");
    assert.ok((await page.locator("#room-stage").boundingBox()).height>=138);
    await capture(page,name+"-focus-view.png");
    await page.locator("#room-tools-toggle").click();await page.locator("#focus-toggle").click();await page.locator("#room-tools-toggle").click();
   }
   await capture(page,name+"-level"+(index+1)+"-initial.png",index+1);
   await page.locator("#object-toggle").click();
   await page.locator("#object-select").selectOption(id);
   assert.ok(await page.locator("#object-locate").isEnabled());
   if(index===0){await page.locator("#object-locate").click();assert.equal(await page.locator("#quick-camera").getAttribute("aria-pressed"),"true");await page.locator("#quick-camera").click();}
   await page.locator("#object-spell").selectOption(type);
   for(const [key,value] of Object.entries(fields)){
    const field=page.locator('#object-fields [name="'+key+'"]');
    if(await field.evaluate(e=>e.tagName==="SELECT"))await field.selectOption(value);else await field.fill(value);
   }
   await page.locator('#object-form button[type="submit"]').click();
   assert.equal(await page.locator("#object-apply").isEnabled(),true,name+" legal preview "+id);
   assert.ok(await page.locator("#object-image").isEnabled());
   if(index===0){await page.locator("#object-image").click();assert.equal(await page.locator("#quick-camera").getAttribute("aria-pressed"),"true");await page.locator("#quick-camera").click();}
   const inspected=await page.locator("#room-stage").boundingBox();
   await capture(page,name+"-level"+(index+1)+"-preview.png",index+1);
   await page.locator("#object-apply").click();
   assert.match(await page.locator("#tutorial-moves").innerText(),/Moves: 1/);
   report.push({viewport:name,level:index+1,stageHeight:initial.height,inspectionHeight:inspected.height});
   await backToTitle(page);
  }
  for(const [index,spells] of [...gardens,...clockwork,...riverworks,...archives,...alchemists,...observatory].entries()){
   await page.locator("#open-campaign").click();
   const chapter=index<4?"2":index<8?"3":index<14?"4":index<20?"5":index<26?"6":"7";
   await page.locator('.chapter-card[data-chapter="'+chapter+'"]').click();
   assert.equal(await page.locator(".library-level").count(),chapter==="7"?6:chapter==="6"?6:chapter==="5"?6:chapter==="4"?6:4);
   await page.locator('.library-level[data-level="'+(index+5)+'"]').click();await page.locator("#library-play").click();
   await page.locator("#room-canvas").waitFor();
   const initial=await page.locator("#room-stage").boundingBox();
   assert.ok(initial.height>=138);
   await page.locator("#room-tools-toggle").click();
   await page.locator("#tutorial-guidance-toggle").click();assert.equal(await page.locator("#tutorial-guide").isHidden(),true);
   await page.locator("#tutorial-guidance-toggle").click();
   await page.locator("#room-tools-toggle").click();
   await page.locator("#grid-toggle").click();assert.equal(await page.locator("#grid-toggle").getAttribute("aria-pressed"),"false");
   await page.locator("#grid-toggle").click();assert.equal(await page.locator("#grid-toggle").getAttribute("aria-pressed"),"true");
   await capture(page,name+"-level"+(index+5)+"-initial.png",index+5);
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
    if(id==="sluice-barrel")assert.match(await page.locator("#object-result").innerText(),/Plate 1 will be held.*1\/2 linked plates will be held/);
    if(id==="sluice-crate")assert.match(await page.locator("#object-result").innerText(),/Plate 2 will be held.*2\/2 linked plates will be held.*gate will open/);
    if(id==="garden-ladder"||id==="service-ladder")assert.match(await page.locator("#object-result").innerText(),/upright and climbable/);
    if(["east-span","west-span","lower-step","upper-step","dock-span","tower-span"].includes(id))assert.match(await page.locator("#object-result").innerText(),/Both bearing ends will be supported/);
    if(id==="socket-beam"&&type==="translate")assert.match(await page.locator("#object-result").innerText(),/Hinge will dock/);
    if(id==="socket-beam"&&type==="rotate")assert.match(await page.locator("#object-permissions").innerText(),/\(docked\)/);
    if(id==="brass-key"&&type==="rotate")assert.match(await page.locator("#object-result").innerText(),/Key will fit.*gate will open/);
    if(id==="archive-ladder"){assert.match(await page.locator("#object-permissions").innerText(),/Horizontal: solid bridge/);assert.match(await page.locator("#object-result").innerText(),/solid walkable bridge/);}
    if(id==="double-seal"&&type==="translate")assert.match(await page.locator("#object-result").innerText(),/2\/2 linked plates will be held.*gate will open/);
    if(id==="chain-comb"){assert.match(await page.locator("#object-permissions").innerText(),/Rigid linked feet/);assert.match(await page.locator("#object-result").innerText(),/1\/2 linked conditions will be held.*Transit gate will open/);}
    if(id==="chain-key"&&type==="translate")assert.match(await page.locator("#object-result").innerText(),/2\/2 linked conditions will be held.*Final archive gate will open/);
    if(id==="wandering-socket"||id==="mirror-socket"){assert.match(await page.locator("#object-permissions").innerText(),/Movable socket H.*Carries Attached pivot beam/);assert.match(await page.locator("#object-result").innerText(),/moves with the socket.*New pivot H.*Attached image/);}
    if(id==="wandering-beam"||id==="mirror-beam")assert.match(await page.locator("#object-permissions").innerText(),/Marked pivot H.*Attached to Movable socket/);
    if(id==="selector-weight"){assert.match(await page.locator("#object-permissions").innerText(),/Selector weight.*HELD gate.*FREE gate/);assert.match(await page.locator("#object-result").innerText(),/one gate opens and the other closes.*Entrance gate will open.*Exit gate will close/);}
    if(id==="star-mirror"){assert.match(await page.locator("#object-permissions").innerText(),/current mirror x = 10/);assert.match(await page.locator("#object-result").innerText(),/Mirror line will move from x = 10 to x = 19/);}
    if(id==="star-deck"){assert.match(await page.locator("#object-permissions").innerText(),/Linked mirror: x = 19/);assert.match(await page.locator("#object-result").innerText(),/current linked mirror x = 19/);}
    if(id==="orbit-socket"){assert.match(await page.locator("#object-permissions").innerText(),/Linked mirror: x = 15/);assert.match(await page.locator("#object-result").innerText(),/New pivot H = \(22, 4\)/);}
    if(id==="lost-crystal"){assert.match(await page.locator("#object-permissions").innerText(),/Crystal delivery required/);assert.match(await page.locator("#object-references").innerText(),/Receiver: T1/);assert.match(await page.locator("#object-result").innerText(),/Crystal will fit Star receiver.*portal available/);}
    if(id==="machine-fork"){assert.match(await page.locator("#object-permissions").innerText(),/Rigid linked feet.*Selector weight/);assert.match(await page.locator("#object-result").innerText(),/one gate opens and the other closes.*Inlet gate will open.*Outlet gate will close/);}
    if(id==="orbit-walkway"){assert.match(await page.locator("#object-permissions").innerText(),/Fixed external centre/);assert.match(await page.locator("#object-references").innerText(),/Centre.*32.*11/);}
    if(id==="brass-key")assert.match(await page.locator("#object-references").innerText(),/Lock outline: S1/);
    await capture(page,name+"-level"+(index+5)+"-cast"+(move+1)+".png",index+5);
    await page.locator("#object-apply").click();
    assert.match(await page.locator("#tutorial-moves").innerText(),new RegExp("Moves: "+(move+1)));
    if(id==="garden-ladder"||id==="service-ladder")assert.equal(await page.locator("#climb-controls").isVisible(),true);
   }
   if(index>=18)assert.match(await page.locator("#tutorial-guide").innerText(),/Traverse/);
   if(index===24)assert.match(await page.locator("#tutorial-guide").innerText(),/safe chamber/);
   if(index===25)assert.match(await page.locator("#tutorial-guide").innerText(),/middle workbench/);
   if(index===27)assert.match(await page.locator("#tutorial-guide").innerText(),/safe star platform/);
   if(index===30)assert.match(await page.locator("#tutorial-guide").innerText(),/machine island/);
   if(index===31)assert.match(await page.locator("#tutorial-guide").innerText(),/safe island/);
   if(chapter==="5"&&index<16){assert.match(await page.locator("#tutorial-guide").innerText(),/Traverse.*balcony/);assert.equal(await page.locator("#climb-controls").isHidden(),true);}
   await capture(page,name+"-level"+(index+5)+(chapter==="5"?"-first-crossing":"-ready")+".png",index+5);
   report.push({viewport:name,level:index+5,stageHeight:initial.height,casts:spells.length});
   await backToTitle(page);
  }
  assert.deepEqual(errors,[],name+" runtime errors");
  assert.deepEqual(report.filter(r=>r.viewport===name).map(r=>r.level),Array.from({length:36},(_,i)=>i+1),name+" all campaign levels covered");
  }catch(error){await captureFailure(page,name+"-failure.png");throw error;}
  finally{await page.close();}
 }
 assertBrowserCoverage(report,showcaseReport,viewports);
 passed=true;
 console.log("BROWSER COVERAGE: "+report.length+"/"+(36*viewports.length)+" initial-level and cast-setup combinations; "+screenshotCount+" "+options.screenshots+" screenshots.");
}finally{
 try{
  await Promise.all([
   writeFile(out+"/layout-report.json",JSON.stringify(report,null,2)),
   writeFile(out+"/home-showcase-report.json",JSON.stringify(showcaseReport,null,2)),
   writeFile(out+"/coverage-meta.json",JSON.stringify({commit:process.env.GITHUB_SHA??null,viewports,passed,screenshots:options.screenshots,screenshotCount,elapsedMs:Date.now()-started},null,2))
  ]);
 }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
