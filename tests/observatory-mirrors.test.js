import test from "node:test";
import assert from "node:assert/strict";
import {THE_WANDERING_MIRROR,THE_ASTRONOMERS_BRIDGE,WANDERING_MIRROR_CASTS,ASTRONOMERS_BRIDGE_CASTS} from "../src/levels/observatory-mirrors.js";
import {railMirrorValue} from "../src/mechanisms/movable-mirrors.js";
import {previewReflection} from "../src/transformations/reflection.js";
import {previewTranslation,translatedFrame} from "../src/transformations/translation.js";
import {previewRotation} from "../src/transformations/rotation.js";
import {polygonBounds} from "../src/geometry/world.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {validateDraft,copy} from "../workshop/model.js";
import {auditLevel,RECORDED_ROUTES,campaignActions} from "../tools/campaign-audit.mjs";
import {tutorialSituation} from "../src/levels/tutorial-guidance.js";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;};
const move=(s,n,jump=false)=>{for(let i=0;i<n&&!s.player.completed;i++)assert.ok(s.step({move:1,jump:jump&&i===0,climb:0}).ok);};
test("current slider position constrains linked reflection, not unlinked objects",()=>{
 const s=createWorkshopSession(THE_WANDERING_MIRROR),[a,b]=WANDERING_MIRROR_CASTS;
 assert.ok(validateDraft(s.room));assert.equal(railMirrorValue(s.room.objects[0]),10);
 assert.equal(previewReflection(s.room,s.player,b.objectId,b).code,"mirror-line");
 assert.equal(previewReflection(s.room,s.player,b.objectId,{line:"y=10"}).code,"mirror-line");
 assert.equal(previewTranslation(s.room,s.player,a.objectId,{dx:9,dy:1}).code,"mirror-rail-axis");
 const original=JSON.stringify(s.room),preview=previewTranslation(s.room,s.player,a.objectId,a);
 assert.ok(preview.ok);assert.match(preview.mechanismEffects.join(" "),/x = 10 to x = 19/);assert.equal(JSON.stringify(s.room),original);
 const tx=cast(s,a);assert.equal(railMirrorValue(translatedFrame(tx.room,tx.transition,.5).objects[0]),14.5);
 assert.equal(railMirrorValue(s.room.objects[0]),19);assert.equal(previewReflection(s.room,s.player,b.objectId,{line:"x=10"}).code,"mirror-line");
 const free=copy(s.room);delete free.objects[1].mirrorRailId;assert.ok(previewReflection(free,s.player,b.objectId,{line:"x=18"}).ok);
 cast(s,b);assert.deepEqual(polygonBounds(s.room.objects[1].vertices),{minX:22,maxX:34,minY:4,maxY:5});
 assert.ok(s.undo().ok);assert.ok(s.undo().ok);assert.equal(railMirrorValue(s.room.objects[0]),10);
 assert.equal(previewReflection(s.room,s.player,b.objectId,b).code,"mirror-line");
});
test("invalid rail reference and rail permissions rejected by workshop validation",()=>{
 const r=copy(THE_WANDERING_MIRROR);r.objects[1].mirrorRailId="missing";
 assert.throws(()=>validateDraft(r),/mirror/i);
 const bad=copy(THE_WANDERING_MIRROR);bad.objects[0].permissions=["translate","reflect"];
 assert.throws(()=>validateDraft(bad),/mirror/i);
});
test("reflection reuses rotated assembly and preserves its shared pivot, undo and live hints",()=>{
 const s=createWorkshopSession(THE_ASTRONOMERS_BRIDGE),[a,b,c,d]=ASTRONOMERS_BRIDGE_CASTS;
 assert.ok(validateDraft(s.room));cast(s,a);cast(s,b);
 assert.equal(tutorialSituation(s.room,s.player).travel,true);
 move(s,300);move(s,120,true);move(s,210);
 assert.equal(s.player.checkpoint,"star-refuge");assert.deepEqual(tutorialSituation(s.room,s.player).raw,{dx:24,dy:0});
 assert.equal(previewReflection(s.room,s.player,d.objectId,d).code,"mirror-line");
 cast(s,c);assert.equal(previewReflection(s.room,{x:28,y:4.6},d.objectId,d).code,"player-supported");
 const tx=cast(s,d);assert.deepEqual(tx.record.attachedIds,["orbit-beam"]);assert.deepEqual(s.room.objects.slice(1).map(o=>o.hinge),[[56,4],[56,4]]);
 assert.equal(previewRotation(s.room,s.player,b.objectId,b).code,"hinge");
 assert.ok(tutorialSituation(s.room,s.player).ready);
 assert.ok(s.undo().ok);assert.deepEqual(s.room.objects.slice(1).map(o=>o.hinge),[[22,4],[22,4]]);
 assert.ok(s.undo().ok);assert.equal(railMirrorValue(s.room.objects[0]),15);
});
for(const n of [31,32])test("chronological campaign and independent workshop replay "+n,()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===n),s=createWorkshopSession(n===31?THE_WANDERING_MIRROR:THE_ASTRONOMERS_BRIDGE);
 for(const a of campaignActions(f)){if(a.kind==="cast")cast(s,a.cast);else {const [ticks,direction,jump,climb=0]=a.segment;for(let i=0;i<ticks&&!s.player.completed;i++)assert.ok(s.step({move:direction,jump:Boolean(jump&&i===0),climb}).ok);}}
 const bundle=s.bundle(),report=auditLevel(f);assert.equal(bundle.result.moves,f.casts.length);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});assert.equal(report.stars,3);assert.deepEqual(report.errors,[],JSON.stringify(report));
});
