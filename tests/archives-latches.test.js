import test from "node:test";
import assert from "node:assert/strict";
import {NO_GOING_BACK,LOCKED_PASSAGE,NO_GOING_BACK_CASTS,LOCKED_PASSAGE_CASTS} from "../src/levels/archives-latches.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {validateDraft} from "../workshop/model.js";
import {previewTranslation} from "../src/transformations/translation.js";
import {selectableObjects} from "../src/core/object-engine.js";
import {auditLevel,RECORDED_ROUTES} from "../tools/campaign-audit.mjs";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);};
test("one-way latch holds after weight leaves and undo restores state",()=>{
 const s=createWorkshopSession(NO_GOING_BACK);assert.ok(validateDraft(NO_GOING_BACK));
 cast(s,NO_GOING_BACK_CASTS[0]);assert.equal(s.room.plates[0].latched,true);
 cast(s,NO_GOING_BACK_CASTS[1]);assert.equal(s.room.objects.find(o=>o.id==="latch-gate").open,true);
 assert.equal(s.room.objects.find(o=>o.id==="hold-gate").open,true);
 assert.ok(s.undo().ok);assert.equal(s.room.plates[0].latched,true);
 assert.ok(s.undo().ok);assert.equal(s.room.plates[0].latched,false);
});
test("wrong locking recess captures only key; undo restores selection",()=>{
 assert.ok(validateDraft(LOCKED_PASSAGE));const s=createWorkshopSession(LOCKED_PASSAGE);
 cast(s,{objectId:"passage-key",type:"translate",dx:6,dy:0});
 assert.equal(s.room.shapeSockets[0].filled,true);assert.equal(s.room.shapeSockets[1].filled,false);
 assert.ok(!selectableObjects(s.room).some(o=>o.id==="passage-key"));
 assert.equal(previewTranslation(s.room,s.player,"passage-key",{dx:8,dy:0}).code,"socket-locked");
 assert.ok(s.undo().ok);assert.ok(selectableObjects(s.room).some(o=>o.id==="passage-key"));
 for(const c of LOCKED_PASSAGE_CASTS)cast(s,c);
 assert.equal(s.room.shapeSockets[1].filled,true);
});
for(const n of [21,22])test("verified campaign and independent replay "+n,()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===n),s=createWorkshopSession(n===21?NO_GOING_BACK:LOCKED_PASSAGE);
 for(const c of f.casts)cast(s,c);
 for(let i=0;i<1000&&!s.player.completed;i++)assert.ok(s.step({move:1,jump:false,climb:0}).ok);
 const bundle=s.bundle();assert.equal(bundle.result.moves,2);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 assert.deepEqual(auditLevel(f).errors,[]);
});
