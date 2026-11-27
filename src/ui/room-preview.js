import { GATEHOUSE_PREVIEW, validateRoom } from "../levels/gatehouse-preview.js";
import { createCamera, panCamera } from "../rendering/camera.js";
import { loadWorldArt, renderWorld } from "../rendering/world-art.js";
import { mountViewport } from "../rendering/viewport.js";

/** Inspection controls only; no player movement or transformation engine in PR03. */
export function mountRoomPreview(document,view) {
  const canvas=document.getElementById("room-canvas"),host=document.getElementById("room-stage");
  const status=document.getElementById("room-status");
  if(!canvas||!host||!status)return null;
  const room=validateRoom(GATEHOUSE_PREVIEW);
  const controls=Object.fromEntries(["overview","inspect","left","right","up","down"].map(id=>[id,document.getElementById("camera-"+id)]));
  let camera=null,mode="overview",focus=null,viewport=null;
  const images=loadWorldArt(view,()=>viewport?.resize());
  function updateControls(){
    controls.overview?.setAttribute("aria-pressed",String(mode==="overview"));
    controls.inspect?.setAttribute("aria-pressed",String(mode==="inspect"));
    if(!camera)return;
    const b=room.bounds,e=.0001;
    for(const [id,allowed] of Object.entries({left:camera.left>b.minX+e,right:camera.right<b.maxX-e,up:camera.top<b.maxY-e,down:camera.bottom>b.minY+e})){
      if(controls[id])controls[id].disabled=mode!=="inspect"||!allowed;
    }
    status.textContent=mode==="overview"?"Full room · Static renderer preview":"Inspecting room · Pan using the arrow buttons";
  }
  viewport=mountViewport(canvas,host,view,(ctx,metrics)=>{
    camera=createCamera(room.bounds,metrics.width,metrics.height,mode,focus);
    renderWorld(ctx,metrics,camera,room,images.art);updateControls();
  });
  if(!viewport)status.textContent="Canvas 2D is unavailable in this browser.";
  const listeners=[];
  function on(id,fn){const b=controls[id];if(!b)return;b.addEventListener("click",fn);listeners.push([b,fn]);}
  function setMode(next){
    if(next!=="overview"&&next!=="inspect")return false;
    mode=next;
    focus=next==="overview"?null:{x:camera?.cx??16,y:camera?.cy??7};
    viewport?.resize();return true;
  }
  function pan(dx,dy){
    if(!camera||mode!=="inspect")return false;
    const next=panCamera(camera,room.bounds,dx,dy);
    focus={x:next.cx,y:next.cy};viewport?.resize();return true;
  }
  on("overview",()=>setMode("overview"));on("inspect",()=>setMode("inspect"));
  on("left",()=>pan(-3,0));on("right",()=>pan(3,0));on("up",()=>pan(0,2));on("down",()=>pan(0,-2));
  return {room,setMode,pan,getCamera:()=>camera,refresh:()=>viewport?.resize(),
    destroy(){viewport?.destroy();images.destroy();for(const [b,fn] of listeners)b.removeEventListener("click",fn);}};
}
