import {CHAPTERS,LEVELS,filterLevels,campaignProgress} from "../levels/campaign.js";
import {getSpell} from "./identity.js";
export function mountCampaign(document,best,navigate){
 const $=id=>document.getElementById(id),root=$("campaign-view");if(!root)return null;
 const map=$("campaign-map"),list=$("campaign-levels"),progress=$("campaign-progress"),resume=$("campaign-resume"),filters=["spell","math","puzzle","chapter"].map(k=>[k,$("filter-"+k)]);
 if(!map||!list||!progress||!resume||filters.some(([,e])=>!e))return null;
 let next=null;const listeners=[];
 function on(e,type,fn){e.addEventListener(type,fn);listeners.push([e,type,fn]);}
 function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function render(){
  const p=campaignProgress(best);next=p.next;
  progress.textContent=p.completed+" / "+p.total+" released puzzles complete · "+p.stars+" / "+p.maximum+" stars"+(best.persisted?" · Saved on this browser":" · Session only");
  resume.textContent=p.completed===p.total?"Replay the adventure":"Continue · Level "+next.number;
  map.replaceChildren(...CHAPTERS.map(c=>{
   const available=LEVELS.filter(l=>l.chapter===c.id),done=available.filter(l=>best.get(l.id)).length;
   const b=node("button",undefined,"chapter-card");b.type="button";b.disabled=!available.length;
   b.append(node("small","Chapter "+c.id),node("strong",c.title),node("span",available.length?done+" / "+available.length+" completed · "+(available.length===c.last-c.first+1?"Full chapter available":available.length+" of "+(c.last-c.first+1)+" planned available"):"Planned · Levels "+c.first+"–"+c.last));
   if(available.length)b.addEventListener("click",()=>{for(const [,e] of filters)e.value="";$("filter-chapter").value=String(c.id);render();});
   return b;
  }));
  const levels=filterLevels(Object.fromEntries(filters.map(([k,e])=>[k,e.value])));
  list.replaceChildren(...levels.map(l=>{
   const score=best.get(l.id),b=node("button",undefined,"library-level");b.type="button";
   b.append(node("span",String(l.number),"level-number"),node("strong",l.title),node("span",l.spells.map(s=>getSpell(s).label).join(" + ")),node("small","Math "+l.math+"/5 · Puzzle "+l.puzzle+"/5"),node("span",score?"★".repeat(score.stars)+"☆".repeat(3-score.stars)+" · "+score.moves+" moves":"Not completed","library-score"));
   b.addEventListener("click",()=>navigate(l.route));return b;
  }));
  if(!levels.length)list.append(node("p","No released puzzles match these filters."));
 }
 for(const [,e] of filters)on(e,"change",render);
 on(resume,"click",()=>{if(next)navigate(next.route);});
 const clear=$("campaign-clear");if(clear)on(clear,"click",()=>{for(const [,e] of filters)e.value="";render();});
 return {render,destroy(){for(const [e,t,fn] of listeners)e.removeEventListener(t,fn);}};
}
