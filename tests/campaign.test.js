import test from "node:test";
import assert from "node:assert/strict";
import {CHAPTERS,LEVELS,filterLevels,campaignProgress} from "../src/levels/campaign.js";
import {createBestResults} from "../src/core/best-results.js";
import {mountCampaign} from "../src/ui/campaign.js";
test("only released levels are playable and planned chapters cover 36 levels",()=>{
 assert.equal(CHAPTERS.length,7);assert.equal(CHAPTERS.at(-1).last,36);
 assert.deepEqual(LEVELS.map(l=>l.number),[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]);
 assert.deepEqual(filterLevels({spell:"reflect"}).map(l=>l.number),[4,6,8,11,15,16,28,31,32,33,34,35,36]);
 assert.equal(filterLevels({math:"2"}).length,3);
 assert.equal(filterLevels({chapter:"2"}).length,4);
 assert.equal(filterLevels({chapter:"3",spell:"rotate"}).length,3);
 assert.equal(filterLevels({chapter:"4"}).length,6);
 assert.deepEqual(filterLevels({chapter:"4",spell:"translate"}).map(l=>l.number),[13,14,15,16,18]);
 assert.deepEqual(filterLevels({chapter:"4",spell:"rotate"}).map(l=>l.number),[14,17,18]);
 assert.deepEqual(filterLevels({chapter:"4",spell:"enlarge"}).map(l=>l.number),[17]);
 assert.deepEqual(filterLevels({chapter:"5"}).map(l=>l.number),[19,20,21,22,23,24]);
 assert.deepEqual(filterLevels({chapter:"5",spell:"rotate"}).map(l=>l.number),[20,23,24]);
 assert.deepEqual(filterLevels({chapter:"6"}).map(l=>l.number),[25,26,27,28,29,30]);
 assert.deepEqual(filterLevels({chapter:"6",spell:"enlarge"}).map(l=>l.number),[25,26,30]);
 assert.deepEqual(filterLevels({chapter:"7"}).map(l=>l.number),[31,32,33,34,35,36]);
 assert.deepEqual(filterLevels({chapter:"7",spell:"rotate"}).map(l=>l.number),[32,33,36]);
 assert.equal(filterLevels({math:"1",puzzle:"1"}).length,4);
});
test("all 36 completed gives 108 stars and the replay route; storage failures remain session-only",()=>{
 const best=createBestResults({get localStorage(){throw Error("storage blocked");}});
 for(const l of LEVELS)best.record({levelId:l.id,moves:l.room.tutorial.efficientMoves,stars:3});
 const p=campaignProgress(best);assert.equal(p.completed,36);assert.equal(p.total,36);assert.equal(p.stars,108);assert.equal(p.maximum,108);assert.equal(p.next.number,1);assert.equal(best.persisted,false);
});
test("progress uses existing personal bests and resumes first incomplete level",()=>{
 const best=createBestResults({});assert.equal(campaignProgress(best).next.number,1);
 best.record({levelId:"gatehouse-02",moves:1,stars:3});assert.equal(campaignProgress(best).next.number,1);
 best.record({levelId:"gatehouse-01",moves:2,stars:2});
 const p=campaignProgress(best);assert.equal(p.completed,2);assert.equal(p.stars,5);assert.equal(p.maximum,108);assert.equal(p.next.number,3);
});

