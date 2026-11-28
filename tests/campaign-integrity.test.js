import test from "node:test";
import assert from "node:assert/strict";
import {expectedPoint,exactImageErrors,auditCatalog,auditIntegrityRoute} from "../tools/campaign-integrity.mjs";
import {RECORDED_ROUTES,ALTERNATIVE_ROUTES,campaignActions} from "../tools/campaign-audit.mjs";
import {LEVELS,CHAPTERS} from "../src/levels/campaign.js";
test("independent oracle checks actual coordinate images, including signs and diagonal lines",()=>{
 const p=[2,3],near=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-8);
 assert.deepEqual(expectedPoint(p,{type:"translate",dx:-4,dy:5}),[-2,8]);
 assert.ok(near(expectedPoint(p,{type:"rotate",angle:90,direction:"clockwise",centre:[1,1]}),[3,0]));
 assert.ok(near(expectedPoint(p,{type:"rotate",angle:270,direction:"anticlockwise",centre:[1,1]}),[3,0]));
 assert.deepEqual(expectedPoint(p,{type:"enlarge",factor:.5,centre:[4,1]}),[3,2]);
 for(const [line,image] of [["x = 4",[6,3]],["y = 1",[2,-1]],["y = x",[3,2]],["y = -x",[-3,-2]]])assert.deepEqual(expectedPoint(p,{type:"reflect",line}),image);
 const before={id:"test",vertices:[[1,1],[3,1],[1,2]]};
 const after={...before,vertices:before.vertices.map(([x,y])=>[x+2,y])};
 // A wrong translation preserves every distance and area, but fails the coordinate oracle.
 assert.equal(exactImageErrors(before,after,{type:"translate",dx:2,dy:0}).length,0);
 assert.equal(exactImageErrors(before,after,{type:"translate",dx:3,dy:0}).length,3);
});
test("release catalog covers all levels, chapters, spells and fixtures",()=>{
 const report=auditCatalog(LEVELS,CHAPTERS,RECORDED_ROUTES,ALTERNATIVE_ROUTES);
 assert.deepEqual(report.errors,[],JSON.stringify(report));
 assert.equal(report.availableStars,108);
 assert.ok(auditCatalog(LEVELS,CHAPTERS,RECORDED_ROUTES.slice(0,-1),ALTERNATIVE_ROUTES).errors.length);
});
for(const n of [1,18,28,35,36])test("release integrity sample "+n+": coordinate, recovery, workshop export",()=>{
 const f=RECORDED_ROUTES.find(f=>f.number===n),r=auditIntegrityRoute(LEVELS.find(l=>l.number===n),f,campaignActions(f));
 assert.deepEqual(r.errors,[],JSON.stringify(r));assert.equal(r.casts,f.casts.length);assert.equal(r.undos,r.casts);assert.equal(r.previewChecks,r.casts);assert.ok(r.bundleVerified);
});
