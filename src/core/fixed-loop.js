import {FIXED_DT} from "../physics/platformer.js";
/** Fixed updates, bounded catch-up, no large time step after a hidden tab. */
export function createFixedLoop(view,update,draw){
  let frame=null,last=null,accumulator=0,running=false;
  function tick(now){
    if(!running)return;
    if(last!==null)accumulator+=Math.min(.1,Math.max(0,(now-last)/1000));
    last=now;
    let steps=0;
    while(accumulator+1e-10>=FIXED_DT&&steps<12){
      update();accumulator=Math.max(0,accumulator-FIXED_DT);steps++;
      if(!running)return;
    }
    draw();
    if(running)frame=view.requestAnimationFrame(tick);
  }
  return {
    start(){if(running||typeof view.requestAnimationFrame!=="function")return;running=true;last=null;accumulator=0;frame=view.requestAnimationFrame(tick);},
    stop(){running=false;if(frame!==null)view.cancelAnimationFrame?.(frame);frame=null;last=null;accumulator=0;},
    get running(){return running;}
  };
}
