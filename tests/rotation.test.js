import test from "node:test";
import assert from "node:assert/strict";
import {rectangle} from "../src/geometry/world.js";
import {rotationSweepOverlaps,rotationSweepWithinBounds,rotatedVertices,signedRadians} from "../src/geometry/rotation-sweep.js";
import {previewObject} from "../src/core/object-engine.js";
import {previewRotation,commitRotation,rotatedFrame} from "../src/transformations/rotation.js";
import {STUBBORN_GATE,GATE_SOLUTION,gateHint} from "../src/levels/stubborn-gate.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";

const room=validateRoom(STUBBORN_GATE),world=createPhysicsWorld(room),player=createPlayer(world),id=GATE_SOLUTION.objectId;
const near=(a,b,tol=.0001)=>assert.ok(Math.abs(a-b)<tol,a+" != "+b);
function isolated(extra={}){
 return {bounds:{minX:-10,maxX:10,minY:-10,maxY:10},terrain:[],hazards:[],objects:[{id:"beam",vertices:rectangle(4,0,.5,.2),permissions:["rotate"],support:"enchanted"}],...extra};
}
const turn={angle:90,direction:"anticlockwise",cx:0,cy:0};
function thinObstacle(){
 const [x,y]=rotatedVertices([[4.25,.1]],[0,0],.413)[0];return rectangle(x-.0005,y-.0005,.001,.001);
}
test("event-based arc detects thin mid-path obstacles and distinguishes equivalent signed endpoints",()=>{
 const a=isolated().objects[0].vertices,b=thinObstacle();
 assert.equal(rotationSweepOverlaps(a,b,[0,0],Math.PI/2),true);
 assert.equal(rotationSweepOverlaps(a,b,[0,0],-Math.PI/2),false);
 assert.equal(rotationSweepOverlaps(a,b,[0,0],-3*Math.PI/2),false);
 const wall={id:"thin obstacle",vertices:b},r=isolated({terrain:[wall]});
 assert.equal(previewObject(r,null,"beam","rotate",turn).ok,true);
 assert.equal(previewRotation(r,null,"beam",turn).code,"path-solid");
 assert.equal(previewRotation(r,null,"beam",{...turn,angle:270,direction:"clockwise"}).ok,true);
 const other=isolated({terrain:[{id:"south wall",vertices:rectangle(-.1,-4.4,.2,.2)}]});
 assert.equal(previewRotation(other,null,"beam",turn).ok,true);
 assert.equal(previewRotation(other,null,"beam",{...turn,angle:270,direction:"clockwise"}).code,"path-solid");
});
test("rotation checks intermediate extrema outside room and supports external centres",()=>{
 const vertices=rectangle(6,3,1,1),bounds={minX:0,maxX:7,minY:0,maxY:7};
 const r=isolated({bounds,objects:[{id:"beam",vertices,permissions:["rotate"],support:"enchanted"}]});
 const raw={...turn,cx:4,cy:4};
 assert.equal(previewObject(r,null,"beam","rotate",raw).ok,true);
 assert.equal(rotationSweepWithinBounds(vertices,[4,4],Math.PI/2,bounds),false);
 assert.equal(previewRotation(r,null,"beam",raw).code,"path-bounds");
 const external=isolated({objects:[{id:"beam",vertices:rectangle(3,1,1,1),permissions:["rotate"],support:"enchanted"}]});
 const tx=commitRotation(external,null,"beam",{...turn,cx:1,cy:1});
 assert.equal(tx.ok,true,tx.message);assert.deepEqual(tx.room.objects[0].vertices[0],[1,3]);
 assert.deepEqual(tx.record.centre,[1,1]);
});
test("hazards, player, touching edges and fixed hinge direction",()=>{
 const r=isolated({hazards:[{id:"hazard",vertices:thinObstacle()}]});
 assert.equal(previewRotation(r,null,"beam",turn).code,"path-hazard");
 const clear=isolated();
 assert.equal(previewRotation(clear,{x:3,y:2},"beam",turn).code,"path-player");
 assert.equal(previewRotation(room,player,id,{...GATE_SOLUTION,cy:7}).code,"hinge");
 assert.equal(previewRotation(room,player,id,{...GATE_SOLUTION,cy:8.00000001}).code,"hinge");
 assert.equal(previewRotation(room,player,id,{...GATE_SOLUTION,direction:"clockwise"}).code,"path-solid");
 assert.equal(previewObject(room,player,id,"rotate",{...GATE_SOLUTION,angle:270,direction:"clockwise"}).ok,true);
 assert.equal(previewRotation(room,player,id,{...GATE_SOLUTION,angle:270,direction:"clockwise"}).code,"path-bounds");
 assert.equal(previewRotation(room,player,id,GATE_SOLUTION).ok,true); // contact with bracket/floor/lintel is allowed
 assert.equal(previewRotation(room,player,id,{...GATE_SOLUTION,angle:45}).code,"parameters");
});
test("atomic commit, exact endpoint, matching physics and pure animation",()=>{
 const before=JSON.stringify(room),p=JSON.stringify(player);
 const tx=commitRotation(room,player,id,GATE_SOLUTION);
 assert.equal(tx.ok,true,tx.message);
 assert.equal(tx.physics.room,tx.room);
 assert.deepEqual(tx.room.objects[0].vertices,[[19,8],[19,8.5],[14,8.5],[14,8]]);
 assert.deepEqual(tx.room.objects[0].hinge,[14,8]);assert.ok(Object.isFrozen(tx.room.objects[0].vertices[0]));
 assert.equal(JSON.stringify(room),before);assert.equal(JSON.stringify(player),p);
 assert.deepEqual(tx.record,{objectId:id,type:"rotate",angle:90,direction:"anticlockwise",centre:[14,8]});
 assert.equal(blocked(world,{x:14.25,y:3}),true);assert.equal(blocked(tx.physics,{x:14.25,y:3}),false);
 const start=rotatedFrame(tx.room,tx.transition,0),half=rotatedFrame(tx.room,tx.transition,.5);
 assert.deepEqual(start.objects[0].vertices,room.objects[0].vertices);
 near(half.objects[0].vertices[0][0],14+5/Math.sqrt(2));near(half.objects[0].vertices[0][1],8-5/Math.sqrt(2));
 assert.equal(rotatedFrame(tx.room,tx.transition,1),tx.room);
 near(signedRadians(tx.record),Math.PI/2);
 const reversed=commitRotation(tx.room,player,id,{...GATE_SOLUTION,direction:"clockwise"});
 assert.equal(reversed.ok,true,reversed.message);assert.deepEqual(reversed.room.objects[0].vertices,room.objects[0].vertices);
 assert.equal(commitRotation(room,player,id,{...GATE_SOLUTION,direction:"clockwise"}).ok,false);
 assert.equal(JSON.stringify(room),before);
 assert.match(gateHint(room,2),/14, 8/);assert.match(gateHint(tx.room,3),/already open/);
});
test("closed gate blocks repeated jumps; actual open geometry permits completion",()=>{
 let p=player;
 for(let i=0;i<850;i++)p=stepPlayer(world,p,{move:1,jump:i%140===0});
 assert.equal(p.completed,false);assert.ok(p.x<14);
 const tx=commitRotation(room,player,id,GATE_SOLUTION);assert.equal(tx.ok,true);
 function replay(){let q=player;for(let i=0;i<550;i++)q=stepPlayer(tx.physics,q,{move:1});return q;}
 const a=replay();assert.equal(a.completed,true);assert.equal(a.respawns,0);near(a.y,3);assert.deepEqual(a,replay());
 assert.equal(commitRotation(tx.room,a,id,{...GATE_SOLUTION,direction:"clockwise"}).code,"attempt-ended");
});
