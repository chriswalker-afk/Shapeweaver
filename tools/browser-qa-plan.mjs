import assert from "node:assert/strict";
export const CAMPAIGN_VIEWPORTS=Object.freeze([
 ["desktop",1366,768,false],["small-desktop",1024,600,false],
 ["landscape-phone",844,390,true],["portrait-phone",390,844,true]
].map(Object.freeze));
export const VIEWPORT_NAMES=Object.freeze(CAMPAIGN_VIEWPORTS.map(v=>v[0]));
export const LEVEL_COUNT=36;
export const REVIEW_LEVELS=Object.freeze([1,2,3,4,5,9,13,19,25,31,36]);

export function browserQaOptions(args=[]){
 let viewport=null,screenshots="all";const seen=new Set();
 for(let i=0;i<args.length;i+=2){
  const flag=args[i],value=args[i+1];
  if(seen.has(flag))throw Error("Repeated browser QA option: "+flag);
  seen.add(flag);
  if(flag==="--viewport"&&VIEWPORT_NAMES.includes(value))viewport=value;
  else if(flag==="--screenshots"&&["all","review"].includes(value))screenshots=value;
  else throw Error("Invalid browser QA option: "+flag+" "+(value??""));
 }
 return {viewport,screenshots,viewports:CAMPAIGN_VIEWPORTS.filter(v=>!viewport||v[0]===viewport)};
}
export function captureLevel(level,mode){
 assert.ok(Number.isInteger(level)&&level>=1&&level<=LEVEL_COUNT,"Invalid screenshot level");
 assert.ok(["all","review"].includes(mode),"Invalid screenshot mode");
 return mode==="all"||REVIEW_LEVELS.includes(level);
}
export function assertBrowserCoverage(rows,showcase,names=VIEWPORT_NAMES){
 assert.ok(Array.isArray(names)&&names.length>0&&new Set(names).size===names.length&&names.every(n=>VIEWPORT_NAMES.includes(n)),"Invalid expected viewport set");
 assert.ok(Array.isArray(rows)&&Array.isArray(showcase),"Missing coverage reports");
 assert.equal(rows.length,LEVEL_COUNT*names.length,"Wrong level/viewport coverage total");
 const expected=names.flatMap(n=>Array.from({length:LEVEL_COUNT},(_,i)=>n+":"+(i+1))).sort();
 const actual=rows.map(r=>{
  assert.ok(r&&names.includes(r.viewport)&&Number.isInteger(r.level),"Unexpected level or viewport");
  assert.ok(Number.isFinite(r.stageHeight)&&r.stageHeight>=138,"Missing or invalid stage measurement");
  return r.viewport+":"+r.level;
 }).sort();
 assert.deepEqual(actual,expected,"Missing, duplicate or unexpected level/viewport coverage");
 assert.deepEqual(showcase.map(r=>{
  assert.ok(r&&["static","animated","pause","navigation","unobstructed"].every(k=>r[k]===true),"Incomplete home showcase check");
  return r.viewport;
 }).sort(),[...names].sort(),"Missing or duplicate home showcase coverage");
}
