import {polygonBounds,deepFreeze} from "../geometry/world.js";
import {gardenSituation} from "./garden-guidance.js";
import {clockworkSituation} from "./clockwork-guidance.js";
import {riverworksSituation} from "./riverworks-guidance.js";
import {referencePoints} from "../transformations/preview-math.js";
import {previewTranslation} from "../transformations/translation.js";
import {previewRotation} from "../transformations/rotation.js";
import {previewEnlargement} from "../transformations/enlargement.js";
import {previewReflection} from "../transformations/reflection.js";

export const HINT_STAGES=Object.freeze(["Obstacle","Useful object","Transformation","Mathematical reasoning","Worked solution"]);
const near=(a,b)=>Math.abs(a-b)<1e-7;
const num=n=>Number(n.toFixed(10));
const coord=p=>"("+p.map(num).join(", ")+")";
const ref=(o,id)=>referencePoints(o).find(r=>r.id===id)?.point;
const CONFIG=deepFreeze({
  "gatehouse-01":{
    objectId:"brook-beam",type:"translate",name:"Translation",
    objective:"Your goal: bridge the brook and reach the portal.",
    obstacle:"The brook is 10 units wide. A normal jump cannot cross it. How could you make a continuous path?",
    object:"Look for the long timber beam on the west bank. It is longer than the gap and could rest on both banks.",
    spell:"Translation moves every point by the same horizontal and vertical distances. Size and orientation stay unchanged.",
    fields:"Enter both components of the column vector: horizontal first, vertical second. Right and up are positive; left and down are negative. Include zero when there is no movement in a direction.",
    traverse:"Walk towards the brook, jump onto the beam and cross it to the portal."
  },
  "gatehouse-02":{
    objectId:"stubborn-gate",type:"rotate",name:"Rotation",
    objective:"Your goal: open the gate and reach the portal.",
    obstacle:"The passage is blocked by a tall barrier. You need to create enough clearance to walk underneath.",
    object:"Look at the hinged gate. Its hinge is fixed to the stone bracket above the passage.",
    spell:"Rotation turns a shape about a fixed centre. You need an angle, a direction and a centre of rotation.",
    fields:"Read the hinge H on the grid. Enter its x- and y-coordinates, choose the angle and clockwise or anticlockwise direction. Preview the whole arc, not just the endpoint.",
    traverse:"Walk beneath the opened gate and continue to the portal."
  },
  "gatehouse-03":{
    objectId:"cheesy-wedge",type:"enlarge",name:"Enlargement",
    objective:"Your goal: reach the high ledge and the portal.",
    obstacle:"The ledge is 9 units above the floor. The current ramp may not be tall enough; you need a route up the step.",
    object:"The cheese wedge has a sloping top. Changing its size can extend that slope up to the ledge.",
    spell:"Enlargement multiplies lengths by a scale factor about a centre. Positive factors keep the shape similar and preserve its slope.",
    fields:"Enter a positive scale factor (a fraction or decimal is allowed) and both coordinates of the centre. A point at the centre stays fixed.",
    traverse:"Walk up the cheese ramp, onto the high ledge and towards the portal."
  },
  "gatehouse-04":{
    objectId:"missing-barrel",type:"reflect",name:"Reflection",
    objective:"Your goal: rescue the barrel and reach the raised ledge.",
    obstacle:"The ledge is too high for one jump. Look for a way to make an intermediate step on the courtyard side of the wall.",
    object:"The timber barrel is trapped in the sealed store. You can select objects remotely, even when the apprentice cannot reach them.",
    spell:"Reflection flips a shape across a mirror line. Corresponding points are equal perpendicular distances from that line. This magical transfer may cross a wall, but its destination must be clear.",
    fields:"Enter an equation for the mirror line, not a direction or a distance. Use x = a for a vertical line, y = b for a horizontal line, or y = x / y = −x for the supported diagonals.",
    traverse:"Jump onto the barrel, release Jump to land, then jump again onto the raised ledge. Walk to the portal."
  }
});
const validators={translate:previewTranslation,rotate:previewRotation,enlarge:previewEnlargement,reflect:previewReflection};
export function tutorialConfig(room){return CONFIG[room?.id]??null;}

/** Read the live object, not the original answer. 'ready' recognises the intended
 * usable arrangement (including common alternate placements); it is guidance only,
 * never a completion gate or an exhaustive solver. */
