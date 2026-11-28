import test from "node:test";
import assert from "node:assert/strict";
import {THE_WANDERING_PIVOT,THE_MIRRORED_MECHANISM,WANDERING_PIVOT_CASTS,MIRRORED_MECHANISM_CASTS} from "../src/levels/alchemist-pivots.js";
import {previewTranslation,translatedFrame} from "../src/transformations/translation.js";
import {previewRotation} from "../src/transformations/rotation.js";
import {previewReflection,reflectedFrame} from "../src/transformations/reflection.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {validateDraft,copyCampaignRoom,moveItem,copy} from "../workshop/model.js";
import {auditLevel,RECORDED_ROUTES,campaignActions} from "../tools/campaign-audit.mjs";
import {tutorialSituation} from "../src/levels/tutorial-guidance.js";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;};
const pair=room=>room.objects.map(o=>o.hinge);
test("translation carries both pieces and checks the child's path",()=>{
 const s=createWorkshopSession(THE_WANDERING_PIVOT),[a,b]=WANDERING_PIVOT_CASTS;
 assert.ok(validateDraft(s.room));assert.equal(previewTranslation(s.room,s.player,b.objectId,a).code,"permission");
 const snapshot=JSON.stringify(s.room),p=previewTranslation(s.room,s.player,a.objectId,a);
 assert.ok(p.ok,p.message);assert.deepEqual(p.attachedImages[0].geometry.hinge,[22,4]);assert.equal(JSON.stringify(s.room),snapshot);
 const wall={...s.room,terrain:[...s.room.terrain,{id:"test-wall",vertices:[[12,8],[13,8],[13,9],[12,9]]}]};
 assert.equal(previewTranslation(wall,s.player,a.objectId,a).code,"path-solid");
 const tx=cast(s,a);assert.deepEqual(pair(s.room),[[22,4],[22,4]]);assert.deepEqual(tx.record.attachedIds,["wandering-beam"]);
 assert.deepEqual(pair(translatedFrame(tx.room,tx.transition,.5)),[[15,4],[15,4]]);
 assert.equal(previewRotation(s.room,s.player,b.objectId,{...b,cx:8}).code,"hinge");
 assert.deepEqual(tutorialSituation(s.room).raw,{angle:90,direction:"clockwise",cx:22,cy:4});
 const carrier=copy(s.room.objects[0]);cast(s,b);assert.deepEqual(s.room.objects[0],carrier);
 assert.ok(s.undo().ok);assert.deepEqual(pair(s.room),[[22,4],[22,4]]);
 assert.ok(s.undo().ok);assert.deepEqual(pair(s.room),[[8,4],[8,4]]);
});
test("reflection transfers both pieces and their shared pivot; winding and source fade preserved",()=>{
 const s=createWorkshopSession(THE_MIRRORED_MECHANISM),[a,b]=MIRRORED_MECHANISM_CASTS;
 const p=previewReflection(s.room,s.player,a.objectId,a);assert.ok(p.ok,p.message);
 const wall={...s.room,terrain:[...s.room.terrain,{id:"test-wall",vertices:[[23,8],[25,8],[25,9],[23,9]]}]};
 assert.equal(previewReflection(wall,s.player,a.objectId,a).code,"solid-overlap");
 const tx=cast(s,a);assert.deepEqual(pair(s.room),[[24,4],[24,4]]);
 assert.deepEqual(pair(reflectedFrame(tx.room,tx.transition,.25)),[[10,4],[10,4]]);
 assert.deepEqual(pair(reflectedFrame(tx.room,tx.transition,.75)),[[24,4],[24,4]]);
 assert.equal(previewRotation(s.room,s.player,b.objectId,{...b,cx:10}).code,"hinge");
 cast(s,b);assert.equal(tutorialSituation(s.room).ready,true);
 assert.ok(s.undo().ok);assert.ok(s.undo().ok);assert.deepEqual(pair(s.room),[[10,4],[10,4]]);
});
test("authoring preserves attachments on carrier drag; broken links and mismatched hinges rejected",()=>{
 const draft=copyCampaignRoom(THE_WANDERING_PIVOT),moved=moveItem(draft,"objects","wandering-socket",2,0);
 assert.deepEqual(pair(moved),[[10,4],[10,4]]);assert.ok(validateDraft(moved));
 const bad=copy(moved);bad.objects[1].hinge=[11,4];assert.throws(()=>validateDraft(bad),/pivot|attachment/i);
 const dangling=copy(moved);dangling.objects[1].attachedTo="missing";assert.throws(()=>validateDraft(dangling),/socket|attachment/i);
});
for(const n of [27,28])test("verified campaign and workshop replay "+n,()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===n),s=createWorkshopSession(n===27?THE_WANDERING_PIVOT:THE_MIRRORED_MECHANISM);
 for(const a of campaignActions(f)){
  if(a.kind==="cast")cast(s,a.cast);
  else {const [ticks,move,jump,climb=0]=a.segment;for(let i=0;i<ticks&&!s.player.completed;i++)assert.ok(s.step({move,jump:Boolean(jump&&i===0),climb}).ok);}
 }
 const bundle=s.bundle(),report=auditLevel(f);assert.equal(bundle.result.moves,2);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 assert.equal(report.stars,3);assert.deepEqual(report.errors,[],JSON.stringify(report));
});
