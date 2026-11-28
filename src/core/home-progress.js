import {LEVELS,campaignProgress} from "../levels/campaign.js";
export const RESUME_KEY="shapeweaver.resume-level.v1";
const find=route=>LEVELS.find(l=>l.route===route)??null;
/** Persist only a known level route, never untrusted geometry or physics state. */
export function createResumeLevel(view){
 let storage=null,route=null;
 try{storage=view?.localStorage??null;const saved=JSON.parse(storage?.getItem(RESUME_KEY)??"null");if(saved?.version===1&&find(saved.route))route=saved.route;}catch{}
 function set(value){
  route=find(value)?.route??null;
  try{storage?.setItem(RESUME_KEY,JSON.stringify({version:1,route}));}catch{}
 }
 return {get route(){return route;},set,clear(){set(null);}};
}
export function homeContinuation(best,pausedRoute=null,savedRoute=null){
 const progress=campaignProgress(best),paused=find(pausedRoute),saved=find(savedRoute);
 if(paused)return {route:paused.route,level:paused,kind:"resume",detail:"Resume Level "+paused.number+" · "+paused.title,note:"Your current attempt is paused.",progress};
 if(progress.completed===progress.total)return {route:"campaign",level:null,kind:"complete",detail:"Adventure complete",note:progress.stars===progress.maximum?"All 108 stars earned. Replay any puzzle.":"Return to the library and improve your stars.",progress};
 if(saved&&!best.get(saved.id))return {route:saved.route,level:saved,kind:"reopen",detail:"Return to Level "+saved.number+" · "+saved.title,note:"Restart this puzzle at its entrance.",progress};
 const next=progress.next;
 return {route:next.route,level:next,kind:progress.completed?"next":"begin",detail:(progress.completed?"Next · Level ":"Begin · Level ")+next.number+" · "+next.title,note:"",progress};
}
