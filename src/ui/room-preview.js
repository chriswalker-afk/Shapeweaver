import { GATEHOUSE_PREVIEW, validateRoom } from "../levels/gatehouse-preview.js";
import { createCamera, panCamera, zoomCamera, MAX_ZOOM, ZOOM_STEP } from "../rendering/camera.js";
import { loadWorldArt, renderWorld } from "../rendering/world-art.js";
import { mountViewport } from "../rendering/viewport.js";
import { drawCoordinateOverlay } from "../rendering/coordinate-grid.js";
import { SNAP_STEPS,pickCoordinate,parseCoordinate,formatCoordinate,clientToScreen } from "../geometry/coordinates.js";

/** Renderer and coordinate inspection only; movement and spells follow in later PRs. */
export function mountRoomPreview(document,view) {
  const canvas=document.getElementById("room-canvas"),host=document.getElementById("room-stage");
  const status=document.getElementById("room-status");
  if(!canvas||!host||!status)return null;
  const room=validateRoom(GATEHOUSE_PREVIEW);
  const $=id=>document.getElementById(id);
  const controls=Object.fromEntries(["overview","inspect","left","right","up","down","zoom-in","zoom-out"].map(id=>[id,$("camera-"+id)]));
  const gridButton=$("grid-toggle"),axesButton=$("axes-toggle"),pickButton=$("pick-toggle"),panel=$("coordinate-panel");
  const snapInput=$("coordinate-snap"),xInput=$("coordinate-x"),yInput=$("coordinate-y"),form=$("coordinate-form"),message=$("coordinate-result");
  let camera=null,mode="overview",focus=null,zoom=null,viewport=null,plan=null;
  let grid=true,axes=true,picking=false,snap=1,point=null;
  const images=loadWorldArt(view,()=>viewport?.resize());
  function updateControls(){
    controls.overview?.setAttribute("aria-pressed",String(mode==="overview"));
    controls.inspect?.setAttribute("aria-pressed",String(mode==="inspect"));
    gridButton?.setAttribute("aria-pressed",String(grid));
    axesButton?.setAttribute("aria-pressed",String(axes));
    pickButton?.setAttribute("aria-pressed",String(picking));
    if(gridButton)gridButton.textContent=grid?"Grid: on":"Grid: off";
    if(axesButton)axesButton.textContent=axes?"Axes: on":"Axes: off";
    if(pickButton)pickButton.textContent=picking?"Picking point":"Pick point";
    if(panel)panel.hidden=!picking;
    if(canvas.style)canvas.style.cursor=picking?"crosshair":"default";
    if(!camera)return;
    const b=room.bounds,e=.0001;
    for(const [id,allowed] of Object.entries({left:camera.left>b.minX+e,right:camera.right<b.maxX-e,up:camera.top<b.maxY-e,down:camera.bottom>b.minY+e})){
      if(controls[id])controls[id].disabled=mode!=="inspect"||!allowed;
    }
    if(controls["zoom-in"])controls["zoom-in"].disabled=camera.zoom>=MAX_ZOOM-e;
    if(controls["zoom-out"])controls["zoom-out"].disabled=camera.zoom<=1+e;
    const gridStatus=grid&&plan?" · Grid "+plan.minorStep+(plan.minorStep===1?" unit":" units"):"";
    const zoomLabel=Number(camera.zoom.toFixed(2));
    status.textContent=(mode==="overview"?"Full room":"Inspect · "+zoomLabel+"× fit")+gridStatus+" · Static preview";
  }
  viewport=mountViewport(canvas,host,view,(ctx,metrics)=>{
    camera=createCamera(room.bounds,metrics.width,metrics.height,mode,focus,zoom);
    mode=camera.mode;zoom=camera.zoom;focus={x:camera.cx,y:camera.cy};
    renderWorld(ctx,metrics,camera,room,images.art);
    plan=drawCoordinateOverlay(ctx,camera,room.bounds,{grid,axes,picking,point});updateControls();
  });
  if(!viewport)status.textContent="Canvas 2D is unavailable in this browser.";
  const listeners=[];
  function on(element,event,fn){if(!element)return;element.addEventListener(event,fn);listeners.push([element,event,fn]);}
  function redraw(){viewport?.resize();if(!camera)updateControls();}
  function setMode(next){
    if(next!=="overview"&&next!=="inspect")return false;
    mode=next;zoom=null;focus=next==="overview"?null:{x:camera?.cx??16,y:camera?.cy??7};
    redraw();return true;
  }
  function useCamera(next){mode=next.mode;zoom=next.zoom;focus={x:next.cx,y:next.cy};redraw();}
  function pan(dx,dy){if(!camera||mode!=="inspect")return false;useCamera(panCamera(camera,room.bounds,dx,dy));return true;}
  function changeZoom(multiplier){if(!camera)return false;useCamera(zoomCamera(camera,room.bounds,multiplier));return true;}
  function setOverlay(key,value){
    if(key==="grid")grid=Boolean(value);else if(key==="axes")axes=Boolean(value);else return false;
    redraw();return true;
  }
  function setPicking(value){
    picking=Boolean(value);redraw();
    if(message)message.textContent=point?formatCoordinate(point):"Click or tap the room, or enter coordinates.";
    return picking;
  }
  function setSnap(value){if(!SNAP_STEPS.includes(value))return false;snap=value;return true;}
  function report(text){if(message)message.textContent=text;}
  function setPoint(next){
    if(!next)return false;point={x:next.x,y:next.y};
    if(xInput)xInput.value=String(point.x);if(yInput)yInput.value=String(point.y);
    report(formatCoordinate(point));redraw();return true;
  }
  function pickAt(screenPoint){
    if(!camera||!picking)return false;
    const picked=pickCoordinate(camera,room.bounds,screenPoint,snap);
    if(!picked){report("Choose a point inside the room.");return false;}
    return setPoint(picked);
  }
  function enterPoint(x,y){
    const parsed=parseCoordinate(x,y,room.bounds);
    if(!parsed){const b=room.bounds;report("Enter coordinates inside the room: "+b.minX+" ≤ x ≤ "+b.maxX+", "+b.minY+" ≤ y ≤ "+b.maxY+".");return false;}
    return setPoint(parsed);
  }
  function clearPoint(){point=null;if(xInput)xInput.value="";if(yInput)yInput.value="";report("No point selected");redraw();}
  on(controls.overview,"click",()=>setMode("overview"));on(controls.inspect,"click",()=>setMode("inspect"));
  on(controls.left,"click",()=>pan(-3,0));on(controls.right,"click",()=>pan(3,0));on(controls.up,"click",()=>pan(0,2));on(controls.down,"click",()=>pan(0,-2));
  on(controls["zoom-in"],"click",()=>changeZoom(ZOOM_STEP));on(controls["zoom-out"],"click",()=>changeZoom(1/ZOOM_STEP));
  on(gridButton,"click",()=>setOverlay("grid",!grid));on(axesButton,"click",()=>setOverlay("axes",!axes));
  on(pickButton,"click",()=>setPicking(!picking));
  on(snapInput,"change",()=>setSnap(Number(snapInput.value)));
  on(form,"submit",event=>{event.preventDefault();enterPoint(xInput?.value,yInput?.value);});
  on($("coordinate-clear"),"click",clearPoint);
  on(canvas,"click",event=>{
    if(!camera||!picking)return;
    const p=clientToScreen(canvas.getBoundingClientRect(),event.clientX,event.clientY,camera);
    if(p)pickAt(p);
  });
  updateControls();
  return {room,setMode,pan,changeZoom,setOverlay,setPicking,setSnap,pickAt,enterPoint,clearPoint,
    getCamera:()=>camera,getCoordinateState:()=>({grid,axes,picking,snap,point:point?{...point}:null}),
    refresh:()=>viewport?.resize(),
    destroy(){viewport?.destroy();images.destroy();for(const [el,event,fn] of listeners)el.removeEventListener(event,fn);}};
}