export function tutorialSituation(room){
  if(room?.chapter===2)return gardenSituation(room);
  if(room?.chapter===3)return clockworkSituation(room);
  if(room?.chapter===4)return riverworksSituation(room);
  const config=tutorialConfig(room),o=room?.objects.find(v=>v.id===config?.objectId);
  if(!config||!o)return null;
  const b=polygonBounds(o.vertices),a=ref(o,"A");
  let ready=false,reasoning="",worked="",raw=null;
  if(config.type==="translate"){
    const [x,y]=room.tutorial.target,dx=num(x-a[0]),dy=num(y-a[1]);
    ready=near(b.minY,3)&&b.minX<=16+1e-7&&b.maxX>=26-1e-7;
    reasoning="Compare A "+coord(a)+" with one useful image A′ "+coord([x,y])+". Calculate image x − original x, then image y − original y. This gives the top and bottom entries of the vector.";
    raw={dx,dy};worked="Horizontal: "+num(x)+" − ("+num(a[0])+") = "+dx+". Vertical: "+num(y)+" − ("+num(a[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+") with "+dx+" above "+dy+".";
  }else if(config.type==="rotate"){
    const h=o.hinge,dx=a[0]-h[0],dy=a[1]-h[1];
    ready=b.minY>=h[1]-1e-7;
    reasoning="H = "+coord(h)+" is the fixed centre. A = "+coord(a)+". Compare the ray HA with the horizontal ray to the right of H. Count quarter-turns and choose a direction that avoids the floor and lintel.";
    const turn=((Math.round(-Math.atan2(dy,dx)/(Math.PI/2))%4)+4)%4;
    if(turn){
      const candidates=[{angle:90*turn,direction:"anticlockwise",cx:h[0],cy:h[1]},{angle:360-90*turn,direction:"clockwise",cx:h[0],cy:h[1]}].sort((a,b)=>a.angle-b.angle);
      raw=candidates.find(v=>previewRotation(room,null,o.id,v).ok)??candidates[0];
      worked="Use "+raw.angle+"° "+raw.direction+" about "+coord(h)+". The ray HA turns to the right, leaving the hinge fixed.";
    }
  }else if(config.type==="enlarge"){
    const base=ref(o,"B"),top=ref(o,"C"),height=top[1]-base[1],target=[25,3],desired=9/height;
    ready=near(base[0],25)&&near(base[1],3)&&near(top[1],12);
    reasoning="The wedge is "+num(height)+" units high. The ledge needs 9 units. Use image height ÷ original height. B = "+coord(base)+" is the lower corner; it needs to be at "+coord(target)+". A fixed point can be the centre.";
    if(!near(desired,1)){
      const factor=num(Math.max(o.scaleRange[0],Math.min(o.scaleRange[1],desired)));
      const centre=near(base[0],target[0])&&near(base[1],target[1])?target:target.map((v,i)=>num((v-factor*base[i])/(1-factor)));
      raw={factor,cx:centre[0],cy:centre[1]};
      if(near(factor,desired)){
        worked="Scale factor = 9 ÷ "+num(height)+" = "+factor+". Centre "+coord(centre)+".";
        if(!near(base[0],25)||!near(base[1],3))worked+=" This centre maps the current B "+coord(base)+" to "+coord(target)+".";
      }else worked="The full factor is 9 ÷ "+num(height)+" = "+num(desired)+", outside the allowed per-cast range. One intermediate step is factor "+factor+" about "+coord(centre)+". Recheck the height afterwards.";
    }else worked="The wedge already has the required height, but its base is not aligned. Factor 1 cannot move it. Undo the previous cast, or Reset to use the original example.";
  }else if(config.type==="reflect"){
    const width=b.maxX-b.minX,height=b.maxY-b.minY;
    ready=near(b.minY,3)&&near(height,2.5)&&near(width,3)&&b.minX>=23-1e-7&&b.maxX>=26-1e-7&&b.maxX<=28+1e-7;
    if(near(b.minY,3)&&near(height,2.5)&&near(width,3)){
      const centre=(b.minX+b.maxX)/2,m=num((centre+25.5)/2),image=[num(2*m-a[0]),a[1]];
      reasoning="A = "+coord(a)+". One useful image A′ is "+coord(image)+". A vertical mirror keeps y unchanged. Its x-coordinate is the midpoint of the two x-coordinates.";
      raw={line:"x = "+m};worked="The midpoint of x = "+num(a[0])+" and x = "+num(image[0])+" is ("+num(a[0])+" + "+num(image[0])+") ÷ 2 = "+m+". Reflect in x = "+m+".";
    }else{
      reasoning="The barrel has changed height, orientation or support position. Compare its current vertices with the courtyard floor and ledge. A vertical mirror preserves every y-coordinate.";
      worked="The current barrel is not in the original horizontal arrangement. Undo to a supported horizontal barrel, then calculate a vertical mirror line. Reset is also available.";
    }
  }
  return {config,ready,reasoning,worked,raw};
}
// Fade automatic solution scaffolding across the first three chapters. The
// guide teaches the interface; optional hints retain the detailed mathematics.
const CHALLENGE_GOALS=deepFreeze({
 "gardens-05":"Cross the brook and pass the garden gate.",
 "gardens-06":"Open a route to the high terrace.",
 "gardens-07":"Reach the upper terrace.",
 "gardens-08":"Reach the highest walkway.",
 "clockwork-09":"Cross the machine channel.",
 "clockwork-10":"Find a route under the arch and across the channel.",
 "clockwork-11":"Reach the high landing.",
 "clockwork-12":"Unlock the gate and reach the portal.",
 "riverworks-13":"Cross both channels of the river.",
 "riverworks-14":"Reach the upper works."
});
export function campaignGoal(room){return CHALLENGE_GOALS[room?.id]??"Reach the exit portal.";}
const FIELD_GUIDES=Object.freeze({
 translate:"Enter the signed horizontal and vertical components of a column vector.",
 rotate:"Enter angle, direction and both centre coordinates.",
 enlarge:"Enter scale factor and both centre coordinates.",
 reflect:"Enter the mirror line equation."
});
export function castStatusMessage(room,situation,guidanceEnabled,firstChapterMessage){
 if(!guidanceEnabled)return "Transformation applied. Inspect the new arrangement.";
 if(room.chapter===1&&situation?.ready&&firstChapterMessage)return firstChapterMessage;
 if(situation?.ready)return "Transformation applied. Try the route to the portal.";
 return "Transformation applied. Check the new arrangement; another cast may help.";
}
export function contextualGuide(room,player,inspection,{casting=false,picking=false,canUndo=false,moves=0,situation=tutorialSituation(room)}={}){
  const c=situation?.config;if(!c)return null;
  if(player.blockedRespawn)return {step:"Recover",text:"You need to recover before moving. "+(canUndo?"Use Undo or Reset.":"Use Reset.")};
  if(player.completed)return {step:"Complete",text:"Well done! You reached the portal using "+moves+" "+(room.tutorial.spells?"transformation":c.name.toLowerCase())+(moves===1?"":"s")+"."};
  if(casting)return {step:"Cast",text:"The transformation is being applied. Movement resumes when the animation finishes."};
  if(picking)return {step:"Read coordinates",text:"Use the grid to inspect coordinates. Close Pick point before selecting an object or moving."};
  if(inspection?.active){
    if(situation.ready)return {step:"Traverse",text:(room.chapter===1?"The object is in a useful position. Close Objects, then ":"The route appears ready. Close Objects, then ")+c.traverse.charAt(0).toLowerCase()+c.traverse.slice(1)};
    if(!inspection.selected)return {step:"Select object",text:"Select an outlined object on the map or choose one from the list. The apprentice does not need to stand beside it."};
    if(!inspection.type)return {step:"Choose transformation",text:"Read the selected object's allowed transformations and choose one."};
    if(inspection.preview?.ok)return {step:"Apply or revise",text:"Compare the ghost image with the obstacle. If it helps, select Apply. A clear preview is not necessarily a useful solution."};
    if(inspection.preview&&!inspection.preview.ok)return {step:"Revise",text:"Read the feedback, adjust the mathematical parameters and preview again. Rejected previews use no moves."};
    return {step:"Enter parameters",text:(room.chapter===1&&inspection.type===c.type?c.fields:(FIELD_GUIDES[inspection.type]??"Enter the mathematical parameters."))+" Preview is free."};
  }
  if(situation.ready)return {step:"Traverse",text:c.traverse};
  return {step:"Explore",text:room.chapter===1?c.objective+" Move: arrows / WASD or on-screen buttons. Jump: Space. Open Objects to inspect. Hints are optional.":room.chapter===2?campaignGoal(room)+" Inspect the objects and plan how they could work together. Hints are optional.":room.chapter===3?campaignGoal(room)+" Plan a sequence on the same object. Use Hints only if needed.":campaignGoal(room)+" Consider how the pieces can support one another. Hints are optional."};
}
/** Stage 5 is the only stage that supplies parameter values as a worked answer.
 * Validate the proposed cast against the live world and apprentice before suggesting Apply.
 * Neither the hint nor the guide changes input fields, object state, moves or rating. */
export function tutorialHint(room,player,stage,situation=tutorialSituation(room)){
  if(!situation||!Number.isInteger(stage)||stage<1||stage>HINT_STAGES.length)return null;
  const {config:c,ready,reasoning,worked,raw}=situation;
  let text;
  if(ready)text="The object is already in a useful position. "+c.traverse;
  else if(stage===1)text=c.obstacle;
  else if(stage===2)text=c.object;
  else if(stage===3)text=c.spell;
  else if(stage===4)text=reasoning;
  else{
    text=worked||"Undo or Reset to restore the original example.";
    if(raw){
      const result=validators[c.type](room,player,c.objectId,raw);
      text+=result.ok?" Enter these parameters yourself, then Preview and Apply if clear.":" This example is not currently clear: "+result.message+" Move to safe ground or use Undo / Reset before trying again.";
    }
  }
  return {stage,label:HINT_STAGES[stage-1],text};
}
