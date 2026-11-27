import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {LEVELS} from "../src/levels/campaign.js";
import {RECORDED_ROUTES} from "../tools/campaign-audit.mjs";
import {newDraft,copyCampaignRoom,prepareDraft,addTemplate,getItem,itemEntries,moveItem,replaceItem,removeItem,validateDraft,PALETTE,copy} from "../workshop/model.js";
import {createWorkshopSession,verifyWorkshopBundle,LIMITS} from "../workshop/replay.js";
const level=n=>LEVELS.find(l=>l.number===n).room;
const input=(move=0,jump=false,climb=0)=>({move,jump,climb});
function ticks(s,n,move=0,jump=false,climb=0){
 for(let i=0;i<n&&!s.player.completed;i++){const r=s.step(input(move,jump&&i===0,climb));assert.ok(r.ok,r.message);}
}
function execute(fixture){
 const s=createWorkshopSession(copyCampaignRoom(level(fixture.number)));
 for(const c of fixture.casts){const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);}
 for(const [n,move,jump,climb=0] of fixture.route)ticks(s,n,move,Boolean(jump),climb);
 return s;
}
test("authoring operations are isolated, exact, and retain mobile pivots",()=>{
 const base=newDraft(),a=addTemplate(base,"gate",8,3);
 assert.equal(base.objects.length,0);const o=getItem(a.room,a.group,a.id);
 assert.deepEqual(o.hinge,[8,7]);
 const moved=moveItem(a.room,a.group,a.id,2.5,1);
 assert.deepEqual(getItem(moved,a.group,a.id).hinge,[10.5,8]);
 assert.deepEqual(getItem(moved,a.group,a.id).vertices[0],[10.5,4]);
 assert.deepEqual(o.hinge,[8,7]);
 const changed=replaceItem(moved,a.group,a.id,{...getItem(moved,a.group,a.id),label:"A test gate"});
 assert.equal(getItem(changed,a.group,a.id).label,"A test gate");
 assert.throws(()=>replaceItem(changed,a.group,a.id,{...o,id:"changed"}),/stable/);
 assert.equal(removeItem(changed,a.group,a.id).objects.length,0);
 assert.throws(()=>removeItem(base,"spawn","spawn"),/cannot be deleted/);
 const campaign=level(1),snapshot=JSON.stringify(campaign),draft=copyCampaignRoom(campaign);
 moveItem(draft,"objects",draft.objects[0].id,2,0);assert.equal(JSON.stringify(campaign),snapshot);assert.notEqual(draft.id,campaign.id);
});
test("all palette types have editable geometry or precise mechanism fields",()=>{
 let room=newDraft();
 for(const [type] of PALETTE){const a=addTemplate(room,type,8,3);room=a.room;assert.ok(getItem(room,a.group,a.id));}
 assert.equal(itemEntries(room).length,PALETTE.length+3);
 assert.equal(room.plates[0].gateId,room.objects.find(o=>o.kind==="linked-gate").id);
 assert.equal(room.shapeSockets[0].objectId,room.objects.find(o=>o.kind==="key").id);
});
test("invalid draft geometry, unsafe spawn/exit and dangling mechanism links cannot playtest",()=>{
 const base=newDraft();assert.ok(validateDraft(base));
 const a=addTemplate(base,"crate",8,5);
 assert.throws(()=>createWorkshopSession(a.room),/support/);
 const b=moveItem(a.room,a.group,a.id,0,-2);assert.ok(validateDraft(b));
 assert.throws(()=>validateDraft(moveItem(b,a.group,a.id,0,-1)),/overlap/);
 assert.throws(()=>validateDraft({...base,spawn:{x:2,y:5}}),/Spawn/);
 assert.throws(()=>validateDraft({...base,exit:{...base.exit,y:5}}),/Exit/);
 const gate=addTemplate(base,"linked-gate",20,3);assert.throws(()=>validateDraft(gate.room),/linked gate/);
 const plate=addTemplate(gate.room,"plate",9,3);assert.ok(validateDraft(plate.room));
 assert.throws(()=>prepareDraft({...base,terrain:[base.terrain[0],base.terrain[0]]}),/Duplicate/);
});
for(const fixture of RECORDED_ROUTES)test("workshop verifies campaign level "+fixture.number,()=>{
 const s=execute(fixture),bundle=s.bundle(),r=verifyWorkshopBundle(bundle);
 assert.equal(r.ok,true,r.message);assert.equal(r.result.moves,fixture.casts.length);assert.equal(r.result.respawns,0);
 assert.ok(r.result.completed);assert.deepEqual(r.result,bundle.result);
});
test("interleaved inputs, rejected spells, undo and return reproduce exact result",()=>{
 const fixture=RECORDED_ROUTES[0],s=createWorkshopSession(copyCampaignRoom(level(1))),c=fixture.casts[0];
 ticks(s,20,1);
 assert.equal(s.cast(c.type,c.objectId,{dx:200,dy:0}).ok,false);
 assert.equal(s.summary().moves,0);assert.equal(s.actions.length,1);
 assert.ok(s.cast(c.type,c.objectId,c).ok);
 assert.ok(s.undo().ok);assert.equal(s.summary().undos,1);
 assert.ok(s.recover().ok);assert.equal(s.summary().respawns,1);
 assert.ok(s.cast(c.type,c.objectId,c).ok);
 for(const [n,move,jump,climb=0] of fixture.route)ticks(s,n,move,Boolean(jump),climb);
 const bundle=s.bundle();assert.deepEqual(bundle.actions.slice(0,5).map(a=>a.kind),["step","cast","undo","return","cast"]);
 assert.equal(bundle.result.moves,2);assert.equal(bundle.result.undos,1);assert.equal(bundle.result.respawns,1);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 assert.equal(bundle.room.objects[0].vertices[0][0],3);
});
test("only completed, bounded, independently replayed bundles are valid",()=>{
 const s=createWorkshopSession(newDraft());assert.throws(()=>s.bundle(),/Reach the portal/);
 ticks(s,4);assert.equal(s.actions.length,1);assert.equal(s.actions[0].ticks,4);
 ticks(s,1,0,true);ticks(s,4);assert.equal(s.actions.length,2);assert.equal(s.actions[1].jump,true);assert.equal(s.actions[1].ticks,5);
 const bundle=execute(RECORDED_ROUTES[0]).bundle();
 const bad=copy(bundle);bad.result.moves+=1;assert.match(verifyWorkshopBundle(bad).message,/does not match/);
 const incomplete=copy(bundle);incomplete.actions=incomplete.actions.slice(0,1);delete incomplete.result;assert.match(verifyWorkshopBundle(incomplete).message,/did not reach/);
 const over=copy(bundle);over.actions=[{kind:"step",ticks:LIMITS.ticks+1,...input()}];assert.match(verifyWorkshopBundle(over).message,/tick limit/);
 const wrong=copy(bundle);wrong.actions[0].parameters.dx=500;assert.equal(verifyWorkshopBundle(wrong).ok,false);
 const extra=copy(bundle);extra.actions.push({kind:"step",ticks:1,...input()});assert.equal(verifyWorkshopBundle(extra).ok,false);
});
test("CLI verifies exported proof and exits nonzero for altered proof",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"shapeweaver-proof-"));
 try{
  const path=join(dir,"proof.json"),bundle=copy(execute(RECORDED_ROUTES[0]).bundle());
  await writeFile(path,JSON.stringify(bundle));
  let r=spawnSync(process.execPath,["tools/verify-level.mjs",path],{encoding:"utf8"});
  assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).ok,true);
  bundle.result.moves=99;await writeFile(path,JSON.stringify(bundle));
  r=spawnSync(process.execPath,["tools/verify-level.mjs",path],{encoding:"utf8"});
  assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).ok,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
