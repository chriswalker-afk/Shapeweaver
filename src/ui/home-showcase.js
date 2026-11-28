import {transformPoint} from "../transformations/preview-math.js";
import {SPELL_COLOURS,castProgress} from "../rendering/cast-effects.js";
import {getSpell} from "./identity.js";

// Decorative Cartesian y-up examples, independent of the playable rooms.
const shape=(x,y)=>[[x,y],[x+2,y],[x+2,y+1],[x+1,y+2],[x,y+2]];
export const SHOWCASE_SLOT=6000;
export const SHOWCASE_EXAMPLES=Object.freeze([
 {id:"translate",source:shape(1,2),request:{type:"translate",dx:5,dy:1},caption:"5 right · 1 up"},
 {id:"rotate",source:shape(6,2),request:{type:"rotate",angle:90,direction:"anticlockwise",centre:[5,2]},caption:"90° anticlockwise"},
 {id:"reflect",source:shape(1,2),request:{type:"reflect",line:{kind:"x",value:5,equation:"x = 5"}},caption:"Mirror line x = 5"},
 {id:"enlarge",source:shape(3,2),request:{type:"enlarge",factor:2,centre:[2,1]},caption:"Scale factor 2"}
].map(e=>Object.freeze({...e,source:Object.freeze(e.source.map(p=>Object.freeze(p))),
 request:Object.freeze({...e.request,...(e.request.centre?{centre:Object.freeze(e.request.centre)}:{}),
 ...(e.request.line?{line:Object.freeze(e.request.line)}:{})})})));
export const SHOWCASE_DURATION=SHOWCASE_SLOT*SHOWCASE_EXAMPLES.length;
const clamp=n=>Math.min(1,Math.max(0,n));
const round=n=>Number(n.toFixed(3));
const screen=([x,y])=>[round(38+22*x),round(181-22*y)];
const point=p=>screen(p).join(" ");
const polygon=vertices=>vertices.map(p=>screen(p).join(",")).join(" ");
const line=(a,b)=>"M"+point(a)+"L"+point(b);

// Rigid translations and rotations, uniform enlargements; reflection transfers
// between two congruent polygons rather than squeezing a polygon horizontally.
export function movingVertices(example,t){
 t=clamp(t);
 const {source,request:r}=example;
 if(t===0)return source.map(p=>[...p]);
 if(t===1)return source.map(p=>transformPoint(p,r));
 if(r.type==="reflect")return source.map(p=>[...p]);
 if(r.type==="translate")return source.map(([x,y])=>[x+t*r.dx,y+t*r.dy]);
 const [cx,cy]=r.centre;
 if(r.type==="enlarge"){
  const k=1+t*(r.factor-1);
  return source.map(([x,y])=>[cx+k*(x-cx),cy+k*(y-cy)]);
 }
 const angle=t*r.angle*Math.PI/180*(r.direction==="clockwise"?-1:1),c=Math.cos(angle),s=Math.sin(angle);
 return source.map(([x,y])=>[cx+c*(x-cx)-s*(y-cy),cy+s*(x-cx)+c*(y-cy)]);
}
export function sampleShowcase(ms){
 const cycle=((Number.isFinite(ms)?ms:0)%SHOWCASE_DURATION+SHOWCASE_DURATION)%SHOWCASE_DURATION;
 const example=SHOWCASE_EXAMPLES[Math.floor(cycle/SHOWCASE_SLOT)],local=cycle%SHOWCASE_SLOT;
 const progress=castProgress(clamp((local-800)/1800));
 const target=example.source.map(p=>transformPoint(p,example.request));
 const reflecting=example.id==="reflect";
 return {example,target,progress,moving:reflecting?example.source:movingVertices(example,progress),
  movingAlpha:reflecting?1-progress:1,arrivalAlpha:reflecting?progress:0,
  opacity:Math.min(1,local/400,(SHOWCASE_SLOT-local)/500)};
}
function guides({example,target}){
 const r=example.request;
 if(r.type==="translate")return {guide:"",arrow:line([2,4],[7,5])};
 if(r.type==="rotate"){
  const c=r.centre,a=example.source[1],b=target[1],radius=22*Math.hypot(a[0]-c[0],a[1]-c[1]);
  return {guide:line(c,a)+line(c,b),arrow:"M"+point(a)+"A"+radius+" "+radius+" 0 0 0 "+point(b),centre:c};
 }
 if(r.type==="reflect")return {guide:line([r.line.value,.5],[r.line.value,6.8])+line(example.source[0],target[0])+line(example.source[3],target[3]),arrow:""};
 return {guide:line(r.centre,target[0])+line(r.centre,target[2])+line(r.centre,target[4]),arrow:"",centre:r.centre};
}

