import test from "node:test";
import assert from "node:assert/strict";
import {createCamera,panCamera,zoomCamera,worldToScreen,MAX_ZOOM} from "../src/rendering/camera.js";
import {snapPoint,pickCoordinate,parseCoordinate,formatCoordinate,clientToScreen} from "../src/geometry/coordinates.js";
import {gridPlan,drawCoordinateOverlay} from "../src/rendering/coordinate-grid.js";
const b={minX:0,maxX:32,minY:0,maxY:14};
const signed={minX:-12,maxX:12,minY:-7,maxY:7};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
test("zoom clamps, preserves uniform scale, and pan preserves zoom",()=>{
  const fit=createCamera(b,1000,500);
  let c=zoomCamera(fit,b,2);assert.equal(c.zoom,2);near(c.scale,fit.scale*2);
  c=panCamera(c,b,999,999);assert.equal(c.zoom,2);near(c.right,32);near(c.top,14);
  const resized=createCamera(b,390,640,c.mode,{x:c.cx,y:c.cy},c.zoom);
  assert.equal(resized.zoom,2);
  const p=worldToScreen(resized,{x:6,y:3}),right=worldToScreen(resized,{x:7,y:3}),up=worldToScreen(resized,{x:6,y:4});
  near(right.x-p.x,resized.scale);near(p.y-up.y,resized.scale);
  assert.equal(zoomCamera(c,b,100).zoom,MAX_ZOOM);
  assert.equal(zoomCamera(c,b,.001).mode,"overview");
  assert.throws(()=>zoomCamera(c,b,0));
});
test("snap works for positive, negative, fractional and bounded coordinates",()=>{
  assert.deepEqual(snapPoint({x:2.26,y:6.75},.5,b),{x:2.5,y:7});
  assert.deepEqual(snapPoint({x:-3.26,y:-.04},.1,signed),{x:-3.3,y:0});
  assert.deepEqual(snapPoint({x:31.9,y:13.8},1,b),{x:32,y:14});
  assert.equal(snapPoint({x:-1,y:1},1,b),null);
  assert.equal(snapPoint({x:1,y:1},.3,b),null);
});
test("typed coordinates stay exact; malformed and out-of-bounds inputs rejected",()=>{
  assert.deepEqual(parseCoordinate("-1.27","+.125",signed),{x:-1.27,y:.125});
  assert.deepEqual(parseCoordinate("-0","14",b),{x:0,y:14});
  for(const bad of [""," ","Infinity","NaN","2+3","0x10","1e2"])assert.equal(parseCoordinate(bad,"3",b),null);
  assert.equal(parseCoordinate("33","3",b),null);
  assert.equal(formatCoordinate({x:-0,y:.5}),"(0, 0.5)");
});
test("coordinate picking uses CSS coordinates and rejects letterbox scenery",()=>{
  const camera=createCamera(b,390,640);
  const p=worldToScreen(camera,{x:6.4,y:3.2});
  const rect={left:30,top:50,width:camera.width*2,height:camera.height*2};
  const screen=clientToScreen(rect,30+p.x*2,50+p.y*2,camera);
  assert.deepEqual(pickCoordinate(camera,b,screen,.1),{x:6.4,y:3.2});
  assert.equal(pickCoordinate(camera,b,{x:10,y:10}),null);
  assert.equal(pickCoordinate(camera,b,{x:-1,y:100}),null);
  assert.equal(clientToScreen({...rect,width:0},30,50,camera),null);
});
test("grid anchored to zero and axes not moved when origin is offscreen",()=>{
  let c=createCamera(signed,1200,700);
  let p=gridPlan(c,signed);
  assert.equal(p.minorStep,1);assert.ok(p.minorX.includes(-5)&&p.minorX.includes(0)&&p.minorY.includes(5));
  assert.ok(p.xAxis&&p.yAxis);
  c=createCamera(signed,1200,700,"inspect",{x:10,y:5},4);
  p=gridPlan(c,signed);
  assert.equal(p.xAxis,false);assert.equal(p.yAxis,false);
  assert.ok(p.minorX.every(x=>x>=p.visible.minX-1e-8&&x<=p.visible.maxX+1e-8));
  const small=gridPlan(createCamera(b,80,90),b);
  assert.ok(small.minorStep>1);
  assert.ok(small.majorStep>=small.minorStep);
  assert.ok(small.majorX.every(x=>x%small.minorStep===0));
});
function mock(){
  const calls=[];let depth=0;
  return {calls,get depth(){return depth},save(){depth++},restore(){depth--},beginPath(){},rect(){},clip(){},moveTo(x,y){calls.push(["move",x,y])},lineTo(x,y){calls.push(["line",x,y])},stroke(){calls.push(["stroke",this.strokeStyle])},fill(){},arc(){},fillRect(){calls.push(["band"])},strokeText(s){calls.push(["text",s])},fillText(){},measureText(s){return{width:s.length*7}}};
}
test("overlay draws independently and balances canvas state",()=>{
  const c=createCamera(b,1200,600),ctx=mock();
  drawCoordinateOverlay(ctx,c,b,{grid:false,axes:false,picking:false});
  assert.equal(ctx.calls.length,0);assert.equal(ctx.depth,0);
  drawCoordinateOverlay(ctx,c,b,{grid:true,axes:false});
  assert.ok(ctx.calls.length>0);assert.ok(!ctx.calls.some(a=>a[0]==="text"));assert.equal(ctx.depth,0);
  const axes=mock();drawCoordinateOverlay(axes,c,b,{grid:false,axes:true});
  assert.ok(axes.calls.some(a=>a[0]==="text"&&a[1]==="x"));
  assert.ok(axes.calls.some(a=>a[0]==="text"&&a[1]==="y"));
  assert.equal(axes.depth,0);
  const marker=mock();drawCoordinateOverlay(marker,c,b,{grid:false,axes:false,picking:true,point:{x:5,y:6}});
  assert.ok(marker.calls.some(a=>a[0]==="text"&&a[1]==="(5, 6)"));
  assert.equal(marker.depth,0);
});

test("true boundary axes are drawn above the ruler background",()=>{
  const camera=createCamera(b,1200,600),ctx=mock();
  drawCoordinateOverlay(ctx,camera,b,{grid:false,axes:true});
  const lastBand=ctx.calls.findLastIndex(call=>call[0]==="band");
  const firstGoldAxis=ctx.calls.findIndex(call=>call[0]==="stroke"&&call[1]==="#ffe4a8");
  assert.ok(lastBand>=0&&firstGoldAxis>lastBand);
});
