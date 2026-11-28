import test from "node:test";
import assert from "node:assert/strict";
import {TOO_BIG_TO_FIT,SMALL_NOW_BIG_LATER,TOO_BIG_CASTS,SMALL_NOW_CASTS} from "../src/levels/alchemist-workshop.js";
import {previewEnlargement} from "../src/transformations/enlargement.js";
import {previewTranslation} from "../src/transformations/translation.js";
import {polygonBounds,signedArea} from "../src/geometry/world.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {validateDraft} from "../workshop/model.js";
import {auditLevel,RECORDED_ROUTES,campaignActions} from "../tools/campaign-audit.mjs";
import {tutorialSituation,tutorialHint} from "../src/levels/tutorial-guidance.js";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;};
const near=(a,b)=>Math.abs(a-b)<1e-7;
test("half-scale step: correct centre fixes the right-hand base, lengths halve and area quarters",()=>{
 const s=createWorkshopSession(TOO_BIG_TO_FIT),c=TOO_BIG_CASTS[0],original=s.room.objects[0].vertices;
 assert.ok(validateDraft(TOO_BIG_TO_FIT));
 const p=previewEnlargement(s.room,s.player,c.objectId,{...c,factor:"1/2"});
 assert.ok(p.ok,p.message);assert.equal(p.request.factor,.5);
 assert.deepEqual(tutorialSituation(s.room).raw,{factor:.5,cx:20,cy:3});
 assert.match(tutorialHint(s.room,s.player,5).text,/1\/2.*Enter these parameters yourself/);
 assert.equal(s.summary().moves,0);
 cast(s,{...c,factor:"1/2"});
 const b=polygonBounds(s.room.objects[0].vertices);
 assert.ok(near(b.maxY,5.2));assert.equal(b.minX,15);assert.equal(b.maxX,20);
 assert.ok(near(signedArea(s.room.objects[0].vertices),signedArea(original)/4));
 assert.equal(tutorialSituation(s.room).ready,true);assert.ok(s.undo().ok);
 assert.deepEqual(s.room.objects[0].vertices,original);
});
test("narrow passage rejects full-size crossing and premature growth; only real geometry decides clearance",()=>{
 const s=createWorkshopSession(SMALL_NOW_BIG_LATER),[a,b,c]=SMALL_NOW_CASTS;
 assert.ok(validateDraft(SMALL_NOW_BIG_LATER));
 assert.equal(previewTranslation(s.room,s.player,b.objectId,b).code,"path-solid");
 assert.equal(previewEnlargement(s.room,s.player,a.objectId,{...a,factor:.25}).code,"scale-limit");
 cast(s,a);
 assert.deepEqual(polygonBounds(s.room.objects[0].vertices),{minX:4,maxX:10,minY:11,maxY:12.5});
 assert.deepEqual(tutorialSituation(s.room).raw,{dx:27,dy:0});
 const clipped=previewTranslation(s.room,s.player,b.objectId,{...b,dy:1});assert.equal(clipped.code,"path-solid");
 cast(s,b);assert.deepEqual(tutorialSituation(s.room).raw,{factor:2,cx:34,cy:19.5});
 cast(s,c);assert.deepEqual(polygonBounds(s.room.objects[0].vertices),{minX:28,maxX:40,minY:2.5,maxY:5.5});
 assert.equal(tutorialSituation(s.room).ready,true);assert.ok(s.undo().ok);
 assert.deepEqual(polygonBounds(s.room.objects[0].vertices),{minX:31,maxX:37,minY:11,maxY:12.5});
});
for(const n of [25,26])test("campaign and independent workshop replay "+n,()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===n),s=createWorkshopSession(n===25?TOO_BIG_TO_FIT:SMALL_NOW_BIG_LATER);
 for(const a of campaignActions(f)){
  if(a.kind==="cast")cast(s,a.cast);
  else {const [ticks,move,jump,climb=0]=a.segment;for(let i=0;i<ticks&&!s.player.completed;i++)assert.ok(s.step({move,jump:Boolean(jump&&i===0),climb}).ok);}
 }
 const bundle=s.bundle(),report=auditLevel(f);
 assert.equal(bundle.result.moves,f.casts.length);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
 assert.equal(report.stars,3);assert.deepEqual(report.errors,[],JSON.stringify(report));
});