/** Optional SVG animation. No game state, audio, layout reads or network. */
export function mountHomeShowcase(document,view){
 const $=id=>document.getElementById(id),art=$("title-art"),svg=$("home-showcase"),toggle=$("home-motion-toggle");
 const stage=$("showcase-stage"),source=$("showcase-source"),target=$("showcase-target"),moving=$("showcase-moving"),arrival=$("showcase-arrival"),
  guide=$("showcase-guide"),arrow=$("showcase-arrow"),centre=$("showcase-centre"),name=$("showcase-name"),caption=$("showcase-caption");
 if(![art,svg,toggle,stage,source,target,moving,arrival,guide,arrow,centre,name,caption].every(el=>typeof el?.setAttribute==="function")||typeof toggle.addEventListener!=="function")return null;
 const system=view.matchMedia?.("(prefers-reduced-motion: reduce)"),compact=view.matchMedia?.("(max-width: 820px) and (max-height: 720px) and (orientation: portrait), (max-width: 680px) and (orientation: landscape)");
 const canAnimate=typeof view.requestAnimationFrame==="function"&&typeof view.cancelAnimationFrame==="function";
 let active=false,paused=false,frame=null,last=null,lastDraw=-Infinity,elapsed=500,running=false,destroyed=false,currentId=null;
 // Avoid redundant DOM mutations during the long settled hold in each scene.
 const written=new WeakMap();
 function write(el,key,value){
  value=String(value);let cache=written.get(el);
  if(!cache){cache=new Map();written.set(el,cache);}
  if(cache.get(key)!==value){el.setAttribute(key,value);cache.set(key,value);}
 }
 function render(ms){
  const state=sampleShowcase(ms),{example,target:points,progress}=state;
  if(currentId!==example.id){
   currentId=example.id;const g=guides(state);
   stage.setAttribute("color",SPELL_COLOURS[example.id]);
   source.setAttribute("points",polygon(example.source));target.setAttribute("points",polygon(points));
   arrival.setAttribute("points",polygon(points));
   guide.setAttribute("d",g.guide);arrow.setAttribute("d",g.arrow);
   arrow.setAttribute("opacity",g.arrow?"1":"0");centre.setAttribute("opacity",g.centre?"1":"0");
   if(g.centre){const [x,y]=screen(g.centre);centre.setAttribute("cx",x);centre.setAttribute("cy",y);}
   name.textContent=getSpell(example.id).label;caption.textContent=example.caption;
   svg.setAttribute("data-showcase-spell",example.id);
  }
  write(moving,"points",polygon(state.moving));write(moving,"opacity",round(state.movingAlpha));
  write(arrival,"opacity",round(state.arrivalAlpha));write(stage,"opacity",round(paused?1:state.opacity));
  write(svg,"data-showcase-progress",round(progress));
 }
 const reduced=()=>Boolean(system?.matches||document.documentElement?.getAttribute?.("data-motion")==="reduced");
 function stop(){running=false;if(frame!==null)view.cancelAnimationFrame?.(frame);frame=null;last=null;lastDraw=-Infinity;}
 function tick(now){
  frame=null;if(!running||destroyed)return;
  if(last!==null)elapsed=(elapsed+Math.min(100,Math.max(0,now-last)))%SHOWCASE_DURATION;
  last=now;
  if(now-lastDraw>=1000/30){render(elapsed);lastDraw=now;}
  if(running)frame=view.requestAnimationFrame(tick);
 }
 function sync(){
  if(destroyed)return;
  const stationary=reduced()||!canAnimate,visible=active&&!compact?.matches;
  const hideControl=!visible||stationary;
  if(hideControl&&active&&document.activeElement===toggle)$("open-continue")?.focus?.({preventScroll:true});
  toggle.hidden=hideControl;toggle.textContent=paused?"Play magic":"Pause magic";
  const shouldRun=visible&&!stationary&&!paused&&!document.hidden;
  art.setAttribute("data-home-motion",!visible?"inactive":stationary?"static":shouldRun?"running":"paused");
  if(!shouldRun){
   stop();
   if(visible&&stationary)render(3600);else if(visible)render(elapsed);
   return;
  }
  if(!running){running=true;last=null;lastDraw=-Infinity;render(elapsed);frame=view.requestAnimationFrame(tick);}
 }
 const click=()=>{paused=!paused;sync();};
 toggle.addEventListener("click",click);document.addEventListener?.("visibilitychange",sync);
 for(const mq of [system,compact]){if(mq?.addEventListener)mq.addEventListener("change",sync);else mq?.addListener?.(sync);}
 render(3600);
 return {setActive(value){active=Boolean(value);sync();},destroy(){
  if(destroyed)return;destroyed=true;stop();toggle.hidden=true;art.setAttribute("data-home-motion","inactive");
  toggle.removeEventListener("click",click);document.removeEventListener?.("visibilitychange",sync);
  for(const mq of [system,compact]){if(mq?.removeEventListener)mq.removeEventListener("change",sync);else mq?.removeListener?.(sync);}
 }};
}
