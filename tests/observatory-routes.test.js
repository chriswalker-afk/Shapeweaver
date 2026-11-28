import test from "node:test";
import assert from "node:assert/strict";
import {THREE_WAYS_ACROSS,THE_LOST_STAR,LONG_DECK_CASTS,TWO_SPAN_CASTS,REUSE_DECK_CASTS,LOST_STAR_CASTS} from "../src/levels/observatory-routes.js";
import {deliveryFilled,deliveryReady} from "../src/mechanisms/delivery.js";
import {previewReflection} from "../src/transformations/reflection.js";
import {createWorkshopSession,verifyWorkshopBundle} from "../workshop/replay.js";
import {validateDraft,copy,copyCampaignRoom,itemEntries,moveItem} from "../workshop/model.js";
import {auditLevel,auditAlternativeRoute,ALTERNATIVE_ROUTES,RECORDED_ROUTES,campaignActions} from "../tools/campaign-audit.mjs";
import {tutorialSituation} from "../src/levels/tutorial-guidance.js";
import {polygonBounds} from "../src/geometry/world.js";
import {completedResult} from "../src/core/level-results.js";
import {createAttemptHistory} from "../src/core/attempt-history.js";
const cast=(s,c)=>{const r=s.cast(c.type,c.objectId,c);assert.ok(r.ok,r.message);return r;};
const move=(s,n,jump=false,direction=1)=>{for(let i=0;i<n&&!s.player.completed;i++)assert.ok(s.step({move:direction,jump:jump&&i===0,climb:0}).ok);};
function replay(f,s){for(const a of campaignActions(f)){if(a.kind==="cast")cast(s,a.cast);else {const [ticks,direction,jump,climb=0]=a.segment;for(let i=0;i<ticks&&!s.player.completed;i++)assert.ok(s.step({move:direction,jump:Boolean(jump&&i===0),climb}).ok);}}return s;}
test("all three routes use distinct actual object geometry and independently replay",()=>{
 const canonical=RECORDED_ROUTES.find(f=>f.number===33),reports=[];
 for(const f of [canonical,...ALTERNATIVE_ROUTES.filter(f=>f.number===33)]){
  const s=replay(f,createWorkshopSession(THREE_WAYS_ACROSS)),bundle=s.bundle();
  assert.deepEqual(verifyWorkshopBundle(bundle),{ok:true,result:bundle.result});
  assert.equal(bundle.result.moves,f.casts.length);assert.equal(bundle.result.respawns,0);
  reports.push(f.name?auditAlternativeRoute(f):auditLevel(f));
  const [long,short,raised]=s.room.objects.map(o=>polygonBounds(o.vertices));
  if(!f.name){assert.equal(long.minX,22);assert.equal(long.maxX,56);assert.equal(short.minX,2);}
  else if(f.name==="Two independent spans"){assert.equal(long.minX,4);assert.equal(short.minX,22);assert.equal(raised.minX,44);assert.equal(raised.maxY,5.4);}
  else {assert.equal(long.minX,4);assert.equal(short.minX,44);assert.equal(raised.minX,55.4);assert.equal(s.player.checkpoint,"three-ways-far");}
  assert.ok(tutorialSituation(s.room,s.player).ready);
 }
 assert.deepEqual(reports.map(r=>r.errors),[[],[],[]]);
 assert.deepEqual(reports.map(r=>[r.moves,r.stars]),[[1,3],[2,2],[2,2]]);
});
test("crystal delivery is live exact geometric fit and is not consumed by preview",()=>{
 const s=createWorkshopSession(THE_LOST_STAR),[a,b]=LOST_STAR_CASTS;
 assert.equal(deliveryReady(s.room),false);assert.equal(previewReflection(s.room,s.player,b.objectId,{line:"x=22.5"}).ok,true);
 const p=s.preview(b.type,b.objectId,b);assert.ok(p.ok);assert.match(p.mechanismEffects.join(" "),/Crystal will fit Star receiver.*portal available/);assert.equal(deliveryReady(s.room),false);
 cast(s,b);assert.ok(deliveryFilled(s.room,s.room.deliveries[0]));assert.equal(s.player.completed,false);
 assert.ok(s.undo().ok);assert.equal(deliveryReady(s.room),false);
 cast(s,b);cast(s,b);assert.equal(deliveryReady(s.room),false);
 assert.equal(completedResult(s.room,{...s.player,completed:true},createAttemptHistory()),null);
 const unrelated=copy(s.room);unrelated.objects.push({...unrelated.objects[1],id:"decoy",vertices:unrelated.deliveries[0].vertices});
 assert.equal(deliveryReady(unrelated),false);
});
test("portal alone cannot finish the lost star; delivering from the portal can finish",()=>{
 const s=createWorkshopSession(THE_LOST_STAR),[a,b]=LOST_STAR_CASTS;
 cast(s,a);move(s,300);move(s,120,true);move(s,280);
 assert.ok(Math.abs(s.player.x-s.room.exit.x)<.9);assert.equal(s.player.completed,false);
 assert.equal(s.player.respawns,0);assert.throws(()=>s.bundle(),/reach the portal/i);
 cast(s,b);move(s,1,false,0);assert.equal(s.player.completed,true);
 assert.deepEqual(verifyWorkshopBundle(s.bundle()),{ok:true,result:s.bundle().result});
});
test("delivery targets validate references, can be edited in workshop and reject invalid links",()=>{
 const room=copyCampaignRoom(THE_LOST_STAR);
 assert.ok(itemEntries(room).some(e=>e.group==="deliveries"&&e.id==="star-receiver"));
 assert.ok(validateDraft(moveItem(room,"deliveries","star-receiver",1,0)));
 const bad=copy(room);bad.deliveries[0].objectId="rescue-deck";assert.throws(()=>validateDraft(bad),/delivery/i);
 const duplicate=copy(room);duplicate.deliveries.push({...duplicate.deliveries[0],id:"second-target"});assert.throws(()=>validateDraft(duplicate),/delivery/i);
});
test("lost star canonical and hinted campaign and workshop replays",()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===34),s=replay(f,createWorkshopSession(THE_LOST_STAR));
 assert.deepEqual(verifyWorkshopBundle(s.bundle()),{ok:true,result:s.bundle().result});
 const report=auditLevel(f);assert.deepEqual(report.errors,[],JSON.stringify(report));assert.equal(report.stars,3);
});
