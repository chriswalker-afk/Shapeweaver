import { GATEHOUSE_PREVIEW, validateRoom } from "../levels/gatehouse-preview.js";
import { ACROSS_THE_BROOK, brookHint } from "../levels/across-the-brook.js";
import { STUBBORN_GATE, gateHint } from "../levels/stubborn-gate.js";
import { previewRotation, commitRotation, rotatedFrame } from "../transformations/rotation.js";
import { previewTranslation, commitTranslation, translatedFrame } from "../transformations/translation.js";
import { FIXED_DT } from "../physics/platformer.js";
import { createCamera, panCamera, zoomCamera, MAX_ZOOM, ZOOM_STEP } from "../rendering/camera.js";
import { loadWorldArt, renderWorld } from "../rendering/world-art.js";
import { mountViewport } from "../rendering/viewport.js";
import { drawCoordinateOverlay } from "../rendering/coordinate-grid.js";
import {createPhysicsWorld} from "../physics/collision.js";
import {createPlayer,stepPlayer} from "../physics/platformer.js";
import {createFixedLoop} from "../core/fixed-loop.js";
import {mountMovementInput} from "./movement-input.js";
import {mountObjectInspector} from "./object-inspector.js";
import {drawObjectOverlay} from "../rendering/object-overlay.js";
import { SNAP_STEPS,pickCoordinate,parseCoordinate,formatCoordinate,clientToScreen } from "../geometry/coordinates.js";

