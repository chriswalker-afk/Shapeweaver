import test from "node:test";
import assert from "node:assert/strict";
import {CHAPTERS,LEVELS,filterLevels,campaignProgress} from "../src/levels/campaign.js";
import {createBestResults} from "../src/core/best-results.js";
import {mountCampaign} from "../src/ui/campaign.js";
test("only released levels are playable and planned chapters cover 36 levels",()=>{
 assert.equal(CHAPTERS.length,7);assert.equal(CHAPTERS.at(-1).last,36);
 assert.deepEqual(LEVELS.map(l=>l.number),[1,2,3,4,5,6]);
 assert.deepEqual(filterLevels({spell:"reflect"}).map(l=>l.number),[4,6]);
 assert.equal(filterLevels({math:"2"}).length,2);
 assert.equal(filterLevels({chapter:"2"}).length,2);
 assert.equal(filterLevels({math:"1",puzzle:"1"}).length,4);
});
test("progress uses existing personal bests and resumes first incomplete level",()=>{
 const best=createBestResults({});assert.equal(campaignProgress(best).next.number,1);
 best.record({levelId:"gatehouse-02",moves:1,stars:3});assert.equal(campaignProgress(best).next.number,1);
 best.record({levelId:"gatehouse-01",moves:2,stars:2});
 const p=campaignProgress(best);assert.equal(p.completed,2);assert.equal(p.stars,5);assert.equal(p.maximum,18);assert.equal(p.next.number,3);
});

function element(){
 const listeners=new Map();
 return {children:[],textContent:"",value:"",listeners,disabled:false,
 append(...nodes){this.children.push(...nodes)},replaceChildren(...nodes){this.children=nodes},
 addEventListener(type,fn){listeners.set(type,fn)},removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type)},
 fire(type){if(!this.disabled)listeners.get(type)?.()}};
}
test("library shows only playable puzzles, filters, resumes and refreshes progress",()=>{
 const ids="campaign-view campaign-map campaign-levels campaign-progress campaign-resume campaign-clear filter-spell filter-math filter-puzzle filter-chapter".split(" ");
 const els=Object.fromEntries(ids.map(id=>[id,element()]));
 const routes=[],best=createBestResults({});
 const ui=mountCampaign({getElementById:id=>els[id],createElement:()=>element()},best,route=>routes.push(route));
 ui.render();
 assert.equal(els["campaign-map"].children.length,7);
 assert.equal(els["campaign-map"].children.filter(c=>c.disabled).length,5);
 assert.equal(els["campaign-levels"].children.length,6);
 els["filter-spell"].value="reflect";els["filter-spell"].fire("change");
 assert.equal(els["campaign-levels"].children.length,2);
 els["campaign-levels"].children[0].fire("click");
 assert.deepEqual(routes,["level4"]);
 els["filter-math"].value="3";els["filter-math"].fire("change");
 assert.match(els["campaign-levels"].children[0].textContent,/No released puzzles/);
 els["campaign-clear"].fire("click");assert.equal(els["campaign-levels"].children.length,6);
 best.record({levelId:"gatehouse-01",moves:2,stars:2});
 ui.render();assert.match(els["campaign-progress"].textContent,/1 \/ 6 released puzzles complete · 2 \/ 18 stars/);
 els["campaign-resume"].fire("click");assert.deepEqual(routes,["level4","level2"]);
 assert.match(els["campaign-levels"].children[0].children.at(-1).textContent,/★★☆ · 2 moves/);
 ui.destroy();assert.ok(Object.values(els).every(e=>e.listeners.size===0));
});
