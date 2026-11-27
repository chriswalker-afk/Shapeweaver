import { GATEHOUSE_PREVIEW, validateRoom } from "../levels/gatehouse-preview.js";
import { ACROSS_THE_BROOK } from "../levels/across-the-brook.js";
import { STUBBORN_GATE } from "../levels/stubborn-gate.js";
import { LITTLE_CHEESY } from "../levels/little-cheesy.js";
import { MISSING_BARREL } from "../levels/missing-barrel.js";
import { previewReflection, commitReflection, reflectedFrame } from "../transformations/reflection.js";
import { previewEnlargement, commitEnlargement, enlargedFrame } from "../transformations/enlargement.js";
import { previewRotation, commitRotation, rotatedFrame } from "../transformations/rotation.js";
import { previewTranslation, commitTranslation, translatedFrame } from "../transformations/translation.js";
import { FIXED_DT, MOTION } from "../physics/platformer.js";
import {returnToSafety} from "../physics/recovery.js";
import {createAttemptHistory,rememberSafePosition,recordCast,undoLastCast,attemptSummary} from "../core/attempt-history.js";
import {completedResult} from "../core/level-results.js";
import {HINT_STAGES,tutorialSituation,contextualGuide,tutorialHint} from "../levels/tutorial-guidance.js";
import { createCamera, panCamera, zoomCamera, MAX_ZOOM, ZOOM_STEP } from "../rendering/camera.js";
import { loadWorldArt, renderWorld } from "../rendering/world-art.js";
import { mountViewport } from "../rendering/viewport.js";
import { drawCoordinateOverlay } from "../rendering/coordinate-grid.js";
import {createPhysicsWorld} from "../physics/collision.js";
import {createPlayer,stepPlayer} from "../physics/platformer.js";
import {createFixedLoop} from "../core/fixed-loop.js";
import {mountMovementInput} from "./movement-input.js";
import {mountObjectInspector} from "./object-inspector.js";
import {drawObjectOverlay,drawReflectionFlash} from "../rendering/object-overlay.js";
import {castProgress,drawCastAura} from "../rendering/cast-effects.js";
import { SNAP_STEPS,pickCoordinate,parseCoordinate,formatCoordinate,clientToScreen } from "../geometry/coordinates.js";

// Keep spell dispatch and tutorial copy data-driven as new transformation types arrive.
const TUTORIALS=Object.freeze({
  translate:{label:"Translation",preview:previewTranslation,commit:commitTranslation,frame:translatedFrame,duration:.65,
    ready:"Translation applied. Walk towards the brook and jump onto the beam.",finished:"You crossed the brook."},
  rotate:{label:"Rotation",preview:previewRotation,commit:commitRotation,frame:rotatedFrame,duration:.75,
    ready:"Rotation applied. Walk beneath the open gate if the passage is clear.",finished:"You passed the gate."},
  enlarge:{label:"Enlargement",preview:previewEnlargement,commit:commitEnlargement,frame:enlargedFrame,duration:.8,
    ready:"Enlargement applied. Walk up the ramp if it reaches the ledge.",finished:"You reached the high ledge."},
  reflect:{label:"Reflection",preview:previewReflection,commit:commitReflection,frame:reflectedFrame,duration:.8,
    ready:"Reflection applied. Jump onto the barrel, then onto the ledge.",finished:"You rescued the barrel and reached the ledge."}
});
const LEVELS=Object.freeze({level1:ACROSS_THE_BROOK,level2:STUBBORN_GATE,level3:LITTLE_CHEESY,level4:MISSING_BARREL});
const tutorialType=room=>room.tutorial?(room.tutorial.spell??"translate"):null;

