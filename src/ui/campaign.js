import {CHAPTERS,LEVELS,filterLevels,campaignProgress} from "../levels/campaign.js";
import {getSpell} from "./identity.js";

export const CHAPTER_ART=Object.freeze(["gatehouse","gardens","clockwork","riverworks","archives","alchemist","observatory"].map(name=>"chapters/"+name+".svg"));
const accents=["#d7b47c","#9dcca2","#e3b47d","#86c6d4","#c8a7e3","#d3ba8e","#b2bae9"];
const numeral=["I","II","III","IV","V","VI","VII"];
const chapterLevels=id=>LEVELS.filter(l=>l.chapter===id);

export function mountCampaign(document,best,navigate){
 const $=id=>document.getElementById(id),root=$("campaign-view");if(!root)return null;
 const ids="campaign-map campaign-levels campaign-progress campaign-resume campaign-clear filter-spell filter-math filter-puzzle filter-chapter library-atlas library-puzzles library-find library-find-secondary library-back library-heading library-chapter-banner library-chapter-art library-chapter-name library-chapter-progress library-search library-count library-detail library-detail-number library-detail-title library-detail-spells library-detail-ratings library-detail-score library-play library-empty library-completed library-stars library-progress-bar".split(" ");
 if(ids.some(id=>!$(id)))return null;
 const map=$("campaign-map"),list=$("campaign-levels"),filters=["spell","math","puzzle","chapter"].map(k=>[k,$("filter-"+k)]);
 let next=null,mode="atlas",chapter=null,selected=null,visibleLevels=[],tiles=new Map();const listeners=[];
 const on=(e,type,fn)=>{e.addEventListener(type,fn);listeners.push([e,type,fn]);};
 function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 const set=(id,value)=>{$(id).textContent=value;};
 const clearFilters=()=>{for(const [,e] of filters)e.value="";};
 function icon(path,cls){const img=node("img",undefined,cls);img.src=new URL("../../assets/"+path,import.meta.url).href;img.alt="";img.width=32;img.height=32;return img;}
 function rating(label,value){
  const row=node("div",undefined,"library-rating"),pips=node("span",undefined,"library-pips");
  pips.setAttribute("aria-hidden","true");
  for(let i=1;i<=5;i++)pips.append(node("i",undefined,i<=value?"filled":""));
  row.append(node("span",label),pips,node("strong",value+"/5"));return row;
 }
 function stars(score){
  const e=node("span",score?"★".repeat(score.stars)+"☆".repeat(3-score.stars):"○ ○ ○","library-tile-stars");
  e.setAttribute("aria-hidden","true");return e;
 }
 function renderProgress(){
  const p=campaignProgress(best);next=p.next;
  set("campaign-progress",p.completed+" / "+p.total+" released puzzles complete · "+p.stars+" / "+p.maximum+" stars"+(best.persisted?" · Saved on this browser":" · Session only"));
  set("library-completed",p.completed+" / "+p.total+" puzzles");set("library-stars","★ "+p.stars+" / "+p.maximum);
  $("library-progress-bar").max=p.total;$("library-progress-bar").value=p.completed;
  set("campaign-resume",p.completed===p.total?"Replay adventure":"Continue · "+next.number);
  const celebration=$("campaign-celebration");if(celebration){celebration.hidden=p.completed!==p.total;celebration.textContent=p.stars===p.maximum?"All 108 stars earned!":"Adventure complete — revisit any puzzle to improve your stars.";}
 }
 function renderAtlas(){
  map.replaceChildren(...CHAPTERS.map(c=>{
   const levels=chapterLevels(c.id),done=levels.filter(l=>best.get(l.id)).length;
   const b=node("button",undefined,"chapter-card");b.type="button";b.disabled=!levels.length;
   b.setAttribute("data-chapter",String(c.id));b.style.setProperty("--chapter-accent",accents[c.id-1]);
   b.setAttribute("aria-label",c.title+", "+done+" of "+levels.length+" completed");
   const frame=node("div",undefined,"chapter-art-frame"),art=icon(CHAPTER_ART[c.id-1],"chapter-art");
   art.width=320;art.height=160;frame.append(art,node("span",numeral[c.id-1],"chapter-index"));
   const body=node("div",undefined,"chapter-card-body"),bar=node("progress");bar.max=levels.length||1;bar.value=done;bar.setAttribute("aria-hidden","true");
   const progress=node("div",undefined,"chapter-progress");progress.append(bar,node("small",done+"/"+levels.length));
   body.append(node("strong",c.title),progress);b.append(frame,body);
   if(levels.length)b.addEventListener("click",()=>openChapter(c.id,null,true));return b;
  }));
 }
 function updateDetail(){
  const l=visibleLevels.find(x=>x.route===selected);
  $("library-detail").hidden=!l;$("library-empty").hidden=Boolean(visibleLevels.length);$("library-play").disabled=!l;
  for(const [route,tile] of tiles)tile.setAttribute("aria-pressed",String(route===selected));
  if(!l)return;
  const score=best.get(l.id),spells=l.spells.map(getSpell);
  set("library-detail-number","Puzzle "+String(l.number).padStart(2,"0")+" · "+CHAPTERS[l.chapter-1].title);
  set("library-detail-title",l.title);
  $("library-detail-spells").replaceChildren(...spells.map(s=>{const e=node("span",undefined,"library-spell");e.append(icon(s.icon.slice("assets/".length),"library-spell-icon"),node("span",s.label));return e;}));
  $("library-detail-ratings").replaceChildren(rating("Mathematics",l.math),rating("Puzzle",l.puzzle));
  $("library-detail-score").replaceChildren(stars(score),node("span",score?"Personal best · "+score.stars+"/3 stars · "+score.moves+" moves":"Not played yet"));
  set("library-play",score?"Replay puzzle ›":"Play puzzle ›");
 }
 function renderPuzzles(){
  const c=mode==="chapter"?CHAPTERS.find(x=>x.id===chapter):null;
  visibleLevels=c?chapterLevels(c.id):filterLevels(Object.fromEntries(filters.map(([k,e])=>[k,e.value])));
  if(!visibleLevels.some(l=>l.route===selected))selected=(visibleLevels.find(l=>!best.get(l.id))??visibleLevels[0])?.route??null;
  $("library-chapter-banner").hidden=!c;$("library-search").hidden=mode!=="search";
  $("library-find-secondary").hidden=mode==="search";
  if(c){
   const art=$("library-chapter-art");art.src=new URL("../../assets/"+CHAPTER_ART[c.id-1],import.meta.url).href;
   set("library-chapter-name",c.title);set("library-chapter-progress",visibleLevels.filter(l=>best.get(l.id)).length+" / "+visibleLevels.length+" complete");
   set("library-heading",c.title);
  }else set("library-heading","Find a puzzle");
  set("library-count",visibleLevels.length+" "+(visibleLevels.length===1?"puzzle":"puzzles"));
  list.setAttribute("data-mode",mode);tiles=new Map();
  list.replaceChildren(...visibleLevels.map(l=>{
   const score=best.get(l.id),b=node("button",undefined,"library-level");b.type="button";
   b.setAttribute("data-level",String(l.number));b.setAttribute("data-completed",String(Boolean(score)));
   b.setAttribute("aria-label","Puzzle "+l.number+": "+l.title+", "+(score?score.stars+" of 3 stars":"not completed"));
   b.setAttribute("aria-pressed",String(selected===l.route));
   const symbols=node("span",undefined,"library-tile-spells");symbols.setAttribute("aria-hidden","true");
   for(const s of l.spells.map(getSpell))symbols.append(icon(s.icon.slice("assets/".length),"library-tile-icon"));
   b.append(node("strong",String(l.number).padStart(2,"0"),"level-number"),symbols,stars(score));
   // Search mode alone includes titles to aid comparison; chapter tiles remain compact.
   if(mode==="search")b.append(node("span",l.title,"library-search-title"));
   b.addEventListener("click",()=>{selected=l.route;updateDetail();});tiles.set(l.route,b);return b;
  }));
  updateDetail();
 }
 function show(focus=false){
  root.setAttribute("data-library-mode",mode);
  $("library-atlas").hidden=mode!=="atlas";$("library-puzzles").hidden=mode==="atlas";
  renderProgress();
  if(mode==="atlas"){visibleLevels=[];tiles.clear();list.replaceChildren();$("library-detail").hidden=true;renderAtlas();}
  else renderPuzzles();
  if(focus)(mode==="atlas"?$("library-find"):$("library-heading")).focus?.({preventScroll:true});
 }
 function openChapter(id,route=null,focus=false){
  mode="chapter";chapter=id;selected=route;clearFilters();show(focus);
 }
 function openSearch(){mode="search";chapter=null;selected=null;clearFilters();show(true);}
 function render({route=null,reset=false}={}){
  if(route){const l=LEVELS.find(l=>l.route===route);if(l){openChapter(l.chapter,l.route);return;}}
  if(reset){mode="atlas";chapter=null;selected=null;clearFilters();}
  show();
 }
 for(const [,e] of filters)on(e,"change",()=>{if(mode==="search")renderPuzzles();});
 on($("campaign-resume"),"click",()=>{if(next)navigate(next.route);});
 on($("library-find"),"click",openSearch);on($("library-find-secondary"),"click",openSearch);
 on($("library-back"),"click",()=>{
  const previous=chapter;mode="atlas";chapter=null;selected=null;clearFilters();show();
  const card=previous?Array.from(map.children).find(b=>b.getAttribute("data-chapter")===String(previous)):null;
  (card??$("library-find")).focus?.({preventScroll:true});
 });
 on($("campaign-clear"),"click",()=>{clearFilters();if(mode==="search")renderPuzzles();});
 on($("library-play"),"click",()=>{if(visibleLevels.some(l=>l.route===selected))navigate(selected);});
 return {render,destroy(){for(const [e,t,fn] of listeners)e.removeEventListener(t,fn);}};
}
