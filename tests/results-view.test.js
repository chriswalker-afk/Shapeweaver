import test from "node:test";
import assert from "node:assert/strict";
import {mountResults} from "../src/ui/results.js";
function node(tag="div"){
 const attributes={},listeners=new Map();
 return {tag,attributes,listeners,children:[],textContent:"",hidden:false,disabled:false,
  setAttribute(k,v){attributes[k]=v;},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},
  addEventListener(k,v){listeners.set(k,v);},removeEventListener(k,v){if(listeners.get(k)===v)listeners.delete(k);},click(){listeners.get("click")?.();}};
}
function fixture(){
 const ids="results-view results-heading results-level results-stars results-message results-stats results-thresholds results-best results-history results-empty results-campaign-progress results-replay results-next results-title".split(" ");
 const els=Object.fromEntries(ids.map(id=>[id,node()])),routes=[];
 const view=mountResults({getElementById:id=>els[id],createElement:node},r=>routes.push(r));
 return {els,routes,view};
}
const result={number:1,title:"Across the Brook",stars:2,moves:3,undos:1,returns:2,thresholds:{threeStar:1,twoStar:3},entries:[
 {number:1,objectLabel:"Timber beam",type:"translate",name:"Translation",text:"Column vector (2, 0)",vector:["2","0"],undone:true},
 {number:2,objectLabel:"Gate",type:"rotate",name:"Rotation",text:"90° anticlockwise about (14, 8)",undone:false},
 {number:3,objectLabel:"Cheese",type:"enlarge",name:"Enlargement",text:"Scale factor 0.5, centre (25, 3)",undone:false}
]};
test("completion displays actual stars, four stats and ordered formal history with undo annotation",()=>{
 const {els,view,routes}=fixture();
 view.show(result,{best:{moves:2,stars:2},improved:false,persisted:true},"level1","level2");
 assert.equal(els["results-stars"].attributes["aria-label"],"2 out of 3 stars");
 assert.deepEqual(els["results-stars"].children.map(n=>n.textContent),["★","★","☆"]);
 assert.deepEqual(els["results-stats"].children.map(n=>n.children.map(v=>v.textContent)),[["Moves used","3"],["Target moves","1"],["Undos","1"],["Returns","2"]]);
 assert.match(els["results-best"].textContent,/2 moves.*Saved on this browser/);
 assert.match(els["results-thresholds"].textContent,/No time, hint or fall penalty/);
 const [a,b,c]=els["results-history"].children;
 assert.match(a.className,/result-undone/);assert.equal(a.children[2].textContent,"Undone · still counted");
 const vector=a.children[1].children[1].children[1];assert.deepEqual(vector.children.map(x=>x.textContent),["2","0"]);
 assert.equal(vector.attributes["aria-label"],"Column vector (2, 0)");
 assert.equal(b.children[1].children[1].children[0].textContent,"90° anticlockwise about (14, 8)");
 assert.equal(c.children[1].children[1].children[0].textContent,"Scale factor 0.5, centre (25, 3)");
 els["results-replay"].click();els["results-next"].click();els["results-title"].click();
 assert.deepEqual(routes,["level1","level2","title"]);view.destroy();assert.ok(Object.values(els).every(e=>e.listeners.size===0));
});
test("last released level, no phantom next, session best, zero-move and cleared results",()=>{
 const {els,view,routes}=fixture();
 view.show({...result,number:4,title:"The Missing Barrel",stars:3,moves:1,entries:[{number:1,objectLabel:"Barrel",type:"reflect",name:"Reflection",text:"In the line x = 15",undone:false}]},{best:{moves:1,stars:3},improved:true,persisted:false},"level4",null);
 assert.equal(els["results-next"].hidden,true);assert.equal(els["results-next"].disabled,true);
 assert.match(els["results-best"].textContent,/Personal best!.*This session only/);
 assert.equal(els["results-history"].children[0].children[1].children[1].children[0].textContent,"In the line x = 15");
 els["results-next"].click();assert.deepEqual(routes,[]);
 els["results-replay"].click();assert.deepEqual(routes,["level4"]);
 view.show({...result,stars:3,moves:0,entries:[]},null,"level1","level2");
 assert.equal(els["results-empty"].hidden,false);assert.equal(els["results-history"].children.length,0);
 assert.equal(els["results-next"].hidden,false);view.clear();assert.equal(view.getResult(),null);els["results-next"].click();assert.deepEqual(routes,["level4"]);
});

test("campaign completion is based on all puzzles, not reaching the last portal alone",()=>{
 const {els,view,routes}=fixture();
 const last={...result,number:36,title:"The Final Ascent",stars:3};
 view.show(last,null,"level36",null,{completed:1,total:36,stars:3,maximum:108,next:{number:1,route:"level1"}});
 assert.equal(els["results-heading"].textContent,"Summit reached!");assert.match(els["results-campaign-progress"].textContent,/1 \/ 36 puzzles/);assert.equal(els["results-next"].hidden,false);
 els["results-next"].click();assert.deepEqual(routes,["level1"]);
 view.show({...result,number:2},null,"level2","level3",{completed:36,total:36,stars:102,maximum:108,next:{number:1,route:"level1"}});
 assert.equal(els["results-heading"].textContent,"Adventure complete!");assert.equal(els["results-next"].hidden,true);assert.match(els["results-campaign-progress"].textContent,/102 \/ 108 stars.*improve/);
 view.show(last,null,"level36",null,{completed:36,total:36,stars:108,maximum:108,next:{number:1,route:"level1"}});assert.match(els["results-campaign-progress"].textContent,/Every star earned/);
});