/** Movement practice room, coordinate inspection, and deterministic simulation. */
export function mountRoomPreview(document,view,{onComplete=()=>{}}={}) {
  const canvas=document.getElementById("room-canvas"),host=document.getElementById("room-stage");
  const status=document.getElementById("room-status");
  if(!canvas||!host||!status)return null;
  let initialRoom=validateRoom(GATEHOUSE_PREVIEW),room=initialRoom;
  const $=id=>document.getElementById(id);
  let physics=createPhysicsWorld(room),animation=null,history=createAttemptHistory(),hintStage=0,result=null;
  let guidanceEnabled=true,situation=tutorialSituation(room);
  let player=createPlayer(physics),active=false,lastEvent=null,objectMode=false,inspector=null;
  let lastSafe=rememberSafePosition(physics,player);
  const playStatus=$("play-status"),followButton=$("follow-toggle"),movementPanel=$("movement-controls");
  const toolsButton=$("room-tools-toggle"),secondaryTools=$("room-secondary-tools"),climbControls=$("climb-controls");
  let toolsOpen=false;
  const guide=$("tutorial-guide"),hintButton=$("tutorial-hint"),moves=$("tutorial-moves"),tutorialTools=$("tutorial-tools");
  const guidanceButton=$("tutorial-guidance-toggle"),hintPanel=$("tutorial-hint-panel"),hintTitle=$("tutorial-hint-title"),hintText=$("tutorial-hint-text"),hintPrevious=$("tutorial-hint-previous"),hintNext=$("tutorial-hint-next"),hintClose=$("tutorial-hint-close");
  const canHint=()=>Boolean(active&&situation&&!animation&&!player.completed&&!player.blockedRespawn);
  const undoButton=$("undo-cast"),returnButton=$("return-safety"),recoveryCount=$("recovery-count");
  const canUndo=()=>active&&!animation&&!player.completed&&history.stack.length>0;
  const spellType=()=>tutorialType(room);
  const tutorial=()=>TUTORIALS[spellType()];
  const actionLabel=()=>tutorial()?.label??"Transformation";
  const readyMessage=()=>situation?.ready?(tutorial()?.ready??"Transformation applied."):"Transformation applied. Check the new position; revise if it does not solve the obstacle.";
  const reducedMotion=()=>Boolean(view.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  let follow=true;
  const input=mountMovementInput(document,view,()=>active&&!animation&&!picking&&!objectMode&&!player.completed&&!player.blockedRespawn);
  const loop=createFixedLoop(view,()=>{
    if(!active||document.hidden)return;
    if(animation){animation.elapsed+=FIXED_DT;if(animation.elapsed>=animation.duration){animation=null;if(playStatus)playStatus.textContent=readyMessage();updateGuide();}return;}
    if(picking||objectMode)return;
    const next=stepPlayer(physics,player,input.sample());
    player=next;lastSafe=rememberSafePosition(physics,player,lastSafe);
    if(next.event&&next.event!==lastEvent){
      if(next.event==="respawn"||next.event==="exit"||next.event==="reset-required")input.clear();
      if(playStatus)playStatus.textContent=next.event==="respawn"?(player.checkpoint?"Returned to the last safe checkpoint.":"Returned to the start.")+" Your transformations are kept.":next.event==="checkpoint"?"Checkpoint reached.":next.event==="exit"?(room.tutorial?"Level "+room.number+" complete! "+tutorial().finished+" Reset to try again.":"Gatehouse practice complete! Reset to play again."):"No safe return point. "+(canUndo()?"Undo a transformation or reset.":"Reset to start a fresh attempt.");
    }
    lastEvent=next.event;
    if(["exit","respawn","reset-required"].includes(next.event))updateGuide();
    if(next.event==="exit"&&!result){
      result=completedResult(room,player,history);
      if(result)onComplete(result);
    }
  },()=>viewport?.resize());
  const controls=Object.fromEntries(["overview","inspect","left","right","up","down","zoom-in","zoom-out"].map(id=>[id,$("camera-"+id)]));
  const gridButton=$("grid-toggle"),axesButton=$("axes-toggle"),pickButton=$("pick-toggle"),panel=$("coordinate-panel");
  const snapInput=$("coordinate-snap"),xInput=$("coordinate-x"),yInput=$("coordinate-y"),form=$("coordinate-form"),message=$("coordinate-result");
  let camera=null,mode="overview",focus=null,zoom=null,viewport=null,plan=null;
  let grid=true,axes=true,picking=false,snap=1,point=null;
  const images=loadWorldArt(view,()=>viewport?.resize());
  inspector=mountObjectInspector(document,room,()=>player,()=>{updateGuide();redraw();},setObjectMode,{
    canApply:type=>Boolean(type===spellType()&&!animation&&!player.completed&&!player.blockedRespawn),
    preview:(type,id,raw)=>TUTORIALS[type].preview(room,player,id,raw),
    apply:applySpell
  });
  function updateControls(){
    if(secondaryTools)secondaryTools.hidden=!toolsOpen;
    if(toolsButton){toolsButton.setAttribute("aria-expanded",String(toolsOpen));setText(toolsButton,toolsOpen?"View tools ▴":"View tools ▾");}
    if(climbControls)climbControls.hidden=!(room.ladders?.length);
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
    updateRecoveryControls();
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
    if(movementPanel)movementPanel.hidden=picking||objectMode||Boolean(animation)||player.blockedRespawn;
    if(pickButton)pickButton.disabled=Boolean(animation);
    if($("object-toggle"))$("object-toggle").disabled=Boolean(animation);
  }
  viewport=mountViewport(canvas,host,view,(ctx,metrics)=>{
    const target=active&&follow&&!animation&&!picking&&!objectMode&&mode==="inspect"?{x:player.x,y:player.y+0.8}:focus;
    camera=createCamera(room.bounds,metrics.width,metrics.height,mode,target,zoom);
    mode=camera.mode;zoom=camera.zoom;focus={x:camera.cx,y:camera.cy};
    const progress=animation?castProgress(animation.elapsed/animation.duration):0;
    const frame=animation?TUTORIALS[animation.type].frame(room,animation.transition,progress):room;
    renderWorld(ctx,metrics,camera,frame,images.art,player,reducedMotion());
    plan=drawCoordinateOverlay(ctx,camera,room.bounds,{grid,axes,picking,point});
    if(animation?.type==="reflect")drawReflectionFlash(ctx,camera,room.bounds,animation.transition.line,progress);
    if(animation&&animation.type!=="reflect"&&!reducedMotion())drawCastAura(ctx,camera,frame.objects.find(o=>o.id===animation.transition.id),animation.type,progress);
    if(objectMode&&inspector){const s=inspector.getState();drawObjectOverlay(ctx,camera,room.bounds,s.objects,s.selected,s.preview);}
    updateControls();
  });
  if(!viewport)status.textContent="Canvas 2D is unavailable in this browser.";
  const listeners=[];
  function on(element,event,fn){if(!element?.addEventListener)return;element.addEventListener(event,fn);listeners.push([element,event,fn]);}
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
  function setToolsOpen(value){
    toolsOpen=Boolean(value);
    if(!toolsOpen&&picking)setPicking(false);
    redraw();return toolsOpen;
  }
  function setPicking(value){
    if(animation)return false;
    if(value)toolsOpen=true;
    picking=Boolean(value);if(picking&&objectMode){objectMode=false;inspector?.setActive(false);}input.clear();updateGuide();redraw();
    if(message)message.textContent=point?formatCoordinate(point):"Click or tap the room, or enter coordinates.";
    return picking;
  }
  function setObjectMode(value){
    if(!inspector||animation)return false;
    objectMode=Boolean(value);
    if(objectMode)picking=false;
    inspector.setActive(objectMode);input.clear();updateGuide();redraw();
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
  on($("coordinate-close"),"click",()=>{setPicking(false);canvas.focus?.({preventScroll:true});});
  on(toolsButton,"click",()=>setToolsOpen(!toolsOpen));
  on(document,"keydown",event=>{
    if(!active||event.code!=="Escape"||animation)return;
    if(hintStage){setHintStage(0);hintButton?.focus?.({preventScroll:true});}
    else if(picking){setPicking(false);canvas.focus?.({preventScroll:true});}
    else if(objectMode)setObjectMode(false);
    else if(toolsOpen){setToolsOpen(false);toolsButton?.focus?.({preventScroll:true});}
    else return;
    event.preventDefault?.();
  });
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
    if(!active)hintStage=0;
    updateGuide();
  }
  function updateRecoveryControls(){
    if(undoButton){
      undoButton.disabled=!canUndo();
      const text=history.stack.length?"Undo ("+history.stack.length+")":"Undo";
      if(undoButton.textContent!==text)undoButton.textContent=text;
      undoButton.setAttribute("aria-label","Undo last applied transformation; "+history.stack.length+" available. Committed moves still count.");
    }
    if(returnButton)returnButton.disabled=!active||Boolean(animation)||player.completed||player.blockedRespawn;
    if(recoveryCount){
      const undos=history.entries.length-history.stack.length;
      const text=undos||player.respawns?"Undos: "+undos+" · Returns: "+player.respawns:"";
      if(recoveryCount.textContent!==text)recoveryCount.textContent=text;
      recoveryCount.hidden=!text;
    }
  }
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
  function updateGuide(){
    const config=situation?.config;
    if(tutorialTools)tutorialTools.hidden=!config;
    const context=contextualGuide(room,player,inspector?.getState(),{casting:Boolean(animation),picking,canUndo:canUndo(),moves:history.entries.length,situation});
    if(guide){guide.hidden=!config||!guidanceEnabled;setText(guide,context?context.step+" · "+context.text:"");}
    if(guidanceButton){guidanceButton.setAttribute("aria-pressed",String(guidanceEnabled));setText(guidanceButton,guidanceEnabled?"Guide: on":"Guide: off");}
    if(moves)setText(moves,"Moves: "+history.entries.length);
    if(!canHint())hintStage=0;
    if(hintButton){hintButton.setAttribute("aria-expanded",String(hintStage>0));setText(hintButton,hintStage?"Hide hints":"Hints");hintButton.disabled=!canHint();}
    const hint=hintStage?tutorialHint(room,player,hintStage,situation):null;
    if(hintPanel)hintPanel.hidden=!hint;
    setText(hintTitle,hint?"Hint "+hint.stage+" of "+HINT_STAGES.length+" · "+hint.label:"");
    setText(hintText,hint?.text??"");
    if(hintPrevious)hintPrevious.disabled=hintStage<=1;
    if(hintNext){hintNext.hidden=hintStage>=HINT_STAGES.length;hintNext.disabled=!hint||hintStage>=HINT_STAGES.length;setText(hintNext,hintStage===HINT_STAGES.length-1?"Show worked solution":"Next hint");}
    updateRecoveryControls();
  }
  function setHintStage(stage){
    if(!canHint()||!Number.isInteger(stage)||stage<0||stage>HINT_STAGES.length)return false;
    hintStage=stage;input.clear();updateGuide();redraw();return true;
  }
  function setGuidance(value){guidanceEnabled=Boolean(value);updateGuide();redraw();return guidanceEnabled;}
  function applySpell(type,id,raw){
    if(type!==spellType()||!room.tutorial||!objectMode||animation)return {ok:false,code:"unavailable",message:"That spell is not available now."};
    const tx=TUTORIALS[type].commit(room,player,id,raw);
    if(!tx.ok)return tx;
    // Commit geometry + collision index together; animation is presentation only.
    history=recordCast(history,physics,player,lastSafe,tx.record);
    room=tx.room;physics=tx.physics;situation=tutorialSituation(room);lastSafe=rememberSafePosition(physics,player,lastSafe);hintStage=0;
    objectMode=false;inspector?.setActive(false);inspector?.replaceRoom(room);input.clear();
    if(!reducedMotion())animation={type,transition:tx.transition,elapsed:0,duration:TUTORIALS[type].duration};
    if(playStatus)playStatus.textContent=animation?actionLabel()+" applied. Wait for the object to settle.":readyMessage();
    updateGuide();redraw();canvas.focus?.({preventScroll:true});return tx;
  }
  function clearRecoveryInteraction(){
    animation=null;hintStage=0;lastEvent=null;input.clear();follow=true;objectMode=false;picking=false;point=null;
    inspector?.setActive(false);inspector?.replaceRoom(room);
    if(xInput)xInput.value="";if(yInput)yInput.value="";
    if(message)message.textContent="No point selected";
  }
  function undoCast(){
    if(!canUndo())return false;
    const tx=undoLastCast(history,player);
    if(!tx.ok){if(playStatus)playStatus.textContent=tx.message;return false;}
    history=tx.history;room=tx.room;physics=tx.physics;player=tx.player;situation=tutorialSituation(room);
    lastSafe=rememberSafePosition(physics,player);clearRecoveryInteraction();
    if(playStatus)playStatus.textContent="Last transformation undone. Restored a safe earlier position. The original move still counts.";
    updateGuide();redraw();canvas.focus?.({preventScroll:true});return true;
  }
  function recoverPlayer(){
    if(!active||animation||player.completed||player.blockedRespawn)return false;
    const tx=returnToSafety(physics,player,MOTION.coyote);
    if(!tx.ok){if(playStatus)playStatus.textContent="No safe checkpoint or start in the current world. "+(canUndo()?"Try Undo or Reset.":"Try Reset.");return false;}
    player={...tx.player,event:null};lastSafe=rememberSafePosition(physics,player);clearRecoveryInteraction();
    if(playStatus)playStatus.textContent=(tx.code==="checkpoint"?"Returned to the last safe checkpoint.":"Returned to the start.")+" Your transformations and moves are kept.";
    updateGuide();redraw();canvas.focus?.({preventScroll:true});return true;
  }
  function resetPlayer(){
    room=initialRoom;physics=createPhysicsWorld(room);player=createPlayer(physics);history=createAttemptHistory();result=null;situation=tutorialSituation(room);
    lastSafe=rememberSafePosition(physics,player);clearRecoveryInteraction();
    if(playStatus)playStatus.textContent=room.tutorial?"Arrows / WASD · Space to jump":"Practice restarted.";
    updateGuide();redraw();
  }
  function setLevel(key){
    initialRoom=validateRoom(Object.hasOwn(LEVELS,key)?LEVELS[key]:GATEHOUSE_PREVIEW);
    mode="overview";zoom=null;focus=null;toolsOpen=false;
    const heading=$("room-heading"),chapter=$("room-chapter");
    if(heading)heading.textContent=initialRoom.title;
    if(chapter)chapter.textContent=initialRoom.tutorial?"Chapter I · Level "+initialRoom.number+" · "+TUTORIALS[tutorialType(initialRoom)].label:"Chapter I · Interactive object practice";
    resetPlayer();
  }
  on(guidanceButton,"click",()=>setGuidance(!guidanceEnabled));
  on(hintButton,"click",()=>setHintStage(hintStage?0:1));
  on(hintPrevious,"click",()=>{if(hintStage>1)setHintStage(hintStage-1);});
  on(hintNext,"click",()=>{if(hintStage>0&&hintStage<HINT_STAGES.length){setHintStage(hintStage+1);if(hintStage===HINT_STAGES.length)hintClose?.focus?.({preventScroll:true});}});
  on(hintClose,"click",()=>{setHintStage(0);hintButton?.focus?.({preventScroll:true});});
  on(undoButton,"click",undoCast);on(returnButton,"click",recoverPlayer);
  on(followButton,"click",()=>{follow=!follow;redraw();});
  on($("reset-practice"),"click",()=>{resetPlayer();canvas.focus?.({preventScroll:true});});
  // Click the stage to return keyboard focus to gameplay after inspecting controls.
  on(host,"click",()=>{if(!picking&&!objectMode)canvas.focus?.({preventScroll:true});});
  updateControls();updateGuide();
  return {get room(){return room;},setLevel,setActive,resetPlayer,setObjectMode,inspector,undoCast,recoverPlayer,getResult:()=>result,setToolsOpen,getToolsOpen:()=>toolsOpen,setGuidance,setHintStage,getTutorialState:()=>({guidanceEnabled,hintStage,step:contextualGuide(room,player,inspector?.getState(),{casting:Boolean(animation),picking,canUndo:canUndo(),moves:history.entries.length,situation})?.step??null}),getAttemptSummary:()=>attemptSummary(history,player),getRecords:()=>history.entries.map(e=>e.record),getPlayer:()=>({...player}),setMode,pan,changeZoom,setOverlay,setPicking,setSnap,pickAt,enterPoint,clearPoint,
    getCamera:()=>camera,getCoordinateState:()=>({grid,axes,picking,snap,point:point?{...point}:null}),
    refresh:()=>viewport?.resize(),
    destroy(){loop.stop();input.destroy();inspector?.destroy();viewport?.destroy();images.destroy();for(const [el,event,fn] of listeners)el.removeEventListener(event,fn);}};
}
