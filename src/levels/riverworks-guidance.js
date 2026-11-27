import {polygonBounds} from "../geometry/world.js";
import {bearingStatus} from "../mechanisms/structural-bearings.js";
import {ladderSegment} from "../mechanisms/transformable-ladders.js";
import {referencePoints} from "../transformations/preview-math.js";
import {previewRotation} from "../transformations/rotation.js";
const near=(a,b)=>Math.abs(a-b)<1e-7,round=n=>Number(n.toFixed(8)),point=p=>"("+p.map(round).join(", ")+")";
const state=(config,ready,reasoning,worked,raw)=>({config,ready,reasoning,worked,raw});
function translation(room,o,target,objective,obstacle,object,traverse,ready=false){
 const a=referencePoints(o).find(p=>p.id==="A").point,dx=round(target[0]-a[0]),dy=round(target[1]-a[1]);
 return state({objectId:o.id,type:"translate",name:"Translation",objective,obstacle,object,
 spell:"A translation preserves size and orientation. Each point, including both bearing ends, moves by the same vector.",
 fields:"Enter signed horizontal and vertical components of the column vector.",traverse},ready,
 "A = "+point(a)+". A useful image A′ = "+point(target)+". Subtract original coordinates from image coordinates. Check the support beneath each end.",
 "Horizontal: "+target[0]+" − ("+round(a[0])+") = "+dx+". Vertical: "+target[1]+" − ("+round(a[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+").",{dx,dy});
}
export function riverworksSituation(room){
 const get=id=>room.objects.find(o=>o.id===id);
 if(room.id==="riverworks-13"){
  const a=get("west-span"),b=get("east-span"),pieces=[a,b];
  const covers=(o,lo,hi)=>{const r=polygonBounds(o.vertices);return near(r.minY,3)&&r.minX<=lo+1e-7&&r.maxX>=hi-1e-7&&bearingStatus(room,o).every(Boolean);};
  const nearSpan=pieces.find(o=>covers(o,30,40)),farSpan=pieces.find(o=>covers(o,44,54));
  const traverse="Walk to the first span, jump onto the timber and cross both channels via the central pier to the portal.";
  if(!farSpan){
   const o=nearSpan?pieces.find(p=>p.id!==nearSpan.id):b;
   return translation(room,o,[42,3],"Construct a supported crossing of both channels.","A single beam cannot span the entire river. The far span needs to reach from the central pier to the east quay.","Choose the span with a clear straight path from the staging area to the far channel. Both bearing ends need support.",traverse);
  }
  const o=pieces.find(p=>p.id!==farSpan.id);
  return translation(room,o,[29,3],"Connect the west quay to the supported far span.","The far crossing is ready. The first channel still needs a span resting on the west quay and central pier.","Use the remaining beam. The pier can support the meeting ends of both beams.",traverse,Boolean(nearSpan));
 }
 if(room.id==="riverworks-14"){
  const lower=get("lower-step"),upper=get("upper-step"),ladder=get("service-ladder"),l=polygonBounds(lower.vertices),u=polygonBounds(upper.vertices),seg=ladderSegment(ladder);
  const lowReady=near(l.minX,25)&&near(l.minY,3),highReady=near(u.minX,30)&&near(u.minY,5.5),ladderReady=Boolean(seg&&near(seg.bottom,10)&&near(seg.top,15));
  const traverse="Jump onto the lower platform and land. Jump onto the upper platform, walk beneath the ladder, then jump and hold Up / W (or the up button). Climb to the top and jump right to the portal.";
  if(!lowReady)return translation(room,lower,[25,3],"Build a two-step structure beneath the service ladder.","The ladder begins too high for a floor jump. A long lower platform can provide the foundation for a second step.","The long platform must sit on the floor and leave room for a jump onto its left end.",traverse);
  if(!highReady)return translation(room,upper,[30,5.5],"Add a supported second step.","The first platform is not high enough to catch the ladder. The short platform can rest on top of it.","Use the upper platform on the storage rack. Its two bearing ends need solid support beneath them.",traverse);
  const h=ladder.hinge,a=referencePoints(ladder).find(p=>p.id==="A").point,turn=((Math.round((-Math.PI/2-Math.atan2(a[1]-h[1],a[0]-h[0]))/(Math.PI/2))%4)+4)%4;
  const choices=turn?[{angle:90*turn,direction:"anticlockwise",cx:h[0],cy:h[1]},{angle:360-90*turn,direction:"clockwise",cx:h[0],cy:h[1]}].sort((a,b)=>a.angle-b.angle):[];
  const raw=choices.find(v=>previewRotation(room,null,ladder.id,v).ok)??choices[0]??null;
  return state({objectId:ladder.id,type:"rotate",name:"Rotation",objective:"Lower the service ladder towards the assembled staircase.",obstacle:"The two platforms reach the ladder's useful height, but it must be vertical and extend downwards.",object:"Inspect the hinged service ladder. The hinge is the fixed centre.",spell:"Rotate about the hinge to turn the ladder without changing its length.",fields:"Enter the angle, direction and both centre coordinates.",traverse},ladderReady,
   "H = "+point(h)+"; A = "+point(a)+". Compare HA with the downward vertical ray. Choose a clear quarter-turn arc.",
   raw?"Rotate "+raw.angle+"° "+raw.direction+" about "+point(h)+".":"The ladder is already aligned; check the steps or Undo.",raw);
 }
 return null;
}