/** Movement practice room, coordinate inspection, and deterministic simulation. */
export function mountRoomPreview(document,view) {
  const canvas=document.getElementById("room-canvas"),host=document.getElementById("room-stage");
  const status=document.getElementById("room-status");
  if(!canvas||!host||!status)return null;
  let initialRoom=validateRoom(GATEHOUSE_PREVIEW),room=initialRoom;
  const $=id=>document.getElementById(id);
  let physics=createPhysicsWorld(room),animation=null,records=[],hintStage=0;
  let player=createPlayer(physics),active=false,lastEvent=null,objectMode=false,inspector=null;
  const playStatus=$("play-status"),followButton=$("follow-toggle"),movementPanel=$("movement-controls");
  const guide=$("tutorial-guide"),hintButton=$("tutorial-hint"),moves=$("tutorial-moves"),tutorialTools=$("tutorial-tools");
  const spellType=()=>room.tutorial?(room.tutorial.spell??"translate"):null;
  const isGate=()=>spellType()==="rotate";
  const actionLabel=()=>isGate()?"Rotation":"Translation";
  const readyMessage=()=>isGate()?"Rotation applied. Walk beneath the open gate if the passage is clear.":"Translation applied. Walk towards the brook and jump onto the beam.";
  const reducedMotion=()=>Boolean(view.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  let follow=true;
  const input=mountMovementInput(document,view,()=>active&&!animation&&!picking&&!objectMode&&!player.completed&&!player.blockedRespawn);
  const loop=createFixedLoop(view,()=>{
    if(!active||document.hidden)return;
    if(animation){animation.elapsed+=FIXED_DT;if(animation.elapsed>=animation.duration){animation=null;if(playStatus)playStatus.textContent=readyMessage();updateGuide();}return;}
    if(picking||objectMode)return;
    const next=stepPlayer(physics,player,input.sample());
    player=next;
    if(next.event&&next.event!==lastEvent){
      if(next.event==="respawn"||next.event==="exit"||next.event==="reset-required")input.clear();
      if(playStatus)playStatus.textContent=next.event==="respawn"?"Returned to a safe checkpoint.":next.event==="checkpoint"?"Checkpoint reached.":next.event==="exit"?(room.tutorial?"Level "+room.number+" complete! "+(isGate()?"You passed the gate.":"You crossed the brook.")+" Reset to try again.":"Gatehouse practice complete! Reset to play again."):"No safe respawn. Reset the room.";
    }
    lastEvent=next.event;
    if(next.event==="exit")updateGuide();
  },()=>viewport?.resize());
  const controls=Object.fromEntries(["overview","inspect","left","right","up","down","zoom-in","zoom-out"].map(id=>[id,$("camera-"+id)]));
  const gridButton=$("grid-toggle"),axesButton=$("axes-toggle"),pickButton=$("pick-toggle"),panel=$("coordinate-panel");
  const snapInput=$("coordinate-snap"),xInput=$("coordinate-x"),yInput=$("coordinate-y"),form=$("coordinate-form"),message=$("coordinate-result");
  let camera=null,mode="overview",focus=null,zoom=null,viewport=null,plan=null;
  let grid=true,axes=true,picking=false,snap=1,point=null;
  const images=loadWorldArt(view,()=>viewport?.resize());
  inspector=mountObjectInspector(document,room,()=>player,()=>redraw(),setObjectMode,{
    canApply:type=>Boolean(type===spellType()&&!animation&&!player.completed&&!player.blockedRespawn),
    preview:(type,id,raw)=>type==="rotate"?previewRotation(room,player,id,raw):previewTranslation(room,player,id,raw),
    apply:applySpell
  });
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
    if(canvas.style)canvas.style.cursor=picking||objectMode?"crosshair":"default";
    if(!camera)return;
    const b=room.bounds,e=.0001;
    for(const [id,allowed] of Object.entries({left:camera.left>b.minX+e,right:camera.right<b.maxX-e,up:camera.top<b.maxY-e,down:camera.bottom>b.minY+e})){
      if(controls[id])controls[id].disabled=mode!=="inspect"||!allowed;
    }
    if(controls["zoom-in"])controls["zoom-in"].disabled=camera.zoom>=MAX_ZOOM-e;
    if(controls["zoom-out"])controls["zoom-out"].disabled=camera.zoom<=1+e;
    const gridStatus=grid&&plan?" · Grid "+plan.minorStep+(plan.minorStep===1?" unit":" units"):"";
    const zoomLabel=Number(camera.zoom.toFixed(2));
    const label=(mode==="overview"?"Full room":"Inspect · "+zoomLabel+"× fit")+gridStatus+" · "+(animation?"Casting "+actionLabel().toLowerCase():picking||objectMode?"Movement paused":room.tutorial?"Level "+room.number:"Practice room");
    if(status.textContent!==label)status.textContent=label;
    followButton?.setAttribute("aria-pressed",String(follow));
    if(movementPanel)movementPanel.hidden=picking||objectMode||Boolean(animation);
    if(pickButton)pickButton.disabled=Boolean(animation);
    if($("object-toggle"))$("object-toggle").disabled=Boolean(animation);
  }
  viewport=mountViewport(canvas,host,view,(ctx,metrics)=>{
    const target=active&&follow&&!animation&&!picking&&!objectMode&&mode==="inspect"?{x:player.x,y:player.y+0.8}:focus;
    camera=createCamera(room.bounds,metrics.width,metrics.height,mode,target,zoom);
    mode=camera.mode;zoom=camera.zoom;focus={x:camera.cx,y:camera.cy};
    const frame=animation?(animation.type==="rotate"?rotatedFrame:translatedFrame)(room,animation.transition,animation.elapsed/animation.duration):room;
    renderWorld(ctx,metrics,camera,frame,images.art,player,reducedMotion());
    plan=drawCoordinateOverlay(ctx,camera,room.bounds,{grid,axes,picking,point});
    if(objectMode&&inspector){const s=inspector.getState();drawObjectOverlay(ctx,camera,room.bounds,s.objects,s.selected,s.preview);}
    updateControls();
  });
  if(!viewport)status.textContent="Canvas 2D is unavailable in this browser.";
  const listeners=[];
  function on(element,event,fn){if(!element)return;element.addEventListener(event,fn);listeners.push([element,event,fn]);}
  function redraw(){viewport?.resize();if(!camera)updateControls();}
  function setMode(next){
    if(next!=="overview"&&next!=="inspect")return false;
    mode=next;zoom=null;follow=true;focus=next==="overview"?null:{x:camera?.cx??16,y:camera?.cy??7};
    redraw();return true;
  }
  function useCamera(next){mode=next.mode;zoom=next.zoom;focus={x:next.cx,y:next.cy};redraw();}
  function pan(dx,dy){if(!camera||mode!=="inspect")return false;follow=false;useCamera(panCamera(camera,room.bounds,dx,dy));return true;}
  function changeZoom(multiplier){if(!camera)return false;useCamera(zoomCamera(camera,room.bounds,multiplier));return true;}
  function setOverlay(key,value){
    if(key==="grid")grid=Boolean(value);else if(key==="axes")axes=Boolean(value);else return false;
    redraw();return true;
  }
  function setPicking(value){
    if(animation)return false;
    picking=Boolean(value);if(picking&&objectMode){objectMode=false;inspector?.setActive(false);}input.clear();redraw();
    if(message)message.textContent=point?formatCoordinate(point):"Click or tap the room, or enter coordinates.";
    return picking;
  }
  function setObjectMode(value){
    if(!inspector||animation)return false;
    objectMode=Boolean(value);
    if(objectMode)picking=false;
    inspector.setActive(objectMode);input.clear();redraw();
    if(!objectMode)canvas.focus?.({preventScroll:true});
    return objectMode;
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
    if(!camera||(!picking&&!objectMode))return;
    const p=clientToScreen(canvas.getBoundingClientRect(),event.clientX,event.clientY,camera);
    if(p){if(objectMode)inspector?.pick(camera,p);else pickAt(p);}
  });
  function setActive(value){
    active=Boolean(value);input.clear();
    if(active){viewport?.resize();loop.start();}else{loop.stop();animation=null;objectMode=false;inspector?.setActive(false);}
  }
  function updateGuide(){
    const tutorial=Boolean(room.tutorial);
    if(tutorialTools)tutorialTools.hidden=!tutorial;
    if(guide){
      guide.hidden=!tutorial;
      if(tutorial){
        guide.textContent=player.completed?"Well done! You reached the portal using "+records.length+" "+actionLabel().toLowerCase()+(records.length===1?"":"s")+".":animation?(isGate()?"The gate is turning.":"The beam is moving."):hintStage?(isGate()?gateHint:brookHint)(room,hintStage):records.length?(isGate()?"Check the gate position. Walk beneath it towards the portal if the passage is clear. You can cast again from safe ground.":"Check the new position. Walk towards the brook, jump onto the beam and reach the portal. You can cast again from safe ground if needed."):(isGate()?"Your goal: open the gate and reach the portal. Open Objects, select the hinged gate, and choose Rotation. Read the hinge coordinates, angle and direction.":"Your goal: bridge the brook and reach the portal. Open Objects, select the timber beam, and choose Translation.");
      }
    }
    if(moves)moves.textContent="Moves: "+records.length;
    if(hintButton){hintButton.textContent=hintStage===3?"Hide hint":hintStage?"Next hint":"Hint";hintButton.disabled=Boolean(animation)||player.completed;}
  }
  function applySpell(type,id,raw){
    if(type!==spellType()||!room.tutorial||!objectMode||animation)return {ok:false,code:"unavailable",message:"That spell is not available now."};
    const tx=(type==="rotate"?commitRotation:commitTranslation)(room,player,id,raw);
    if(!tx.ok)return tx;
    // Commit geometry + collision index together; animation is presentation only.
    room=tx.room;physics=tx.physics;records=[...records,tx.record];hintStage=0;
    objectMode=false;inspector?.setActive(false);inspector?.replaceRoom(room);input.clear();
    if(!reducedMotion())animation={type,transition:tx.transition,elapsed:0,duration:type==="rotate"?.75:.65};
    if(playStatus)playStatus.textContent=animation?actionLabel()+" applied. Wait for the object to settle.":readyMessage();
    updateGuide();redraw();canvas.focus?.({preventScroll:true});return tx;
  }
  function resetPlayer(){
    room=initialRoom;physics=createPhysicsWorld(room);player=createPlayer(physics);
    animation=null;records=[];hintStage=0;lastEvent=null;input.clear();follow=true;objectMode=false;picking=false;point=null;
    inspector?.setActive(false);inspector?.replaceRoom(room);
    if(xInput)xInput.value="";if(yInput)yInput.value="";
    if(message)message.textContent="No point selected";
    if(playStatus)playStatus.textContent=room.tutorial?"Arrows / WASD · Space to jump":"Practice restarted.";
    updateGuide();redraw();
  }
  function setLevel(key){
    initialRoom=validateRoom(key==="level1"?ACROSS_THE_BROOK:key==="level2"?STUBBORN_GATE:GATEHOUSE_PREVIEW);
    mode="overview";zoom=null;focus=null;
    const heading=$("room-heading"),chapter=$("room-chapter");
    if(heading)heading.textContent=initialRoom.title;
    if(chapter)chapter.textContent=initialRoom.tutorial?"Chapter I · Level "+initialRoom.number+" · "+(initialRoom.tutorial.spell==="rotate"?"Rotation":"Translation"):"Chapter I · Interactive object practice";
    resetPlayer();
  }
  on(hintButton,"click",()=>{hintStage=(hintStage+1)%4;updateGuide();});
  on(followButton,"click",()=>{follow=!follow;redraw();});
  on($("reset-practice"),"click",()=>{resetPlayer();canvas.focus?.({preventScroll:true});});
  // Click the stage to return keyboard focus to gameplay after inspecting controls.
  on(host,"click",()=>{if(!picking&&!objectMode)canvas.focus?.({preventScroll:true});});
  updateControls();updateGuide();
  return {get room(){return room;},setLevel,setActive,resetPlayer,setObjectMode,inspector,getRecords:()=>records.slice(),getPlayer:()=>({...player}),setMode,pan,changeZoom,setOverlay,setPicking,setSnap,pickAt,enterPoint,clearPoint,
    getCamera:()=>camera,getCoordinateState:()=>({grid,axes,picking,snap,point:point?{...point}:null}),
    refresh:()=>viewport?.resize(),
    destroy(){loop.stop();input.destroy();inspector?.destroy();viewport?.destroy();images.destroy();for(const [el,event,fn] of listeners)el.removeEventListener(event,fn);}};
}
