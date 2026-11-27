import test from "node:test";
import assert from "node:assert/strict";
import {WATERMILL,AROUND_THE_TOWER,WATERMILL_SOLUTION,AROUND_THE_TOWER_SOLUTION} from "../src/levels/riverworks-finale.js";
import {validateRoom} from "../src/levels/gatehouse-preview.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
import {commitRotation,previewRotation,rotatedFrame} from "../src/transformations/rotation.js";
import {commitEnlargement} from "../src/transformations/enlargement.js";
import {commitTranslation} from "../src/transformations/translation.js";
import {referencePoints} from "../src/transformations/preview-math.js";
import {polygonBounds,signedArea} from "../src/geometry/world.js";
import {pointPolygonDistance} from "../src/geometry/polygons.js";
import {createAttemptHistory,recordCast,undoLastCast} from "../src/core/attempt-history.js";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
import {validateDraft,addTemplate,newDraft,moveItem} from "../workshop/model.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {RECORDED_ROUTES,auditLevel,replayRoute} from "../tools/campaign-audit.mjs";
const commits={rotate:commitRotation,enlarge:commitEnlargement,translate:commitTranslation};
const player=r=>createPlayer(createPhysicsWorld(r));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+" vs "+b);
function cast(r,s,p=player(r)){
 const t=commits[s.type](r,p,s.objectId,s);assert.ok(t.ok,t.message);return t;
}
test("waterwheel is one concave solid rotor with fixed axle and exact quarter-turn",()=>{
 const r=WATERMILL,[a,b]=WATERMILL_SOLUTION,p=player(r);assert.ok(validateDraft(r));assert.equal(validateRoom(r),r);
 const o=r.objects[0],before=referencePoints(o),t=cast(r,a),image=t.room.objects[0];
 assert.equal(previewRotation(r,p,a.objectId,{...a,cx:31}).code,"hinge");
 assert.equal(previewRotation(r,p,a.objectId,{...a,cx:32.000000001}).ok,false);
 assert.deepEqual(image.hinge,[32,11]);assert.deepEqual(polygonBounds(image.vertices),{minX:24.6,maxX:39.4,minY:10.5,maxY:11.5});
 close(signedArea(o.vertices),signedArea(image.vertices));
 for(const ref of before){const q=referencePoints(image).find(v=>v.id===ref.id).point;close(q[0],32+ref.point[1]-11);close(q[1],11-ref.point[0]+32);}
 const h=tutorialSituation(t.room);assert.equal(h.config.objectId,b.objectId);assert.deepEqual(h.raw,{factor:3,cx:24,cy:3});
 const s=cast(t.room,b);assert.deepEqual(s.room.objects[1].vertices,[[6,3],[24,3],[24,10.5]]);
 assert.equal(tutorialSituation(s.room).ready,true);
 const u=undoLastCast(recordCast(createAttemptHistory(),createPhysicsWorld(r),p,null,t.record),p);assert.ok(u.ok);assert.equal(u.room,r);
});
test("external centre must be finite, truly outside shape and exactly selected",()=>{
 const r=AROUND_THE_TOWER,[a]=AROUND_THE_TOWER_SOLUTION,p=player(r),o=r.objects[0];
 assert.ok(validateDraft(r));assert.ok(pointPolygonDistance(o.fixedCentre,o.vertices)>0);
 for(const centre of [[18,14],[100,11],[NaN,11]])assert.throws(()=>validateRoom({...r,objects:[{...o,fixedCentre:centre},r.objects[1]]}),/external centre/);
 assert.throws(()=>validateRoom({...r,objects:[{...o,permissions:["rotate","translate"]},r.objects[1]]}),/external centre/);
 assert.equal(previewRotation(r,p,a.objectId,{...a,cx:31}).code,"external-centre");
 assert.equal(previewRotation(r,p,a.objectId,{...a,cy:11.000000001}).code,"external-centre");
 const wrongArc=previewRotation(r,p,a.objectId,{...a,direction:"anticlockwise"});
 assert.equal(wrongArc.ok,false);assert.match(wrongArc.code,/^path-/);
 const t=cast(r,a);assert.deepEqual(t.room.objects[0].fixedCentre,[32,11]);
 const refs=Object.fromEntries(referencePoints(t.room.objects[0]).map(v=>[v.id,v.point]));
 assert.deepEqual(refs.Centre,[32,11]);
 for(const v of referencePoints(o)){close(refs[v.id][0],64-v.point[0]);close(refs[v.id][1],22-v.point[1]);}
 assert.deepEqual(polygonBounds(t.room.objects[0].vertices),{minX:34,maxX:46,minY:7.5,maxY:8});
 assert.match(tutorialHint(r,p,5).text,/180° clockwise about \(32, 11\)/);
 assert.deepEqual(tutorialSituation(t.room).raw,{dx:14,dy:0});
});
test("both new template types are valid and authoring drags their reference centre with the geometry",()=>{
 const a=addTemplate(newDraft(),"waterwheel",8,3),b=addTemplate(newDraft(),"orbit-beam",8,3);
 assert.ok(validateDraft(a.room));assert.ok(validateDraft(b.room));
 const moved=moveItem(b.room,b.group,b.id,2.5,1);
 assert.deepEqual(moved.objects[0].fixedCentre,[18.5,6]);
 assert.deepEqual(b.room.objects[0].fixedCentre,[16,5]);
 assert.ok(validateDraft(moved));
});
for(const fixture of RECORDED_ROUTES.filter(f=>f.number===17||f.number===18))test("workshop proof, hints, partial routes and reverse cast order: level "+fixture.number,()=>{
 const r=fixture.number===17?WATERMILL:AROUND_THE_TOWER,s=createWorkshopSession(r);
 for(const c of fixture.casts){const t=s.cast(c.type,c.objectId,c);assert.ok(t.ok,t.message);}
 for(const [n,move,jump,climb=0] of fixture.route)for(let i=0;i<n&&!s.player.completed;i++){const result=s.step({move,climb,jump:Boolean(jump&&i===0)});assert.ok(result.ok,result.message);}
 const bundle=s.bundle();assert.equal(bundle.result.moves,2);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 const report=auditLevel(fixture);assert.deepEqual(report.errors,[],JSON.stringify(report));assert.ok(report.partialRoutes.every(r=>!r.completed));
 let w=createPhysicsWorld(r);for(const c of [...fixture.casts].reverse())w=cast(w.room,c).physics;
 const alternate=replayRoute(w,fixture.route).player;assert.equal(alternate.completed,true);assert.equal(alternate.respawns,0);
});
