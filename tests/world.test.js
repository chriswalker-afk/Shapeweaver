import test from "node:test";
import assert from "node:assert/strict";
import { rectangle,polygonBounds,signedArea } from "../src/geometry/world.js";
import { GATEHOUSE_PREVIEW,validateRoom } from "../src/levels/gatehouse-preview.js";
import { createCamera,worldToScreen,screenToWorld,panCamera } from "../src/rendering/camera.js";
import { renderWorld,WORLD_ASSETS } from "../src/rendering/world-art.js";
import { readFile } from "node:fs/promises";
const room=GATEHOUSE_PREVIEW,b=room.bounds;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test("renderer fixture is valid, immutable, with upward geometry",()=>{
  assert.equal(validateRoom(room),room);
  assert.ok(Object.isFrozen(room.terrain[0].vertices[0]));
  assert.equal(signedArea(rectangle(2,3,5,4)),20);
  assert.deepEqual(polygonBounds(rectangle(2,3,5,4)),{minX:2,maxX:7,minY:3,maxY:7});
  assert.throws(()=>rectangle(0,0,-1,2));
  const bad=structuredClone(room);bad.objects[0].id=bad.terrain[0].id;assert.throws(()=>validateRoom(bad),/Duplicate/);
  const outside=structuredClone(room);outside.objects[0].vertices[0][0]=-1;assert.throws(()=>validateRoom(outside),/polygon/);
  const reversed=structuredClone(room);reversed.objects[0].vertices.reverse();assert.throws(()=>validateRoom(reversed),/polygon/);
});
test("overview contains room at uniform scale for desktop, mobile and ultrawide",()=>{
  for(const [w,h] of [[1366,650],[1920,1000],[956,375],[390,640],[2560,400]]){
    const c=createCamera(b,w,h);
    const tl=worldToScreen(c,{x:b.minX,y:b.maxY}),br=worldToScreen(c,{x:b.maxX,y:b.minY});
    assert.ok(tl.x>=-1e-8&&tl.y>=-1e-8&&br.x<=w+1e-8&&br.y<=h+1e-8);
    const p=worldToScreen(c,{x:4,y:3}),right=worldToScreen(c,{x:5,y:3}),up=worldToScreen(c,{x:4,y:4});
    near(right.x-p.x,c.scale);near(p.y-up.y,c.scale);
    for(const pt of [{x:-2.5,y:4.75},{x:16,y:7},{x:32,y:14}]){
      const round=screenToWorld(c,worldToScreen(c,pt));near(round.x,pt.x);near(round.y,pt.y);
    }
  }
  assert.throws(()=>createCamera(b,0,50));
});
test("inspection zoom, pan clamping, and view changes never mutate geometry",()=>{
  const before=JSON.stringify(room);
  const fit=createCamera(b,1000,500);
  let c=createCamera(b,1000,500,"inspect",{x:16,y:7});
  assert.ok(c.scale>fit.scale);
  c=panCamera(c,b,-1000,1000);near(c.left,b.minX);near(c.top,b.maxY);
  c=panCamera(c,b,1000,-1000);near(c.right,b.maxX);near(c.bottom,b.minY);
  const other=createCamera(b,400,700,"inspect",{x:c.cx,y:c.cy});
  const p={x:12,y:3},round=screenToWorld(other,worldToScreen(other,p));near(round.x,p.x);near(round.y,p.y);
  assert.equal(JSON.stringify(room),before);
});
function fakeContext(){
  let depth=0,draws=0;
  const gradient={addColorStop(){}};
  return {get depth(){return depth},get draws(){return draws},
    save(){depth++},restore(){depth--;assert.ok(depth>=0)},setTransform(){},createLinearGradient(){return gradient},createRadialGradient(){return gradient},
    fillRect(){draws++},drawImage(){draws++},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){draws++},stroke(){},clip(){},rect(){},translate(){},rotate(){},ellipse(){},arc(){},strokeRect(){},quadraticCurveTo(){}};
}
test("world draw supports missing assets and textured layers with balanced state",()=>{
  const before=JSON.stringify(room);
  const metrics={width:960,height:430,scaleX:2,scaleY:2},c=createCamera(b,metrics.width,metrics.height);
  const fallback=fakeContext();renderWorld(fallback,metrics,c,room);assert.equal(fallback.depth,0);assert.ok(fallback.draws>20);
  const textured=fakeContext(),art=Object.fromEntries(Object.keys(WORLD_ASSETS).map(k=>[k,{naturalWidth:128,naturalHeight:80}]));
  renderWorld(textured,metrics,c,room,art);assert.equal(textured.depth,0);assert.ok(textured.draws>fallback.draws);
  assert.equal(JSON.stringify(room),before);
});
test("all renderer asset paths are present in local provenance manifest",async()=>{
  const manifest=JSON.parse(await readFile(new URL("../assets/manifest.json",import.meta.url),"utf8"));
  for(const path of Object.values(WORLD_ASSETS)){
    assert.ok(manifest.assets.some(a=>a.path===path),path);
    assert.match(await readFile(new URL("../assets/"+path,import.meta.url),"utf8"),/^<svg /);
  }
});
