import {getSpell} from "./identity.js";
export function mountResults(document,onNavigate){
  const $=id=>document.getElementById(id),root=$("results-view");
  if(!root)return null;
  const heading=$("results-heading"),level=$("results-level"),stars=$("results-stars"),message=$("results-message"),
    stats=$("results-stats"),thresholds=$("results-thresholds"),best=$("results-best"),list=$("results-history"),
    replay=$("results-replay"),next=$("results-next"),title=$("results-title");
  if(![heading,level,stars,message,stats,thresholds,best,list,replay,next,title].every(Boolean))return null;
  let current=null,route=null,nextRoute=null;
  const listeners=[];
  function on(el,fn){el.addEventListener("click",fn);listeners.push([el,fn]);}
  function el(tag,content,className){const node=document.createElement(tag);if(content!==undefined)node.textContent=content;if(className)node.className=className;return node;}
  const starText=n=>"★".repeat(n)+"☆".repeat(3-n);
  const moveText=n=>n+" move"+(n===1?"":"s");
  function stat(label,value){const item=el("div",undefined,"result-stat");item.append(el("dt",label),el("dd",String(value)));return item;}
  function historyRow(entry){
    const item=el("li",undefined,"result-history-item"+(entry.undone?" result-undone":""));
    const symbol=el("img");symbol.src=getSpell(entry.type)?.icon??"";symbol.alt="";symbol.width=30;symbol.height=30;
    const details=el("div",undefined,"result-history-detail");
    details.append(el("strong",entry.objectLabel+" · "+entry.name));
    const math=el("div",undefined,"result-math");
    if(entry.vector){
      math.append(el("span","Column vector"));
      const v=el("span",undefined,"column-vector");v.setAttribute("role","img");v.setAttribute("aria-label",entry.text);
      for(const component of entry.vector){const part=el("span",component);part.setAttribute("aria-hidden","true");v.append(part);}
      math.append(v);
    }else math.append(el("span",entry.text));
    details.append(math);
    const state=el("span",entry.undone?"Undone · still counted":"Applied","result-cast-state");
    item.append(symbol,details,state);return item;
  }
  function show(result,bestUpdate,currentRoute,followingRoute){
    current=result;route=currentRoute;nextRoute=followingRoute;
    heading.textContent="Level complete!";
    level.textContent="Level "+result.number+" · "+result.title;
    stars.replaceChildren(...Array.from({length:3},(_,i)=>{
      const s=el("span",i<result.stars?"★":"☆",i<result.stars?"earned-star":"empty-star");s.setAttribute("aria-hidden","true");return s;
    }));
    stars.setAttribute("aria-label",result.stars+" out of 3 stars");
    message.textContent=result.stars===3?"Efficient solution achieved!":result.stars===2?"Well done! Can you find a shorter solution?":"You solved the puzzle! Replay whenever you want to refine your route.";
    stats.replaceChildren(stat("Moves used",result.moves),stat("Target moves",result.thresholds.threeStar),stat("Undos",result.undos),stat("Returns",result.returns));
    thresholds.textContent="3 stars: "+result.thresholds.threeStar+" or fewer · 2 stars: up to "+result.thresholds.twoStar+" · 1 star: any completed solution. No time, hint or fall penalty.";
    best.textContent=bestUpdate?(bestUpdate.improved?"Personal best! ":"Personal best: ")+starText(bestUpdate.best.stars)+" · "+moveText(bestUpdate.best.moves)+(bestUpdate.persisted?" · Saved on this browser":" · This session only"):"";
    list.replaceChildren(...result.entries.map(historyRow));
    const empty=$("results-empty");if(empty)empty.hidden=result.entries.length!==0;
    next.hidden=!followingRoute;next.disabled=!followingRoute;
    next.textContent=followingRoute?"Next level →":"";
    replay.disabled=!route;
  }
  on(replay,()=>{if(current&&route)onNavigate(route);});
  on(next,()=>{if(current&&nextRoute)onNavigate(nextRoute);});
  on(title,()=>onNavigate("title"));
  return {show,getResult:()=>current,clear(){current=null;route=null;nextRoute=null;},destroy(){for(const [el,fn] of listeners)el.removeEventListener("click",fn);}};
}
