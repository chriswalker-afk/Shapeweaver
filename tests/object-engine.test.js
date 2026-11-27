import test from "node:test";
import assert from "node:assert/strict";
import {rectangle,signedArea} from "../src/geometry/world.js";
import {polygonsOverlap,triangulate,pointInPolygon,pointPolygonDistance} from "../src/geometry/polygons.js";
import {GATEHOUSE_PREVIEW,validateRoom} from "../src/levels/gatehouse-preview.js";
import {createObjectEngine,previewObject,validateObjectDefinitions} from "../src/core/object-engine.js";
import {parsePreviewRequest,transformPoint,previewGeometry} from "../src/transformations/preview-math.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer,stepPlayer} from "../src/physics/platformer.js";
const room=validateRoom(GATEHOUSE_PREVIEW),physics=createPhysicsWorld(room),player=createPlayer(physics),engine=createObjectEngine(room);
test("objects are selected by actual polygon geometry, including remote props",()=>{
  assert.deepEqual(engine.objects().map(o=>o.id),["beam","gate","wedge"]);
  assert.equal(engine.hit({x:4,y:6.8}).id,"beam");
  assert.equal(engine.hit({x:5,y:4.3}),null); // Inside wedge AABB but outside the triangle.
  assert.equal(engine.hit({x:5,y:3.1}).id,"wedge");
  assert.equal(engine.hit({x:18.2,y:2.8}),null); // Decorative crate.
  assert.equal(engine.hit({x:4,y:6.58},.1).id,"beam");
  assert.equal(engine.hit({x:-1,y:6.8},10),null);
  assert.equal(engine.get("crate"),null);
  assert.deepEqual(engine.references("gate").at(-1),{id:"H",point:[31.2,6]});
  const bad=structuredClone(room);bad.objects[0].permissions=["fly"];assert.throws(()=>validateObjectDefinitions(bad),/permissions/);
  const bad2=structuredClone(room);bad2.objects[3].permissions=["translate"];assert.throws(()=>validateObjectDefinitions(bad2),/Decorative/);
});
test("polygon decomposition detects positive-area overlaps, not touching or empty concave regions",()=>{
  const l=[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]];
  assert.equal(triangulate(l).reduce((sum,t)=>sum+signedArea(t),0),7);
  assert.equal(polygonsOverlap(l,rectangle(2,2,1,1)),false);
  assert.equal(polygonsOverlap(l,rectangle(1,1,1,2)),false);
  assert.equal(polygonsOverlap(l,rectangle(.5,.5,1,1)),true);
  assert.equal(polygonsOverlap(rectangle(0,0,2,2),rectangle(2,2,1,1)),false);
  assert.equal(polygonsOverlap(rectangle(0,0,2,2),rectangle(0,0,2,2)),true);
  assert.equal(pointInPolygon([1,2],l),true);
  assert.equal(pointPolygonDistance([2,2],l),1);
  assert.throws(()=>triangulate([[0,0],[3,3],[0,3],[3,0]]));
});
test("explicit parameter parsing and pure preview geometry",()=>{
  const request=(type,raw)=>{const r=parsePreviewRequest(type,raw);assert.ok(r);return r};
  assert.deepEqual(transformPoint([2,3],request("translate",{dx:"4",dy:"−2"})),[6,1]);
  assert.deepEqual(transformPoint([3,3],request("rotate",{angle:"90",direction:"clockwise",cx:"2",cy:"3"})),[2,2]);
  assert.deepEqual(transformPoint([3,3],request("rotate",{angle:270,direction:"anticlockwise",cx:2,cy:3})),[2,2]);
  assert.deepEqual(transformPoint([5,7],request("enlarge",{factor:"1/2",cx:1,cy:3})),[3,5]);
  assert.deepEqual(transformPoint([3,7],request("reflect",{line:"x = 5"})),[7,7]);
  assert.deepEqual(transformPoint([3,7],request("reflect",{line:"y = 2"})),[3,-3]);
  assert.deepEqual(transformPoint([3,7],request("reflect",{line:"y = x"})),[7,3]);
  assert.deepEqual(transformPoint([3,7],request("reflect",{line:"y = −x"})),[-7,-3]);
  for(const raw of [{dx:"",dy:"2"},{dx:"1e2",dy:0},{dx:"2+3",dy:0},null])assert.equal(parsePreviewRequest("translate",raw),null);
  assert.equal(parsePreviewRequest("rotate",{angle:45,direction:"clockwise",cx:0,cy:0}),null);
  assert.equal(parsePreviewRequest("enlarge",{factor:"1/0",cx:0,cy:0}),null);
  assert.equal(parsePreviewRequest("reflect",{line:"y=2x+1"}),null);
  const o=engine.get("wedge"),g=previewGeometry(o,request("reflect",{line:"x=5.2"}));
  assert.ok(signedArea(g.vertices)>0);
  assert.deepEqual(g.points.map(r=>r.id),["A","B","C"]);
  assert.deepEqual(g.points[0].point,[6.4,3]);
});
test("all four example ghosts validate final pose and do not mutate level or player",()=>{
  const before=JSON.stringify(room),original=JSON.stringify(player);
  const examples=[
    ["beam","translate",{dx:14,dy:-3.65},[15.5,3]],
    ["gate","rotate",{angle:90,direction:"anticlockwise",cx:31.2,cy:6},[31.2,6]],
    ["wedge","enlarge",{factor:1.5,cx:4,cy:3},[4,3]],
    ["wedge","reflect",{line:"x=5.2"},[6.4,3]]
  ];
  for(const [id,type,raw,expected] of examples){
    const r=engine.preview(player,id,type,raw);
    assert.equal(r.ok,true,r.message);assert.equal(r.scope,"final-pose");
    assert.match(r.message,/Travel path is not yet checked/);
    assert.deepEqual(r.geometry.points[0].point,expected);
    assert.ok(Object.isFrozen(r.geometry.vertices[0]));
    assert.equal(JSON.stringify(room),before);assert.equal(JSON.stringify(player),original);
  }
  assert.equal(engine.apply,undefined);
});
test("invalid previews give specific reasons and preserve original geometry",()=>{
  const check=(id,type,raw,code,p=player)=>{const r=engine.preview(p,id,type,raw);assert.equal(r.ok,false);assert.equal(r.code,code,r.message);};
  check("crate","translate",{dx:1,dy:0},"not-selectable");
  check("beam","reflect",{line:"x=5"},"permission");
  check("beam","translate",{dx:"",dy:2},"parameters");
  check("beam","translate",{dx:0,dy:0},"identity");
  check("beam","translate",{dx:40,dy:0},"bounds");
  check("beam","translate",{dx:0,dy:1},"unsupported");
  check("beam","translate",{dx:0,dy:-.2},"solid-overlap");
  check("beam","translate",{dx:14,dy:-5.65},"solid-overlap");
  check("beam","translate",{dx:8,dy:-5.65},"solid-overlap");
  const hazardRoom={bounds:{minX:0,maxX:10,minY:0,maxY:10},terrain:[],hazards:[{id:"water",vertices:rectangle(4,0,3,2)}],objects:[{id:"test",vertices:rectangle(1,1,1,1),permissions:["translate"],support:"enchanted"}]};
  assert.equal(previewObject(hazardRoom,null,"test","translate",{dx:4,dy:0}).code,"hazard-overlap");
  check("wedge","enlarge",{factor:3,cx:4,cy:3},"scale-limit");
  check("wedge","enlarge",{factor:1.5,cx:7,cy:3},"player-overlap");
  check("gate","rotate",{angle:90,direction:"clockwise",cx:0,cy:0},"hinge");
  check("beam","translate",{dx:14,dy:-3.65},"player-supported",{x:4,y:7.07});
});
test("movement route still completes without changing objects",()=>{
  let p=createPlayer(physics);const before=JSON.stringify(room.objects);
  for(const [count,input] of [[210,{move:1}],[120,{move:1,jump:true}],[160,{move:1}]])
    for(let i=0;i<count;i++)p=stepPlayer(physics,p,{...input,jump:Boolean(input.jump)&&i===0});
  assert.equal(p.completed,true);assert.equal(p.respawns,0);assert.equal(JSON.stringify(room.objects),before);
});
