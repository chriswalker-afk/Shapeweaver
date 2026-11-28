import test from "node:test";
import assert from "node:assert/strict";
import {BRING_IT_WITH_YOU,A_BRIDGE_AND_A_LADDER,BRING_IT_WITH_YOU_CASTS,A_BRIDGE_AND_A_LADDER_CASTS} from "../src/levels/mirror-archives.js";
import {isBridgeDeck,isSolidObject,ladderSegment} from "../src/mechanisms/transformable-ladders.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
import {previewTranslation,commitTranslation} from "../src/transformations/translation.js";
import {commitRotation} from "../src/transformations/rotation.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
import {validateDraft,newDraft,addTemplate} from "../workshop/model.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {RECORDED_ROUTES,campaignActions,auditLevel} from "../tools/campaign-audit.mjs";
const fixture=n=>RECORDED_ROUTES.find(f=>f.number===n);
function movement(s,route){for(const [n,move,jump,climb=0] of route)for(let i=0;i<n&&!s.player.completed;i++){const r=s.step({move,climb,jump:Boolean(jump&&i===0)});assert.ok(r.ok,r.message);}}
function cast(s,c){const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;}
test("chest crossing must be traversed before reuse; path and player support are protected",()=>{
 const r=BRING_IT_WITH_YOU,[a,b]=BRING_IT_WITH_YOU_CASTS;assert.ok(validateDraft(r));
 const s=createWorkshopSession(r);assert.equal(tutorialSituation(s.room,s.player).phase,"first-cast");cast(s,a);
 assert.equal(tutorialSituation(s.room,s.player).phase,"first-traverse");
 assert.match(tutorialHint(s.room,s.player,5).text,/balcony/);
 assert.equal(previewTranslation(s.room,{...s.player,x:22,y:5.5},b.objectId,b).code,"player-supported");
 assert.equal(previewTranslation(s.room,{...s.player,x:33,y:3},b.objectId,b).code,"path-player");
 movement(s,fixture(19).segments[0]);assert.equal(s.player.checkpoint,"reading-refuge");
 const h=tutorialSituation(s.room,s.player);assert.equal(h.phase,"second-cast");assert.deepEqual(h.raw,{dx:24,dy:0});
 assert.match(tutorialHint(s.room,s.player,5).text,/Enter these parameters yourself/);
 cast(s,b);assert.equal(tutorialSituation(s.room,s.player).ready,true);
 const before=JSON.stringify(s.room);assert.equal(s.recover().recovered,true);
 assert.equal(s.player.checkpoint,"reading-refuge");assert.equal(s.player.x,34);assert.equal(JSON.stringify(s.room),before);
 assert.ok(s.undo().ok);assert.deepEqual(s.room.objects[0].vertices[0],[17,3]);assert.equal(s.player.checkpoint,"reading-refuge");assert.equal(s.summary().moves,2);
});
test("dual-purpose ladder is solid only while horizontal, with moving pivot and genuine climb geometry",()=>{
 const r=A_BRIDGE_AND_A_LADDER,[a,b,c]=A_BRIDGE_AND_A_LADDER_CASTS,o=r.objects[0];assert.ok(validateDraft(r));
 assert.equal(isBridgeDeck(o),true);assert.equal(isSolidObject(o),true);assert.equal(ladderSegment(o),null);
 assert.equal(isSolidObject({...o,bridgeDeck:undefined}),false);
 const s=createWorkshopSession(r);cast(s,a);
 const w=createPhysicsWorld(s.room);
 assert.equal(blocked(w,{x:24,y:3}),true);assert.equal(w.ladders.length,0);
 assert.equal(previewTranslation(s.room,{...s.player,x:24,y:3.6},b.objectId,b).code,"player-supported");
 movement(s,fixture(20).segments[0]);assert.equal(s.player.checkpoint,"catalogue-refuge");assert.deepEqual(tutorialSituation(s.room,s.player).raw,{dx:22,dy:0});
 cast(s,b);assert.deepEqual(s.room.objects[0].hinge,[53,3]);assert.deepEqual(tutorialSituation(s.room,s.player).raw,{angle:90,direction:"clockwise",cx:53,cy:3});
 assert.equal(commitRotation(s.room,s.player,c.objectId,{...c,cx:17}).code,"hinge");
 cast(s,c);const ladder=s.room.objects[0];assert.equal(isBridgeDeck(ladder),false);assert.equal(isSolidObject(ladder),false);
 const seg=ladderSegment(ladder);assert.ok(Math.abs(seg.x-53.3)<1e-8);assert.equal(seg.bottom,3);assert.equal(seg.top,17);
 assert.equal(createPhysicsWorld(s.room).ladders.length,1);assert.equal(tutorialSituation(s.room,s.player).phase,"climb");
 assert.ok(s.undo().ok);assert.equal(isBridgeDeck(s.room.objects[0]),true);assert.equal(createPhysicsWorld(s.room).ladders.length,0);
 assert.equal(s.player.checkpoint,"catalogue-refuge");assert.equal(s.summary().moves,3);
});
test("workshop palette has reusable dual-purpose ladder, initially solid",()=>{
 const a=addTemplate(newDraft(),"bridge-ladder",8,3);
 assert.ok(validateDraft(a.room));assert.equal(isBridgeDeck(a.room.objects[0]),true);assert.deepEqual(a.room.objects[0].hinge,[16,3]);
});
for(const n of [19,20])test("independent chronological proof and live hint audit for level "+n,()=>{
 const f=fixture(n),s=createWorkshopSession(n===19?BRING_IT_WITH_YOU:A_BRIDGE_AND_A_LADDER);
 for(const action of campaignActions(f)){if(action.kind==="cast")cast(s,action.cast);else movement(s,[action.segment]);}
 const bundle=s.bundle(),report=auditLevel(f);
 assert.equal(bundle.result.moves,f.casts.length);assert.equal(bundle.result.respawns,0);
 assert.equal(bundle.actions[0].kind,"cast");assert.equal(bundle.actions[1].kind,"step");
 assert.ok(bundle.actions.findIndex((a,i)=>i>0&&a.kind==="cast")>1);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 assert.deepEqual(report.errors,[],JSON.stringify(report));assert.equal(report.interleaved,true);assert.ok(report.partialRoutes.every(r=>!r.completed));
});
