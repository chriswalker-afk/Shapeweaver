import test from "node:test";
import assert from "node:assert/strict";
import {THE_DOUBLE_SEAL,THE_ARCHIVISTS_CHAIN,DOUBLE_SEAL_CASTS,ARCHIVISTS_CHAIN_CASTS,DOUBLE_SEAL_TARGET} from "../src/levels/archives-finale.js";
import {previewTranslation} from "../src/transformations/translation.js";
import {previewRotation} from "../src/transformations/rotation.js";
import {mixedGateProgress,platePressed} from "../src/mechanisms/pressure-plates.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {validateDraft,newDraft,addTemplate} from "../workshop/model.js";
import {auditLevel,RECORDED_ROUTES} from "../tools/campaign-audit.mjs";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;};
const gate=(s,id)=>s.room.objects.find(o=>o.id===id);
test("double seal rotates as one polygon; flat edge is blocked by separator pin",()=>{
 const s=createWorkshopSession(THE_DOUBLE_SEAL);assert.ok(validateDraft(THE_DOUBLE_SEAL));
 assert.equal(previewTranslation(s.room,s.player,"double-seal",{dx:12,dy:-5}).code,"solid-overlap");
 const [a,b]=DOUBLE_SEAL_CASTS;assert.equal(previewRotation(s.room,s.player,a.objectId,{...a,cx:8}).code,"hinge");
 cast(s,a);assert.ok(!gate(s,"double-gate").open);
 const p=previewTranslation(s.room,s.player,b.objectId,b);assert.ok(p.ok,p.message);assert.ok(p.mechanismEffects.some(x=>x.includes("2/2 linked plates")));
 cast(s,b);assert.deepEqual(s.room.objects[0].vertices,DOUBLE_SEAL_TARGET);assert.equal(gate(s,"double-gate").open,true);
 assert.ok(s.room.plates.every(p=>platePressed(s.room,p)));
 assert.ok(s.undo().ok);assert.equal(gate(s,"double-gate").open,false);
});
test("three rigid feet activate two gates; closed transit gate blocks the key path",()=>{
 const s=createWorkshopSession(THE_ARCHIVISTS_CHAIN);assert.ok(validateDraft(THE_ARCHIVISTS_CHAIN));
 const [a,b,c]=ARCHIVISTS_CHAIN_CASTS;assert.deepEqual(mixedGateProgress(s.room,"chain-gate"),{held:0,total:2});
 cast(s,b);assert.equal(previewTranslation(s.room,s.player,c.objectId,c).code,"path-solid");
 cast(s,a);assert.equal(gate(s,"transit-gate").open,true);assert.equal(gate(s,"chain-gate").open,false);
 assert.deepEqual(mixedGateProgress(s.room,"chain-gate"),{held:1,total:2});
 cast(s,c);assert.equal(gate(s,"chain-gate").open,true);assert.equal(s.room.shapeSockets[0].filled,true);
 assert.deepEqual(mixedGateProgress(s.room,"chain-gate"),{held:2,total:2});
 cast(s,{...a,dx:-8});assert.equal(gate(s,"transit-gate").open,false);assert.equal(gate(s,"chain-gate").open,false);assert.equal(s.room.shapeSockets[0].filled,true);
 assert.ok(s.undo().ok);assert.equal(gate(s,"chain-gate").open,true);
});
test("workshop offers a connected multi-foot compound weight",()=>{
 const d=addTemplate(newDraft(),"compound-weight",8,3);assert.ok(validateDraft(d.room));assert.equal(d.room.objects[0].vertices.length,8);assert.equal(d.room.objects[0].pressesPlates,true);
});
for(const n of [23,24])test("recorded, hinted and independently verified route "+n,()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===n),s=createWorkshopSession(n===23?THE_DOUBLE_SEAL:THE_ARCHIVISTS_CHAIN);
 for(const c of f.casts)cast(s,c);
 for(let i=0;i<1000&&!s.player.completed;i++)assert.ok(s.step({move:1,jump:false,climb:0}).ok);
 const bundle=s.bundle();assert.equal(bundle.result.moves,f.casts.length);assert.equal(bundle.result.respawns,0);assert.equal(auditLevel(f).stars,3);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 assert.deepEqual(auditLevel(f).errors,[]);
});
