import test from "node:test";
import assert from "node:assert/strict";
import {CHAPTERS,LEVELS,filterLevels,campaignProgress} from "../src/levels/campaign.js";
import {createBestResults} from "../src/core/best-results.js";
test("only released levels are playable and planned chapters cover 36 levels",()=>{
 assert.equal(CHAPTERS.length,7);assert.equal(CHAPTERS.at(-1).last,36);
 assert.deepEqual(LEVELS.map(l=>l.number),[1,2,3,4]);
 assert.deepEqual(filterLevels({spell:"reflect"}).map(l=>l.number),[4]);
 assert.equal(filterLevels({math:"2"}).length,0);
 assert.equal(filterLevels({chapter:"2"}).length,0);
 assert.equal(filterLevels({math:"1",puzzle:"1"}).length,4);
});
test("progress uses existing personal bests and resumes first incomplete level",()=>{
 const best=createBestResults({});assert.equal(campaignProgress(best).next.number,1);
 best.record({levelId:"gatehouse-02",moves:1,stars:3});assert.equal(campaignProgress(best).next.number,1);
 best.record({levelId:"gatehouse-01",moves:2,stars:2});
 const p=campaignProgress(best);assert.equal(p.completed,2);assert.equal(p.stars,5);assert.equal(p.maximum,12);assert.equal(p.next.number,3);
});