function element(){
 const listeners=new Map(),attributes={};
 return {children:[],textContent:"",value:"",listeners,disabled:false,hidden:false,attributes,
 style:{setProperty(k,v){attributes[k]=v;}},
 setAttribute(k,v){attributes[k]=String(v);},getAttribute(k){return attributes[k]??null;},
 append(...nodes){this.children.push(...nodes)},replaceChildren(...nodes){this.children=nodes},
 addEventListener(type,fn){listeners.set(type,fn)},removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type)},
 fire(type,event={}){if(!this.disabled)listeners.get(type)?.({preventDefault(){},...event});},focus(){this.focused=true;}};
}
function fixture(){
 const ids="campaign-view campaign-map campaign-levels campaign-progress campaign-resume campaign-clear filter-spell filter-math filter-puzzle filter-chapter library-atlas library-puzzles library-find library-find-secondary library-back library-heading library-chapter-banner library-chapter-art library-chapter-name library-chapter-progress library-search library-count library-selected-detail library-detail-number library-detail-title library-detail-spells library-detail-ratings library-detail-score library-play library-empty library-completed library-stars library-progress-bar campaign-celebration".split(" ");
 const els=Object.fromEntries(ids.map(id=>[id,element()]));
 const routes=[],best=createBestResults({});
 const ui=mountCampaign({getElementById:id=>els[id],createElement:()=>element()},best,route=>routes.push(route));
 const click=id=>els[id].fire("click"),tiles=()=>els["campaign-levels"].children,chapters=()=>els["campaign-map"].children;
 return {els,routes,best,ui,click,tiles,chapters};
}
test("atlas shows seven chapters, never an initial wall of puzzles; choose and play all 36",()=>{
 const {els,routes,ui,click,tiles,chapters}=fixture();
 ui.render();
 assert.equal(chapters().length,7);assert.ok(chapters().every(c=>!c.disabled));
 assert.equal(tiles().length,0);assert.equal(els["library-puzzles"].hidden,true);
 for(const c of CHAPTERS){
  chapters()[c.id-1].fire("click");
  const levels=LEVELS.filter(l=>l.chapter===c.id);
  assert.deepEqual(tiles().map(e=>Number(e.getAttribute("data-level"))),levels.map(l=>l.number));
  assert.equal(els["library-atlas"].hidden,true);assert.equal(els["library-search"].hidden,true);
  for(const [i,l] of levels.entries()){
   const before=routes.length;tiles()[i].fire("click");
   assert.equal(routes.length,before,"selection must not launch gameplay");
   assert.equal(els["library-detail-title"].textContent,l.title);
   assert.equal(els["library-detail-spells"].children.length,l.spells.length);
   assert.equal(els["library-detail-ratings"].children[0].children[2].textContent,l.math+"/5");
   assert.equal(els["library-detail-ratings"].children[1].children[2].textContent,l.puzzle+"/5");
   assert.equal(tiles().filter(t=>t.getAttribute("aria-pressed")==="true").length,1);
   assert.equal(tiles()[i].tabIndex,0);
   click("library-play");assert.equal(routes.at(-1),l.route);
  }
  click("library-back");assert.equal(els["library-atlas"].hidden,false);assert.ok(chapters()[c.id-1].focused);
 }
 assert.deepEqual(routes,LEVELS.map(l=>l.route));ui.destroy();
 assert.ok(Object.values(els).every(e=>e.listeners.size===0));
});
test("optional global search retains all filter combinations, empty state and explicit play",()=>{
 const {els,routes,ui,click,tiles,chapters}=fixture();ui.render();click("library-find");
 assert.equal(tiles().length,36);assert.equal(els["library-search"].hidden,false);
 els["filter-spell"].value="reflect";els["filter-spell"].fire("change");assert.equal(tiles().length,13);
 tiles()[0].fire("click");assert.deepEqual(routes,[]);click("library-play");assert.deepEqual(routes,["level4"]);
 els["filter-math"].value="5";els["filter-math"].fire("change");
 assert.deepEqual(tiles().map(e=>Number(e.getAttribute("data-level"))),[32,35,36]);
 assert.match(els["library-detail-title"].textContent,/Astronomer/);
 els["filter-chapter"].value="1";els["filter-chapter"].fire("change");assert.equal(tiles().length,0);assert.equal(els["library-empty"].hidden,false);assert.equal(els["library-play"].disabled,true);
 click("library-play");assert.equal(routes.length,1);
 click("campaign-clear");assert.equal(tiles().length,36);assert.equal(els["library-empty"].hidden,true);
 click("library-back");chapters()[1].fire("click");assert.equal(tiles().length,4);assert.equal(els["library-search"].hidden,true);
 assert.ok(["spell","math","puzzle","chapter"].every(k=>els["filter-"+k].value===""));
});
test("keyboard selection, return to exact puzzle, atlas reset and saved progress",()=>{
 const {els,routes,best,ui,click,tiles}=fixture();
 best.record({levelId:"gatehouse-01",moves:2,stars:2});
 ui.render({route:"level1",reset:true});
 assert.equal(els["library-detail-title"].textContent,LEVELS[0].title);
 assert.equal(tiles()[0].getAttribute("data-completed"),"true");
 assert.match(els["library-detail-score"].children[1].textContent,/2\/3 stars · 2 moves/);
 assert.match(els["campaign-progress"].textContent,/1 \/ 36 released puzzles complete · 2 \/ 108 stars/);
 tiles()[0].fire("keydown",{key:"ArrowRight"});assert.equal(tiles()[1].getAttribute("aria-pressed"),"true");assert.ok(tiles()[1].focused);
 tiles()[1].fire("keydown",{key:"End"});assert.equal(tiles()[3].getAttribute("aria-pressed"),"true");
 click("library-play");click("campaign-resume");assert.deepEqual(routes,["level4","level2"]);
 ui.render({reset:true});assert.equal(tiles().length,0);assert.equal(els["library-puzzles"].hidden,true);
 for(const l of LEVELS)best.record({levelId:l.id,moves:1,stars:3});
 ui.render();assert.equal(els["library-stars"].textContent,"★ 108 / 108");assert.equal(els["campaign-celebration"].hidden,false);
 click("campaign-resume");assert.equal(routes.at(-1),"level1");
});
