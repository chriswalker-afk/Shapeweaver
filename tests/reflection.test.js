import test from "node:test";
import assert from "node:assert/strict";
import {rectangle,signedArea} from "../src/geometry/world.js";
import {translationSweepOverlaps} from "../src/geometry/translation-sweep.js";
import {parseMirrorLine,parsePreviewRequest,transformPoint,referencePoints,previewGeometry} from "../src/transformations/preview-math.js";
import {previewReflection,commitReflection,reflectedFrame} from "../src/transformations/reflection.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {MISSING_BARREL,BARREL_SOLUTION,barrelHint} from "../src/levels/missing-barrel.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";

const room=validateRoom(MISSING_BARREL),world=createPhysicsWorld(room),player=createPlayer(world),id=BARREL_SOLUTION.objectId;
const near=(a,b,tol=.0001)=>assert.ok(Math.abs(a-b)<tol,a+" != "+b);
const refs=o=>Object.fromEntries(referencePoints(o).map(p=>[p.id,p.point]));
function isolated(extra={}){
 return {bounds:{minX:-20,maxX:20,minY:-20,maxY:20},terrain:[],hazards:[],objects:[{id:"piece",vertices:rectangle(2,1,1,.5),permissions:["reflect","translate"],support:"enchanted"}],...extra};
}
test("all four mirror line forms preserve distances and are involutions",()=>{
 for(const [line,image] of [["x = -2",[-7,-5]],["y=1.5",[3,8]],["y=x",[-5,3]],["y = −x",[5,-3]]]){
  const request=parsePreviewRequest("reflect",{line});
  assert.ok(request);assert.deepEqual(transformPoint([3,-5],request),image);
  assert.deepEqual(transformPoint(image,request),[3,-5]);
  const g=previewGeometry(isolated().objects[0],request);
  near(signedArea(g.vertices),.5);
  near(Math.hypot(g.points[0].point[0]-g.points[2].point[0],g.points[0].point[1]-g.points[2].point[1]),Math.sqrt(1.25));
 }
 for(const line of ["","x=NaN","y=2x","x=1e2","x=","x=2+2","x=Infinity","x=1/0"])assert.equal(parseMirrorLine(line),null);
 assert.equal(parseMirrorLine(" X = -2.5 ").equation,"x = -2.5");
});
test("reflection can cross an intervening solid or hazard, but never land inside one",()=>{
 const tx=commitReflection(room,player,id,BARREL_SOLUTION);assert.equal(tx.ok,true,tx.message);
 const wall=room.terrain.find(t=>t.id==="store-wall");
 assert.equal(translationSweepOverlaps(room.objects[0].vertices,wall.vertices,21,0),true);
 const obstacle=isolated({hazards:[{id:"water",vertices:rectangle(0,-1,1,4)}]});
 assert.equal(previewReflection(obstacle,null,"piece",{line:"x=0"}).ok,true);
 const destination=isolated({hazards:[{id:"water",vertices:rectangle(-3,1,1,.5)}]});
 assert.equal(previewReflection(destination,null,"piece",{line:"x=0"}).code,"hazard-overlap");
 assert.equal(previewReflection(room,player,id,{line:"x=6"}).code,"solid-overlap");
 assert.equal(previewReflection(room,player,id,{line:"x=7"}).code,"player-overlap");
 assert.equal(previewReflection(room,player,id,{line:"x=30"}).code,"bounds");
 assert.equal(previewReflection(room,player,id,{line:"y=5"}).code,"unsupported");
 assert.equal(previewReflection(room,{x:4.5,y:5.5},id,BARREL_SOLUTION).code,"player-supported");
 assert.equal(previewReflection(room,player,id,{line:"x=foo"}).code,"parameters");
 const other=isolated({objects:[{id:"piece",vertices:rectangle(2,1,1,.5),permissions:["translate"],support:"enchanted"}]});
 assert.equal(previewReflection(other,null,"piece",{line:"x=0"}).code,"permission");
});
test("commit reverses winding without losing stable vertex IDs and updates actual collision geometry",()=>{
 const before=JSON.stringify(room),p=JSON.stringify(player),tx=commitReflection(room,player,id,BARREL_SOLUTION);
 assert.equal(tx.ok,true);assert.equal(tx.physics.room,tx.room);
 assert.deepEqual(tx.record,{objectId:id,type:"reflect",line:"x = 15"});
 const o=tx.room.objects[0];assert.deepEqual(o.vertices,[[27,5.5],[24,5.5],[24,3],[27,3]]);
 assert.ok(signedArea(o.vertices)>0);assert.deepEqual(o.vertexIds,["D","C","B","A"]);
 assert.deepEqual(refs(o),{D:[27,5.5],C:[24,5.5],B:[24,3],A:[27,3]});
 assert.ok(Object.isFrozen(o.vertexIds));assert.equal(JSON.stringify(room),before);assert.equal(JSON.stringify(player),p);
 assert.equal(blocked(world,{x:4.5,y:3}),true);assert.equal(blocked(tx.physics,{x:4.5,y:3}),false);
 assert.equal(blocked(world,{x:25,y:3}),false);assert.equal(blocked(tx.physics,{x:25,y:3}),true);
 const reverse=commitReflection(tx.room,player,id,BARREL_SOLUTION);
 assert.equal(reverse.ok,true,reverse.message);assert.deepEqual(reverse.room.objects[0].vertices,room.objects[0].vertices);
 assert.deepEqual(refs(reverse.room.objects[0]),refs(room.objects[0]));
 const a=commitReflection(isolated(),null,"piece",{line:"y=x"}),b=commitTranslation(a.room,null,"piece",{dx:1,dy:2});
 assert.equal(b.ok,true);assert.deepEqual(refs(b.room.objects[0]).A,[2,4]);
 const bad=commitReflection(room,player,id,{line:"x=7"});assert.equal(bad.ok,false);assert.equal(JSON.stringify(room),before);
});
test("magical animation fades only exact source and destination without collapsing geometry",()=>{
 const tx=commitReflection(room,player,id,BARREL_SOLUTION);
 const start=reflectedFrame(tx.room,tx.transition,0).objects[0],out=reflectedFrame(tx.room,tx.transition,.25).objects[0];
 const middle=reflectedFrame(tx.room,tx.transition,.5).objects[0],into=reflectedFrame(tx.room,tx.transition,.75).objects[0];
 assert.deepEqual(start.vertices,room.objects[0].vertices);assert.equal(start.reflectionOpacity,1);
 assert.deepEqual(out.vertices,start.vertices);assert.equal(out.reflectionOpacity,.5);
 assert.deepEqual(middle.vertices,tx.room.objects[0].vertices);assert.equal(middle.reflectionOpacity,0);
 assert.deepEqual(into.vertices,middle.vertices);assert.equal(into.reflectionOpacity,.5);
 assert.equal(reflectedFrame(tx.room,tx.transition,1),tx.room);
 assert.deepEqual(refs(out),refs(room.objects[0]));assert.deepEqual(refs(into),refs(tx.room.objects[0]));
 assert.match(barrelHint(room,3),/x = 15/);assert.match(barrelHint(tx.room,3),/intended position/);
});
function replay(physics){
 let q=player;
 for(const [n,move,jump] of [[175,1,false],[60,1,true],[40,0,false],[55,1,true],[140,1,false]]){
  for(let i=0;i<n;i++)q=stepPlayer(physics,q,{move,jump:jump&&i===0});
  if(n===40){assert.ok(q.grounded);near(q.y,5.5);}
 }
 return q;
}
test("actual two-jump route succeeds after one cast or a corrective pair",()=>{
 let p=player;for(let i=0;i<850;i++)p=stepPlayer(world,p,{move:1,jump:i%140===0});
 assert.equal(p.completed,false);assert.ok(p.x<28);
 const a=commitReflection(room,player,id,BARREL_SOLUTION),first=commitReflection(room,player,id,{line:"x=4"});
 assert.equal(first.ok,true);
 const corrected=commitReflection(first.room,player,id,{line:"x=14.5"});assert.equal(corrected.ok,true,corrected.message);
 for(const tx of [a,corrected]){
  const q=replay(tx.physics);assert.equal(q.completed,true);assert.equal(q.respawns,0);near(q.y,8);
  assert.equal(commitReflection(tx.room,q,id,{line:"x=15"}).code,"attempt-ended");
 }
 assert.deepEqual(replay(a.physics),replay(a.physics));
});
