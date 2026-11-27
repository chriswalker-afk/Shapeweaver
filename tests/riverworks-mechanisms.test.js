import test from "node:test";
import assert from "node:assert/strict";
import {DOUBLE_TROUBLE,DIAGONAL_DOCK,DOUBLE_TROUBLE_SOLUTION,DIAGONAL_DOCK_SOLUTION} from "../src/levels/riverworks-mechanisms.js";
import {plateGroups,platePressed,resolveMechanisms,multiPlateEffects} from "../src/mechanisms/pressure-plates.js";
import {bearingStatus} from "../src/mechanisms/structural-bearings.js";
import {createPhysicsWorld,blocked} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
import {previewReflection,commitReflection} from "../src/transformations/reflection.js";
import {previewTranslation,commitTranslation} from "../src/transformations/translation.js";
import {referencePoints} from "../src/transformations/preview-math.js";
import {rectangle,signedArea} from "../src/geometry/world.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
import {validateDraft,addTemplate,newDraft} from "../workshop/model.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {RECORDED_ROUTES,auditLevel,replayRoute} from "../tools/campaign-audit.mjs";
const gate=r=>r.objects.find(o=>o.id==="sluice-gate");
const counts=r=>plateGroups(r)[0].held;
const player=r=>createPlayer(createPhysicsWorld(r));
function cast(r,s,p=player(r)){
 const t=(s.type==="translate"?commitTranslation:commitReflection)(r,p,s.objectId,s);assert.ok(t.ok,t.message);return t;
}
test("all linked plates must be held by actual contact, not merely cached flags",()=>{
 const r=DOUBLE_TROUBLE,p=player(r),[a,b]=DOUBLE_TROUBLE_SOLUTION;
 assert.ok(validateDraft(r));assert.equal(counts(r),0);assert.equal(gate(r).open,false);
 const stale={...r,plates:r.plates.map(q=>({...q,pressed:true}))};assert.equal(counts(stale),0);assert.equal(gate(resolveMechanisms(stale)).open,false);
 const insufficient=cast(r,{...b,dx:5.4});assert.equal(platePressed(insufficient.room,r.plates[1]),false);
 const edge=cast(r,{...b,dx:5.5});assert.equal(platePressed(edge.room,r.plates[1]),true);
 const aPreview=previewReflection(r,p,a.objectId,a);
 assert.ok(aPreview.ok);assert.deepEqual(aPreview.mechanismEffects,["Plate 1 will be held.","1/2 linked plates will be held."]);
 const first=cast(r,a);assert.equal(counts(first.room),1);assert.equal(gate(first.room).open,false);assert.equal(blocked(first.physics,{x:38.5,y:3}),true);
 const next=previewTranslation(first.room,p,b.objectId,b);
 assert.deepEqual(next.mechanismEffects,["Plate 2 will be held.","2/2 linked plates will be held.","Sluice gate will open."]);
 const second=cast(first.room,b);assert.equal(counts(second.room),2);assert.equal(gate(second.room).open,true);assert.equal(blocked(second.physics,{x:38.5,y:3}),false);
 const release=previewTranslation(second.room,p,b.objectId,{dx:-6,dy:0});
 assert.ok(release.ok);assert.deepEqual(release.mechanismEffects,["Plate 2 will be released.","1/2 linked plates will be held.","Sluice gate will close."]);
 assert.equal(previewTranslation(second.room,{...p,x:38.5,y:3},b.objectId,{dx:-6,dy:0}).code,"gate-obstructed");
 const undo=undoLastCast(recordCast(createAttemptHistory(),first.physics,p,null,second.record),p);
 assert.ok(undo.ok);assert.equal(counts(undo.room),1);assert.equal(gate(undo.room).open,false);
 assert.equal(counts(r),0);assert.deepEqual(multiPlateEffects(r,r),[]);
});
test("both orders and swapped counterweights are legal, with live hints following the remaining plate",()=>{
 const r=DOUBLE_TROUBLE,[a,b]=DOUBLE_TROUBLE_SOLUTION;
 let t=cast(r,b);assert.equal(counts(t.room),1);assert.equal(gate(t.room).open,false);
 const h=tutorialSituation(t.room);assert.equal(h.config.objectId,a.objectId);assert.deepEqual(h.raw,{line:"x = 10"});
 t=cast(t.room,a);assert.equal(gate(t.room).open,true);
 const route=RECORDED_ROUTES.find(f=>f.number===15).route;assert.equal(replayRoute(t.physics,route).player.completed,true);
 const swapped=cast(r,{...a,line:"x = 17"}),g=tutorialSituation(swapped.room);
 assert.equal(counts(swapped.room),1);assert.equal(g.config.objectId,b.objectId);assert.deepEqual(g.raw,{dx:-8,dy:0});
 const final=cast(swapped.room,{...b,...g.raw});assert.equal(gate(final.room).open,true);assert.equal(replayRoute(final.physics,route).player.completed,true);
});
test("diagonal reflection preserves labelled coordinates and creates an essential raised support",()=>{
 const r=DIAGONAL_DOCK,p=player(r),[a,b]=DIAGONAL_DOCK_SOLUTION;
 assert.ok(validateDraft(r));assert.equal(previewTranslation(r,p,b.objectId,b).code,"bearing-unsupported");
 assert.equal(previewReflection(r,p,a.objectId,{line:"y=-x"}).code,"bounds");
 const t=cast(r,a),bracket=t.room.objects.find(o=>o.id===a.objectId);
 const refs=Object.fromEntries(referencePoints(bracket).map(v=>[v.id,v.point]));
 for(const [id,pt] of Object.entries(Object.fromEntries(referencePoints(r.objects[0]).map(v=>[v.id,v.point]))))assert.deepEqual(refs[id],[pt[1],pt[0]]);
 assert.deepEqual(refs.A,[9,3]);assert.deepEqual(refs.E,[22,4.5]);assert.ok(signedArea(bracket.vertices)>0);
 const hint=tutorialSituation(t.room);assert.equal(hint.config.objectId,b.objectId);assert.deepEqual(hint.raw,{dx:-12,dy:0});
 const s=cast(t.room,b);assert.deepEqual(bearingStatus(s.room,s.room.objects.find(o=>o.id===b.objectId)),[true,true]);
 assert.equal(previewReflection(s.room,p,a.objectId,{line:"y=x"}).code,"bearing-unsupported");
 const back=cast(s.room,{...b,dx:12});assert.equal(previewReflection(back.room,p,a.objectId,{line:"y=x"}).ok,true);
 const initialHint=tutorialHint(r,p,5);assert.match(initialHint.text,/Reflect in y = x/);assert.match(initialHint.text,/Enter these parameters yourself/);
});
test("workshop L-shaped dock template has usable concave geometry and reflection permission",()=>{
 const a=addTemplate(newDraft(),"dock-bracket",8,3),o=a.room.objects[0];
 assert.equal(o.vertices.length,6);assert.deepEqual(o.permissions,["reflect"]);assert.ok(validateDraft(a.room));
});
for(const fixture of RECORDED_ROUTES.filter(f=>f.number>=15&&f.number<=16))test("independent workshop proof and campaign audit: level "+fixture.number,()=>{
 const r=fixture.number===15?DOUBLE_TROUBLE:DIAGONAL_DOCK,s=createWorkshopSession(r);
 for(const c of fixture.casts){const t=s.cast(c.type,c.objectId,c);assert.ok(t.ok,t.message);}
 for(const [n,move,jump,climb=0] of fixture.route)for(let i=0;i<n&&!s.player.completed;i++){const result=s.step({move,climb,jump:Boolean(jump&&i===0)});assert.ok(result.ok,result.message);}
 const bundle=s.bundle();assert.equal(bundle.result.moves,2);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 const report=auditLevel(fixture);assert.deepEqual(report.errors,[],JSON.stringify(report));assert.ok(report.partialRoutes.every(r=>!r.completed));
});
