import {polygonBounds} from "../geometry/world.js";
import {referencePoints} from "../transformations/preview-math.js";
import {previewRotation} from "../transformations/rotation.js";
import {ladderSegment} from "../mechanisms/transformable-ladders.js";
const round=n=>Number(n.toFixed(8)),near=(a,b)=>Math.abs(a-b)<1e-7,point=p=>"("+p.map(round).join(", ")+")";
const ref=(o,id)=>referencePoints(o).find(p=>p.id===id).point;
const situ=(config,ready,reasoning,worked,raw)=>({config,ready,reasoning,worked,raw});
export function gardenFinaleSituation(room){
 const get=id=>room.objects.find(o=>o.id===id);
 if(room.id==="gardens-07"){
  const ladder=get("garden-ladder"),crate=get("ladder-crate"),segment=ladderSegment(ladder),b=polygonBounds(crate.vertices);
  const readyLadder=Boolean(segment&&near(segment.top,12)&&near(segment.bottom,7)),readyCrate=near(b.minY,3)&&b.minX<=22+1e-7&&b.maxX>=23.4-1e-7;
  const traverse="Jump onto the crate, walk to its right edge beneath the ladder, then jump straight up and hold Up / W (or the up button) to catch the ladder. Climb to the top; jump right onto the terrace and walk to the portal.";
  if(!readyLadder){
   const h=ladder.hinge,a=ref(ladder,"A"),turn=((Math.round((-Math.PI/2-Math.atan2(a[1]-h[1],a[0]-h[0]))/(Math.PI/2))%4)+4)%4;
   const options=turn?[{angle:90*turn,direction:"anticlockwise",cx:h[0],cy:h[1]},{angle:360-90*turn,direction:"clockwise",cx:h[0],cy:h[1]}].sort((a,b)=>a.angle-b.angle):[];
   const raw=options.find(v=>previewRotation(room,null,ladder.id,v).ok)??options[0]??null;
   return situ({objectId:ladder.id,type:"rotate",name:"Rotation",objective:"Lower the ladder and position a step beneath it.",obstacle:"The terrace is too high to jump to. The ladder is horizontal or does not hang down towards the floor.",object:"Inspect the hinged ladder; only an upright ladder can be climbed.",spell:"A rotation changes orientation about a fixed hinge. The ladder length stays the same.",fields:"Enter the hinge coordinates, angle and direction. Preview the entire arc.",traverse},false,
    "H = "+point(h)+" and A = "+point(a)+". Compare HA with the downward vertical ray from H. Count quarter turns.",
    raw?"Rotate "+raw.angle+"° "+raw.direction+" about "+point(h)+".":"Undo or reset to restore the original ladder.",raw);
  }
  const a=ref(crate,"A"),dx=round(21-a[0]),dy=round(3-a[1]);
  return situ({objectId:crate.id,type:"translate",name:"Translation",objective:"The ladder is upright, but its bottom is beyond a floor jump. Create a step beneath it.",obstacle:"Even the lowered ladder begins too high. A floor jump cannot catch its bottom.",object:"The step crate is tall enough to reach the ladder after a second jump.",spell:"Translation moves the crate without changing its height or orientation.",fields:"Enter both signed components of the translation vector.",traverse},readyCrate,
   "Compare crate A "+point(a)+" with A′ (21, 3) beneath the ladder. Calculate the differences in x and y.",
   "Horizontal: 21 − ("+round(a[0])+") = "+dx+". Vertical: 3 − ("+round(a[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+").",{dx,dy});
 }
 if(room.id==="gardens-08"){
  const platform=get("mirror-platform"),wedge=get("garden-wedge"),b=polygonBounds(platform.vertices),w=polygonBounds(wedge.vertices);
  const traverse="Jump onto the raised platform from the approach, land, then jump right onto the middle walkway. Walk up the ramp to the upper terrace and portal.";
  const readyPlatform=near(b.maxY,5)&&near(b.minX,12)&&near(b.maxX,19.5),readyWedge=near(w.maxY,13)&&near(w.minY,7)&&near(w.maxX,34)&&near(w.minX,22);
  if(!readyPlatform){
   const a=ref(platform,"A"),horizontal=near(b.minX,12)&&near(b.maxX,19.5)&&near(b.maxY-b.minY,.5);
   const mirror=round(((b.minY+b.maxY)/2+4.75)/2),image=[a[0],round(2*mirror-a[1])];
   return situ({objectId:platform.id,type:"reflect",name:"Reflection",objective:"Reflect the enchanted platform above the recess, then enlarge the ramp.",obstacle:"The middle walkway is four units above the approach: too high for a normal jump. Find an intermediate step.",object:"The enchanted timber platform is under the approach walkway. It can float after reflection.",spell:"A horizontal mirror keeps x unchanged and reverses the signed vertical distance from the line.",fields:"Enter a horizontal mirror equation in the form y = b.",traverse},false,
    horizontal?"Compare A "+point(a)+" and useful image A′ "+point(image)+". Calculate the midpoint of the y-coordinates.":"A horizontal reflection cannot correct a platform that has moved sideways. Recover its original horizontal placement.",
    horizontal?"The midpoint of "+round(a[1])+" and "+round(image[1])+" is "+mirror+". Reflect in y = "+mirror+".":"Undo or reset before using the original horizontal mirror example.",horizontal?{line:"y = "+mirror}:null);
  }
  const base=ref(wedge,"B"),top=ref(wedge,"C"),height=top[1]-base[1],desired=6/height,factor=round(Math.max(.5,Math.min(3,desired)));
  const centre=near(factor,1)?null:[34,7].map((v,i)=>round((v-factor*base[i])/(1-factor)));
  return situ({objectId:wedge.id,type:"enlarge",name:"Enlargement",objective:"The intermediate platform is ready. Extend the ramp to the upper terrace.",obstacle:"The final terrace is six units above the middle walkway; the current ramp is too short.",object:"The cheese wedge gives a walkable slope. Its right base corner should remain against the terrace.",spell:"Enlargement changes all lengths by the same scale factor. The centre stays fixed.",fields:"Enter the height ratio and centre coordinates.",traverse},readyWedge,
   "The wedge is "+round(height)+" units high. The required height is 6 units. Divide image height by current height and compare B "+point(base)+" with the intended fixed point (34, 7).",
   centre?"Scale factor "+factor+" about "+point(centre)+(near(factor,desired)?".":" is an intermediate step. Recheck the ramp height."):"The height is already correct; undo or reset if its base is misaligned.",centre?{factor,cx:centre[0],cy:centre[1]}:null);
 }
 return null;
}
