import test from "node:test";
import assert from "node:assert/strict";
import {rectangle,signedArea} from "../src/geometry/world.js";
import {enlargementSweepOverlaps,scaledVertices} from "../src/geometry/enlargement-sweep.js";
import {previewObject} from "../src/core/object-engine.js";
import {parsePreviewRequest} from "../src/transformations/preview-math.js";
import {previewEnlargement,commitEnlargement,enlargedFrame} from "../src/transformations/enlargement.js";
import {LITTLE_CHEESY,CHEESY_SOLUTION,cheesyHint} from "../src/levels/little-cheesy.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";

const room=validateRoom(LITTLE_CHEESY),world=createPhysicsWorld(room),player=createPlayer(world),id=CHEESY_SOLUTION.objectId;
const near=(a,b,tol=.0001)=>assert.ok(Math.abs(a-b)<tol,a+" != "+b);
function isolated(extra={}){
 return {bounds:{minX:-20,maxX:20,minY:-20,maxY:20},terrain:[],hazards:[],objects:[{id:"piece",vertices:rectangle(2,1,1,.5),permissions:["enlarge"],support:"enchanted",scaleRange:[.25,4]}],...extra};
}
const grow={factor:3,cx:0,cy:0};
test("positive enlargement preserves shape, scales lengths and area, supports external centres",()=>{
 const v=[[2,1],[4,1],[4,2]];
 assert.deepEqual(scaledVertices(v,[0,0],3),[[6,3],[12,3],[12,6]]);
 const image=scaledVertices(v,[1,1],2);
 near(signedArea(image),4*signedArea(v));near(Math.hypot(image[0][0]-image[2][0],image[0][1]-image[2][1]),2*Math.sqrt(5));
 assert.deepEqual(scaledVertices(image,[1,1],.5),v);
 assert.equal(parsePreviewRequest("enlarge",{factor:"3/2",cx:"25",cy:"3"}).factor,1.5);
 assert.equal(parsePreviewRequest("enlarge",{factor:".5",cx:"25",cy:"3"}).factor,.5);
 for(const factor of ["0","-1","1/0","", "1e2"])assert.equal(parsePreviewRequest("enlarge",{factor,cx:0,cy:0}),null);
});
test("continuous enlargement hull catches thin mid-path obstacle and permits legal contact",()=>{
 const a=isolated().objects[0].vertices,b=rectangle(4.5,2.2,.001,.001);
 assert.equal(enlargementSweepOverlaps(a,b,[0,0],3),true);
 assert.equal(enlargementSweepOverlaps(scaledVertices(a,[0,0],3),b,[0,0],1/3),true);
 assert.equal(enlargementSweepOverlaps(a,rectangle(4,6,1,1),[0,0],3),false);
 const r=isolated({terrain:[{id:"thin wall",vertices:b}]});
 assert.equal(previewObject(r,null,"piece","enlarge",grow).ok,true);
 assert.equal(previewEnlargement(r,null,"piece",grow).code,"path-solid");
 assert.equal(previewEnlargement(isolated({hazards:[{id:"water",vertices:b}]}),null,"piece",grow).code,"path-hazard");
 assert.equal(previewEnlargement(isolated(),{x:4.5,y:1.8},"piece",grow).code,"path-player");
 assert.equal(enlargementSweepOverlaps(rectangle(2,3,1,1),rectangle(0,0,20,3),[2,3],3),false);
});
test("triangulated swept hulls do not falsely fill a concave void",()=>{
 const l=[[0,0],[5,0],[5,1],[1,1],[1,5],[0,5]];
 assert.equal(enlargementSweepOverlaps(l,rectangle(3,3,.25,.25),[0,0],2),false);
 assert.equal(enlargementSweepOverlaps(l,rectangle(3,1.5,.25,.25),[0,0],2),true);
});
test("validate parameters, no-op, bounds, support, collision and player protection",()=>{
 assert.equal(previewEnlargement(room,player,id,CHEESY_SOLUTION).ok,true);
 assert.equal(previewEnlargement(room,player,id,{...CHEESY_SOLUTION,factor:1}).code,"identity");
 assert.equal(previewEnlargement(room,player,id,{...CHEESY_SOLUTION,factor:4}).code,"scale-limit");
 assert.equal(previewEnlargement(room,player,id,{...CHEESY_SOLUTION,cx:0}).code,"bounds");
 assert.equal(previewEnlargement(room,player,id,{...CHEESY_SOLUTION,cx:24}).code,"solid-overlap");
 assert.equal(previewEnlargement(room,player,id,{...CHEESY_SOLUTION,cy:2}).code,"unsupported");
 assert.equal(previewEnlargement(room,{x:24.5,y:6},id,CHEESY_SOLUTION).code,"player-supported");
 assert.equal(previewEnlargement(room,{x:12,y:3},id,CHEESY_SOLUTION).code,"player-overlap");
 assert.equal(previewEnlargement(room,player,id,{factor:3,cx:25,cy:""}).code,"parameters");
});
test("atomic geometry, exact scale animation, reverse and fractional corrections",()=>{
 const before=JSON.stringify(room),p=JSON.stringify(player);
 const tx=commitEnlargement(room,player,id,CHEESY_SOLUTION);
 assert.equal(tx.ok,true,tx.message);assert.deepEqual(tx.room.objects[0].vertices,[[7,3],[25,3],[25,12]]);
 assert.equal(tx.physics.room,tx.room);assert.ok(Object.isFrozen(tx.room.objects[0].vertices[0]));
 assert.deepEqual(tx.record,{objectId:id,type:"enlarge",factor:3,centre:[25,3]});
 assert.equal(blocked(world,{x:18,y:4}),false);assert.equal(blocked(tx.physics,{x:18,y:4}),true);
 assert.deepEqual(enlargedFrame(tx.room,tx.transition,0).objects[0].vertices,room.objects[0].vertices);
 assert.deepEqual(enlargedFrame(tx.room,tx.transition,.5).objects[0].vertices,[[13,3],[25,3],[25,9]]);
 assert.equal(enlargedFrame(tx.room,tx.transition,1),tx.room);
 assert.equal(JSON.stringify(room),before);assert.equal(JSON.stringify(player),p);
 const first=commitEnlargement(room,player,id,{...CHEESY_SOLUTION,factor:2});
 const second=commitEnlargement(first.room,player,id,{...CHEESY_SOLUTION,factor:"3/2"});
 assert.equal(second.ok,true,second.message);assert.deepEqual(second.room.objects[0].vertices,tx.room.objects[0].vertices);
 assert.match(cheesyHint(first.room,3),/factor 1.5/);assert.match(cheesyHint(second.room,3),/already reaches/);
 const shrink=commitEnlargement(first.room,player,id,{...CHEESY_SOLUTION,factor:"1/2"});
 assert.equal(shrink.ok,true);assert.deepEqual(shrink.room.objects[0].vertices,room.objects[0].vertices);
 assert.equal(commitEnlargement(room,player,id,{...CHEESY_SOLUTION,factor:4}).ok,false);
});
test("actual traversal works after one or two casts; original and smaller ramp fail recorded jumps",()=>{
 const run=(physics,jump=false)=>{let p=player;for(let i=0;i<900;i++)p=stepPlayer(physics,p,{move:1,jump:jump&&i%140===0});return p;};
 const small=commitEnlargement(room,player,id,{...CHEESY_SOLUTION,factor:2});
 for(const w of [world,small.physics]){const q=run(w,true);assert.equal(q.completed,false);assert.ok(q.x<25);}
 const large=commitEnlargement(room,player,id,CHEESY_SOLUTION),corrected=commitEnlargement(small.room,player,id,{...CHEESY_SOLUTION,factor:1.5});
 for(const tx of [large,corrected]){assert.equal(tx.ok,true);const q=run(tx.physics);assert.equal(q.completed,true);assert.equal(q.respawns,0);near(q.y,12);}
 assert.deepEqual(run(large.physics),run(large.physics));
});
