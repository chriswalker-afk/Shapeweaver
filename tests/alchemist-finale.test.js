import test from "node:test";
import assert from "node:assert/strict";
import {ONE_OPENS_ONE_CLOSES,THE_ALCHEMISTS_TRIAL,AIRLOCK_CASTS,TRIAL_CASTS} from "../src/levels/alchemist-finale.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {validateDraft,copy} from "../workshop/model.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {previewTranslation} from "../src/transformations/translation.js";
import {resolveMechanisms} from "../src/mechanisms/pressure-plates.js";
import {tutorialSituation} from "../src/levels/tutorial-guidance.js";
import {auditLevel,RECORDED_ROUTES,campaignActions} from "../tools/campaign-audit.mjs";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;};
const gateStates=r=>r.objects.filter(o=>o.kind==="linked-gate").map(o=>o.open);
const move=(s,n,jump=false)=>{for(let i=0;i<n&&!s.player.completed;i++)assert.ok(s.step({move:1,jump:jump&&i===0,climb:0}).ok);};
test("complementary selector outputs switch together, reject unsafe closure and restore on undo",()=>{
 const s=createWorkshopSession(ONE_OPENS_ONE_CLOSES),[a,b]=AIRLOCK_CASTS;
 assert.deepEqual(gateStates(s.room),[false,true]);assert.equal(s.room.plates[0].pressed,true);
 const preview=s.preview(a.type,a.objectId,a);assert.ok(preview.ok);assert.match(preview.mechanismEffects.join(" "),/one gate opens and the other closes/);assert.deepEqual(gateStates(s.room),[false,true]);
 cast(s,a);assert.deepEqual(gateStates(s.room),[true,false]);assert.equal(tutorialSituation(s.room,s.player).travel,true);
 assert.equal(previewTranslation(s.room,{x:18.5,y:3},b.objectId,b).code,"gate-obstructed");
 move(s,380);assert.equal(s.player.checkpoint,"airlock-refuge");assert.deepEqual(tutorialSituation(s.room,s.player).raw,{dx:6,dy:0});
 cast(s,b);assert.deepEqual(gateStates(s.room),[false,true]);assert.ok(tutorialSituation(s.room,s.player).ready);
 assert.ok(s.undo().ok);assert.deepEqual(gateStates(s.room),[true,false]);assert.equal(s.player.checkpoint,"airlock-refuge");
});
test("selector rejects duplicated outputs, latches and non-exclusive wiring",()=>{
 for(const patch of [{closedGateId:"held-gate"},{closedGateId:"missing"},{latch:true,latched:true}]){
  const r=copy(ONE_OPENS_ONE_CLOSES);Object.assign(r.plates[0],patch);assert.throws(()=>validateRoom(resolveMechanisms(r)),/selector|gate|latch/i);
 }
 const r=copy(ONE_OPENS_ONE_CLOSES);r.plates.push({id:"extra",x:4,y:8,width:2,contact:2,gateId:"free-gate",pressed:false});assert.throws(()=>validateRoom(resolveMechanisms(r)),/exclusive/i);
});
test("trial requires safe traversal before the bridge is reused; preview cannot remove the player's support",()=>{
 const s=createWorkshopSession(THE_ALCHEMISTS_TRIAL),[a,b,c,d,e]=TRIAL_CASTS;
 assert.ok(validateDraft(s.room));assert.equal(s.preview(b.type,b.objectId,b).code,"path-solid");
 for(const action of [a,b,c])cast(s,action);
 assert.equal(tutorialSituation(s.room,s.player).travel,true);
 assert.equal(previewTranslation(s.room,{x:34,y:6},d.objectId,d).code,"player-supported");
 move(s,400);move(s,110,true);move(s,100);move(s,120,true);
 assert.equal(s.player.checkpoint,"trial-refuge");assert.deepEqual(tutorialSituation(s.room,s.player).raw,{dx:24,dy:0});
 cast(s,d);assert.equal(tutorialSituation(s.room,s.player).config.objectId,e.objectId);cast(s,e);assert.ok(tutorialSituation(s.room,s.player).ready);
 assert.ok(s.undo().ok);assert.ok(s.undo().ok);assert.equal(tutorialSituation(s.room,s.player).raw.dx,24);
});
for(const n of [29,30])test("chronological campaign and independent workshop replay "+n,()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===n),s=createWorkshopSession(n===29?ONE_OPENS_ONE_CLOSES:THE_ALCHEMISTS_TRIAL);
 for(const a of campaignActions(f)){if(a.kind==="cast")cast(s,a.cast);else {const [ticks,direction,jump,climb=0]=a.segment;for(let i=0;i<ticks&&!s.player.completed;i++)assert.ok(s.step({move:direction,jump:Boolean(jump&&i===0),climb}).ok);}}
 const bundle=s.bundle(),report=auditLevel(f);assert.equal(bundle.result.moves,f.casts.length);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});assert.equal(report.stars,3);assert.deepEqual(report.errors,[],JSON.stringify(report));
});
