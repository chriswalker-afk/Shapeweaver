const KEY=Object.freeze({ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down",Space:"jump",KeyZ:"jump"});
const ACTIONS=new Set(Object.values(KEY));
/** Separate keyboard/pointer sources prevent one release cancelling another held control. */
export function mountMovementInput(document,view,enabled,onChange=()=>{}){
  const held=new Map(),listeners=[];
  let jump=false;
  function on(el,event,fn){if(!el?.addEventListener)return;el.addEventListener(event,fn);listeners.push([el,event,fn]);}
  const pressed=action=>Array.from(held.values()).includes(action);
  function press(source,action){
    if(!enabled()||!ACTIONS.has(action))return false;
    if(action==="jump"&&!pressed("jump"))jump=true;
    held.set(source,action);onChange();return true;
  }
  function release(source){if(held.delete(source))onChange();}
  function clear(){held.clear();jump=false;onChange();}
  function editable(target,code){return Boolean(target?.closest?.("input, select, textarea, [contenteditable]")||(code==="Space"&&target?.closest?.("button, a")));}
  on(view,"keydown",event=>{
    const action=KEY[event.code];
    if(!action||!enabled()||editable(event.target,event.code)||event.altKey||event.ctrlKey||event.metaKey)return;
    event.preventDefault();
    if(!event.repeat)press("key:"+event.code,action);
  });
  on(view,"keyup",event=>{if(KEY[event.code])release("key:"+event.code);});
  on(view,"blur",clear);
  on(document,"visibilitychange",()=>{if(document.hidden)clear();});
  const buttons=Array.from(document.querySelectorAll?.("[data-move]")??[]);
  for(const button of buttons){
    const action=button.dataset.move;
    on(button,"pointerdown",event=>{
      if(event.button!==undefined&&event.button!==0)return;
      if(!enabled())return;
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      press("pointer:"+event.pointerId,action);
    });
    for(const event of ["pointerup","pointercancel","lostpointercapture"])on(button,event,e=>release("pointer:"+e.pointerId));
    // Keyboard activation of a focused touch button remains useful.
    on(button,"keydown",e=>{if((e.code==="Space"||e.code==="Enter")&&enabled()){e.preventDefault();if(!e.repeat)press("button:"+action,action);}});
    on(button,"keyup",e=>{if(e.code==="Space"||e.code==="Enter"){e.preventDefault();release("button:"+action);}});
    on(button,"blur",()=>release("button:"+action));
  }
  function sample(){
    const result={move:Number(pressed("right"))-Number(pressed("left")),climb:Number(pressed("up"))-Number(pressed("down")),jump};jump=false;return result;
  }
  return {sample,clear,pressed,destroy(){clear();for(const [el,event,fn] of listeners)el.removeEventListener?.(event,fn);}};
}
