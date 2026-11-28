import test from "node:test";
import assert from "node:assert/strict";
import {THE_OBSERVATORY_MACHINE,THE_FINAL_ASCENT,MACHINE_CASTS,ASCENT_CASTS,ASCENT_ALTERNATIVE_CASTS} from "../src/levels/observatory-finale.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {auditLevel,auditAlternativeRoute,ALTERNATIVE_ROUTES,RECORDED_ROUTES,campaignActions} from "../tools/campaign-audit.mjs";
import {tutorialSituation} from "../src/levels/tutorial-guidance.js";
import {deliveryReady} from "../src/mechanisms/delivery.js";
import {previewTranslation} from "../src/transformations/translation.js";
import {previewReflection} from "../src/transformations/reflection.js";
import {validateDraft} from "../workshop/model.js";
import {polygonBounds} from "../src/geometry/world.js";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;};
const move=(s,n,jump=false)=>{for(let i=0;i<n&&!s.player.completed;i++)assert.ok(s.step({move:1,jump:jump&&i===0,climb:0}).ok);};
const cross=s=>{move(s,300);move(s,120,true);move(s,210);};
const states=s=>s.room.objects.filter(o=>o.kind==="linked-gate").map(o=>o.open);
function replay(f,room){const s=createWorkshopSession(room);for(const a of campaignActions(f)){if(a.kind==="cast")cast(s,a.cast);else {const [ticks,direction,jump,climb=0]=a.segment;for(let i=0;i<ticks&&!s.player.completed;i++)assert.ok(s.step({move:direction,jump:Boolean(jump&&i===0),climb}).ok);}}return s;}
test("machine uses exclusive selector outputs and a genuinely conjunctive final lock",()=>{
 const s=createWorkshopSession(THE_OBSERVATORY_MACHINE),[a,b,c,d,e]=MACHINE_CASTS;
 assert.ok(validateDraft(s.room));assert.deepEqual(states(s),[false,true,false]);assert.deepEqual(s.room.plates.map(p=>p.pressed),[true,true]);
 assert.equal(s.preview(b.type,b.objectId,b).code,"path-solid");
 cast(s,a);assert.deepEqual(states(s),[true,false,false]);assert.deepEqual(s.room.plates.map(p=>p.pressed),[false,false]);
 cast(s,e);assert.equal(s.room.shapeSockets[0].filled,true);assert.deepEqual(states(s),[true,false,false]);assert.ok(s.undo().ok);
 cast(s,b);assert.equal(tutorialSituation(s.room,s.player).travel,true);cross(s);assert.equal(s.player.checkpoint,"machine-island");
 assert.deepEqual(tutorialSituation(s.room,s.player).raw,{line:"x = 39"});
 assert.equal(previewReflection(s.room,{x:28,y:4.6},c.objectId,c).code,"player-supported");
 cast(s,c);assert.equal(previewTranslation(s.room,{x:18.5,y:3},d.objectId,d).code,"gate-obstructed");
 cast(s,d);assert.deepEqual(states(s),[false,true,false]);cast(s,e);assert.deepEqual(states(s),[false,true,true]);assert.ok(tutorialSituation(s.room,s.player).ready);
 assert.equal(s.preview(e.type,e.objectId,e).code,"socket-locked");assert.ok(s.undo().ok);assert.deepEqual(states(s),[false,true,false]);
});
test("both summit strategies use every spell and deliver the star",()=>{
 assert.ok(validateDraft(THE_FINAL_ASCENT));
 const canonical=RECORDED_ROUTES.find(f=>f.number===36),alt=ALTERNATIVE_ROUTES.find(f=>f.number===36);
 for(const f of [canonical,alt]){
  const s=replay(f,THE_FINAL_ASCENT),bundle=s.bundle(),result=f.name?auditAlternativeRoute(f):auditLevel(f);
  assert.equal(new Set(f.casts.map(c=>c.type)).size,4);assert.equal(bundle.result.moves,5);assert.equal(bundle.result.respawns,0);
  assert.ok(deliveryReady(s.room));assert.ok(s.player.completed);assert.equal(s.player.checkpoint,"summit-checkpoint");
  assert.equal(polygonBounds(s.room.objects.find(o=>o.id==="ascent-deck").vertices).minX,f.name?22:44);
  assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});assert.deepEqual(result.errors,[],JSON.stringify(result));assert.equal(result.stars,3);
 }
});
test("machine campaign and independent workshop replay",()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===35),s=replay(f,THE_OBSERVATORY_MACHINE),bundle=s.bundle(),result=auditLevel(f);
 assert.equal(bundle.result.moves,5);assert.equal(bundle.result.respawns,0);
 assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});assert.deepEqual(result.errors,[],JSON.stringify(result));assert.equal(result.stars,3);
});
