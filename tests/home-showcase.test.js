import test from "node:test";
import assert from "node:assert/strict";
import {SHOWCASE_SLOT,SHOWCASE_DURATION,SHOWCASE_EXAMPLES,sampleShowcase,movingVertices,mountHomeShowcase} from "../src/ui/home-showcase.js";
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+" != "+b);
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test("four six-second examples have independently checked exact endpoints",()=>{
 assert.deepEqual(SHOWCASE_EXAMPLES.map(e=>e.id),["translate","rotate","reflect","enlarge"]);
 const endpoints=[
  [[6,3],[8,3],[8,4],[7,5],[6,5]],
  [[5,3],[5,5],[4,5],[3,4],[3,3]],
  [[9,2],[7,2],[7,3],[8,4],[9,4]],
  [[4,3],[8,3],[8,5],[6,7],[4,7]]
 ];
 for(const [i,e] of SHOWCASE_EXAMPLES.entries()){
  const start=sampleShowcase(i*SHOWCASE_SLOT+500),end=sampleShowcase(i*SHOWCASE_SLOT+3600);
  assert.equal(start.example,e);assert.equal(start.progress,0);assert.equal(end.progress,1);
  assert.deepEqual(end.target,endpoints[i]);assert.deepEqual(movingVertices(e,1),endpoints[i]);
  assert.deepEqual(start.moving,e.source);
  if(e.id==="reflect"){assert.deepEqual(end.moving,e.source);assert.equal(end.arrivalAlpha,1);assert.equal(end.movingAlpha,0);}
  else assert.deepEqual(end.moving,endpoints[i]);
 }
 assert.deepEqual(sampleShowcase(SHOWCASE_DURATION+500),sampleShowcase(500));
 assert.equal(sampleShowcase(0).opacity,0);assert.equal(sampleShowcase(SHOWCASE_SLOT-1).opacity,.002);
});
test("intermediate transforms preserve distances and reference points",()=>{
 for(const e of SHOWCASE_EXAMPLES){
  const p=movingVertices(e,.5),s=e.source;
  for(let i=0;i<s.length;i++)for(let j=i+1;j<s.length;j++)close(dist(p[i],p[j]),dist(s[i],s[j])*(e.id==="enlarge"?1.5:1));
  if(e.id==="translate")for(let i=0;i<s.length;i++){close(p[i][0]-s[i][0],2.5);close(p[i][1]-s[i][1],.5);}
  if(e.id==="rotate")for(let i=0;i<s.length;i++)close(dist(p[i],e.request.centre),dist(s[i],e.request.centre));
  if(e.id==="enlarge")for(let i=0;i<s.length;i++)for(let d=0;d<2;d++)close(p[i][d]-e.request.centre[d],1.5*(s[i][d]-e.request.centre[d]));
 }
 const reflection=sampleShowcase(2*SHOWCASE_SLOT+1700);
 close(reflection.movingAlpha+reflection.arrivalAlpha,1);
 for(let i=0;i<reflection.target.length;i++){
  close(reflection.target[i][0]+reflection.example.source[i][0],10);
  close(reflection.target[i][1],reflection.example.source[i][1]);
 }
});
function fixture({reduced=false,stored=false,compact=false}={}){
 const eventTarget=()=>{const listeners=new Map();return {listeners,addEventListener(k,fn){listeners.set(k,fn);},removeEventListener(k,fn){if(listeners.get(k)===fn)listeners.delete(k);},fire(k){listeners.get(k)?.();}};};
 const element=()=>{const a={};return {...eventTarget(),attributes:a,hidden:false,setAttribute(k,v){a[k]=String(v);},getAttribute(k){return a[k]??null;}};};
 const ids="title-art home-showcase home-motion-toggle showcase-stage showcase-source showcase-target showcase-moving showcase-arrival showcase-guide showcase-arrow showcase-centre showcase-name showcase-caption".split(" ");
 const els=Object.fromEntries(ids.map(id=>[id,element()])),root=element();
 root.setAttribute("data-motion",stored?"reduced":"system");
 const system={...eventTarget(),matches:reduced},small={...eventTarget(),matches:compact};
 const document={...eventTarget(),getElementById:id=>els[id],documentElement:root,hidden:false};
 let time=0,id=0;const callbacks=new Map();
 const view={matchMedia:q=>q.includes("prefers-reduced")?system:small,requestAnimationFrame:fn=>{callbacks.set(++id,fn);return id;},cancelAnimationFrame:key=>callbacks.delete(key)};
 const advance=(ms)=>{for(let n=0;n<ms;n+=50){time+=50;for(const [k,fn] of [...callbacks]){callbacks.delete(k);fn(time);}}};
 const controller=mountHomeShowcase(document,view);
 const motion=()=>els["title-art"].getAttribute("data-home-motion"),points=()=>els["showcase-moving"].getAttribute("points");
 return {els,root,system,small,document,callbacks,advance,controller,motion,points};
}
test("home animation stops on navigation, hidden tabs, manual pause and compact view",()=>{
 const f=fixture(),{controller:c,callbacks,els,advance,motion,points,document,small}=f;
 assert.equal(callbacks.size,0);c.setActive(true);assert.equal(motion(),"running");assert.equal(callbacks.size,1);
 const initial=points();advance(1300);assert.notEqual(points(),initial);assert.equal(callbacks.size,1);
 els["home-motion-toggle"].fire("click");const frozen=points();
 assert.equal(motion(),"paused");assert.equal(callbacks.size,0);advance(4000);assert.equal(points(),frozen);
 c.setActive(false);assert.equal(motion(),"inactive");assert.equal(els["home-motion-toggle"].hidden,true);
 c.setActive(true);assert.equal(motion(),"paused");assert.equal(points(),frozen);
 els["home-motion-toggle"].fire("click");advance(500);assert.notEqual(points(),frozen);
 document.hidden=true;document.fire("visibilitychange");const hidden=points();assert.equal(callbacks.size,0);
 advance(20000);document.hidden=false;document.fire("visibilitychange");assert.equal(points(),hidden);
 advance(100);assert.equal(callbacks.size,1);
 small.matches=true;small.fire("change");assert.equal(motion(),"inactive");assert.equal(callbacks.size,0);
 small.matches=false;small.fire("change");assert.equal(motion(),"running");
 c.destroy();assert.equal(callbacks.size,0);assert.equal(document.listeners.size,0);assert.equal(f.system.listeners.size,0);assert.equal(small.listeners.size,0);assert.equal(els["home-motion-toggle"].listeners.size,0);
});
test("reduced motion is a stable complete diagram without animation frames",()=>{
 for(const options of [{reduced:true},{stored:true}]){
  const f=fixture(options);f.controller.setActive(true);
  assert.equal(f.motion(),"static");assert.equal(f.callbacks.size,0);assert.equal(f.els["home-motion-toggle"].hidden,true);
  assert.equal(f.els["home-showcase"].getAttribute("data-showcase-progress"),"1");
  assert.equal(f.points(),f.els["showcase-target"].getAttribute("points"));
  f.advance(6000);assert.equal(f.callbacks.size,0);f.controller.destroy();
 }
 const f=fixture();f.controller.setActive(true);f.advance(2000);
 f.system.matches=true;f.system.fire("change");assert.equal(f.motion(),"static");assert.equal(f.callbacks.size,0);
 f.system.matches=false;f.system.fire("change");assert.equal(f.motion(),"running");assert.equal(f.callbacks.size,1);
 f.controller.setActive(false);f.root.setAttribute("data-motion","reduced");f.controller.setActive(true);assert.equal(f.motion(),"static");assert.equal(f.callbacks.size,0);f.controller.destroy();
});
test("missing showcase markup is optional",()=>{
 assert.equal(mountHomeShowcase({getElementById:()=>null},{}),null);
});
