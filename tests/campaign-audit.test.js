import test from "node:test";
import assert from "node:assert/strict";
import {RECORDED_ROUTES,auditLevel} from "../tools/campaign-audit.mjs";
import {LEVELS} from "../src/levels/campaign.js";
import {contextualGuide,tutorialSituation,castStatusMessage} from "../src/levels/tutorial-guidance.js";
import {createPhysicsWorld} from "../src/physics/collision.js";
import {createPlayer} from "../src/physics/platformer.js";
test("audit fixtures cover every level of the first three chapters",()=>{
 assert.deepEqual(RECORDED_ROUTES.map(f=>f.number),LEVELS.filter(l=>l.number<=12).map(l=>l.number));
});
for(const fixture of RECORDED_ROUTES)test("campaign audit level "+fixture.number+": recorded and worked-hint route, geometry and scoring",()=>{
 const report=auditLevel(fixture);
 assert.deepEqual(report.errors,[],JSON.stringify(report));
});
test("automatic guidance fades; optional hints remain separate and guide-off feedback is neutral",()=>{
 for(const l of LEVELS.filter(l=>l.number<=12)){
  const r=l.room,p=createPlayer(createPhysicsWorld(r)),g=tutorialSituation(r),guide=contextualGuide(r,p,null);
  assert.equal(guide.step,"Explore");
  if(r.chapter===1)assert.ok(guide.text.includes(g.config.objective));
  else assert.ok(!guide.text.includes(g.config.objective),"Leaked solution objective: "+r.id);
  assert.equal(castStatusMessage(r,g,false,"specific ready answer"),"Transformation applied. Inspect the new arrangement.");
  assert.ok(!castStatusMessage(r,g,true).includes(g.config.objective));
 }
});
