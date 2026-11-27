import test from "node:test";
import assert from "node:assert/strict";
import {BRIDGE_BUILDERS,BROKEN_STAIRCASE,BRIDGE_BUILDERS_SOLUTION,BROKEN_STAIRCASE_SOLUTION} from "../src/levels/riverworks.js";
import {bearingPads,bearingStatus,unsupportedBearing,validateBearings} from "../src/mechanisms/structural-bearings.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
import {commitTranslation,previewTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {rectangle} from "../src/geometry/world.js";
import {validateDraft,addTemplate,newDraft} from "../workshop/model.js";
import {RECORDED_ROUTES,auditLevel,replayRoute} from "../tools/campaign-audit.mjs";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
function cast(room,s,p=createPlayer(createPhysicsWorld(room))){
 const tx=(s.type==="translate"?commitTranslation:commitRotation)(room,p,s.objectId,s);
 assert.ok(tx.ok,tx.message);return tx;
}
test("both bearing regions require actual support, not just centre contact or a ladder",()=>{
 const beam={...BRIDGE_BUILDERS.objects[0],vertices:rectangle(5,3,10,.5)};
 const island={...BRIDGE_BUILDERS,objects:[beam],terrain:[{id:"middle",vertices:rectangle(9,0,2,3)}]};
 assert.deepEqual(bearingStatus(island,beam),[false,false]);assert.equal(unsupportedBearing(island),beam);
 const left={id:"left",vertices:rectangle(0,0,6,3)},right={id:"right",vertices:rectangle(14,0,4,3)};
 assert.deepEqual(bearingStatus({...island,terrain:[left]},beam),[true,false]);
 const ladder={id:"ladder",kind:"ladder",vertices:rectangle(14,0,4,3)};
 assert.deepEqual(bearingStatus({...island,terrain:[left],objects:[beam,ladder]},beam),[true,false]);
 const both={...island,terrain:[left,right]};assert.deepEqual(bearingStatus(both,beam),[true,true]);assert.equal(unsupportedBearing(both),null);
 assert.equal(bearingPads(beam).length,2);assert.throws(()=>validateBearings(island),/Both ends/);
});
test("far span clears the near span's path; unsupported cantilevers are rejected",()=>{
 const r=BRIDGE_BUILDERS,p=createPlayer(createPhysicsWorld(r));
 validateRoom(r);assert.ok(validateDraft(r));
 assert.equal(previewTranslation(r,p,"west-span",BRIDGE_BUILDERS_SOLUTION[1]).code,"solid-overlap");
 const invalid=previewTranslation(r,p,"east-span",{dx:7,dy:0});
 assert.equal(invalid.code,"bearing-unsupported");
 const t=cast(r,BRIDGE_BUILDERS_SOLUTION[0]);const s=cast(t.room,BRIDGE_BUILDERS_SOLUTION[1]);
 assert.equal(unsupportedBearing(s.room),null);
 assert.deepEqual(s.room.objects.map(o=>o.vertices[0]),[[29,3],[42,3]]);
});
test("dependent upper platform prevents removal of its lower support; undo restores it",()=>{
 const r=BROKEN_STAIRCASE,p=createPlayer(createPhysicsWorld(r));validateRoom(r);assert.ok(validateDraft(r));
 assert.equal(previewTranslation(r,p,"upper-step",BROKEN_STAIRCASE_SOLUTION[1]).ok,false);
 const t=cast(r,BROKEN_STAIRCASE_SOLUTION[0]),s=cast(t.room,BROKEN_STAIRCASE_SOLUTION[1]);
 assert.deepEqual(bearingStatus(s.room,s.room.objects.find(o=>o.id==="upper-step")),[true,true]);
 const bad=previewTranslation(s.room,p,"lower-step",{dx:-15,dy:0});
 assert.equal(bad.code,"bearing-unsupported");assert.match(bad.message,/Short upper platform/);
 assert.equal(commitTranslation(s.room,p,"lower-step",{dx:-15,dy:0}).ok,false);
 const u=undoLastCast(recordCast(createAttemptHistory(),t.physics,p,null,s.record),p);
 assert.ok(u.ok);assert.equal(u.room,t.room);
 assert.equal(previewTranslation(u.room,p,"lower-step",{dx:-15,dy:0}).ok,true);
 // A different valid sequence lowers the ladder first, then assembles the steps.
 let w=cast(r,BROKEN_STAIRCASE_SOLUTION[2]).physics;
 for(const c of BROKEN_STAIRCASE_SOLUTION.slice(0,2))w=cast(w.room,c).physics;
 const f=RECORDED_ROUTES.find(x=>x.number===14),q=replayRoute(w,f.route).player;
 assert.equal(q.completed,true);assert.equal(q.respawns,0);
});
test("workshop palette creates reusable two-ended supported beam",()=>{
 const a=addTemplate(newDraft(),"bearing-beam",8,3),o=a.room.objects[0];
 assert.equal(o.bearing,"both-ends");assert.deepEqual(o.permissions,["translate"]);assert.ok(validateDraft(a.room));
});
for(const fixture of RECORDED_ROUTES.filter(f=>f.number>=13&&f.number<=14))test("Riverworks verified bundle "+fixture.number,()=>{
 const r=fixture.number===13?BRIDGE_BUILDERS:BROKEN_STAIRCASE,s=createWorkshopSession(r);
 for(const c of fixture.casts){const t=s.cast(c.type,c.objectId,c);assert.ok(t.ok,t.message);}
 for(const [n,move,jump,climb=0] of fixture.route)for(let i=0;i<n&&!s.player.completed;i++){const result=s.step({move,climb,jump:Boolean(jump&&i===0)});assert.ok(result.ok,result.message);}
 const bundle=s.bundle();assert.equal(bundle.result.moves,fixture.casts.length);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 const report=auditLevel(fixture);assert.deepEqual(report.errors,[]);assert.ok(report.partialRoutes.every(r=>!r.completed));
});
