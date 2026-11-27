import {polygonBounds} from "../geometry/world.js";
import {dockedSocket} from "../mechanisms/hinge-sockets.js";
import {referencePoints} from "../transformations/preview-math.js";
import {previewRotation} from "../transformations/rotation.js";
import {clockworkFinaleSituation} from "./clockwork-finale-guidance.js";
const round=n=>Number(n.toFixed(8)),near=(a,b)=>Math.abs(a-b)<1e-7,point=p=>"("+p.map(round).join(", ")+")";
const state=(config,ready,reasoning,worked,raw)=>({config,ready,reasoning,worked,raw});
const traverse="Walk towards the bridge, jump onto the plank and continue across to the portal.";
function translateHint(room,o,target,objective,obstacle,ready=false){
 const h=o.hinge,dx=round(target[0]-h[0]),dy=round(target[1]-h[1]);
 return state({objectId:o.id,type:"translate",name:"Translation",objective,obstacle,object:"Inspect the long beam and its marked hinge H. The hinge moves with the beam.",spell:"Translation preserves orientation and adds the same vector to every point, including the hinge.",fields:"Enter both signed components of the column vector.",traverse},ready,
 "H is "+point(h)+". A useful target for H is "+point(target)+". Subtract the current coordinates from the target coordinates.",
 "Horizontal: "+target[0]+" − ("+round(h[0])+") = "+dx+". Vertical: "+target[1]+" − ("+round(h[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+").",{dx,dy});
}
function rotateHint(room,o,objective,obstacle){
 const h=o.hinge,tip=referencePoints(o).find(p=>p.id==="C").point;
 const turn=((Math.round(-Math.atan2(tip[1]-h[1],tip[0]-h[0])/(Math.PI/2))%4)+4)%4;
 const choices=turn?[{angle:90*turn,direction:"anticlockwise",cx:h[0],cy:h[1]},{angle:360-90*turn,direction:"clockwise",cx:h[0],cy:h[1]}].sort((a,b)=>a.angle-b.angle):[];
 const raw=choices.find(v=>previewRotation(room,null,o.id,v).ok)??choices[0]??null;
 return state({objectId:o.id,type:"rotate",name:"Rotation",objective,obstacle,object:"The marked hinge H is on the same object. Turn the beam to lie horizontally to its right.",spell:"A rotation changes the direction of the ray from the centre while preserving its length.",fields:"Read the current hinge coordinates and enter the angle and direction. Preview the complete arc.",traverse},false,
 "H = "+point(h)+" and C = "+point(tip)+". Compare HC with the horizontal ray pointing right. Count the quarter-turns and choose a direction with a clear arc.",
 raw?"Rotate "+raw.angle+"° "+raw.direction+" about "+point(h)+".":"The orientation is already rightward. Try translation or use Undo if the arc is obstructed.",raw);
}
export function clockworkSituation(room){
 if(room.id==="clockwork-11"||room.id==="clockwork-12")return clockworkFinaleSituation(room);
 const o=room.objects[0],b=polygonBounds(o.vertices),h=o.hinge;
 const rightward=near(b.minX,h[0])&&near(b.minY,h[1])&&near(b.maxX-h[0],12)&&near(b.maxY-h[1],.5);
 if(room.id==="clockwork-09"){
  const ready=near(b.minY,3)&&b.minX<=18+1e-7&&b.maxX>=28-1e-7&&near(b.maxY-b.minY,.5);
  if(ready)return translateHint(room,o,[17,3],"The bridge is ready.","Cross the bridge.",true);
  if(!dockedSocket(room,o))return translateHint(room,o,[17,3],"Dock the beam, then turn it across the channel.","The beam cannot rotate until its hinge H coincides with socket S. Compare their coordinates.");
  return rotateHint(room,o,"Hinge docked. Rotate the same beam to bridge the channel.","The hinge is at the socket, but the beam is not yet a usable bridge.");
 }
 if(room.id==="clockwork-10"){
  const ready=near(b.minY,3)&&near(b.maxY-b.minY,.5)&&b.minX<=24+1e-7&&b.maxX>=34-1e-7;
  if(ready)return translateHint(room,o,[23,3],"The bridge is ready.","Cross the bridge.",true);
  if(!rightward)return rotateHint(room,o,"Turn the plank to fit below the arch, then slide it across the gap.","The upright plank is twelve units tall. The low arch has only three units of clearance; reorient the plank first.");
  return translateHint(room,o,[23,3],"The plank fits under the arch. Slide it to bridge the channel.","A horizontal plank can pass below the lintel. Its final position needs support on both banks.");
 }
 return null;
}
