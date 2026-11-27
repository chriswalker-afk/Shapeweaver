import {polygonBounds} from "../geometry/world.js";
import {referencePoints,transformPoint} from "../transformations/preview-math.js";
import {shapeSocketFilled} from "../mechanisms/shape-sockets.js";
import {previewRotation} from "../transformations/rotation.js";
const near=(a,b)=>Math.abs(a-b)<1e-7,round=n=>Number(n.toFixed(8)),point=p=>"("+p.map(round).join(", ")+")";
const ref=(o,id)=>referencePoints(o).find(r=>r.id===id).point;
const state=(config,ready,reasoning,worked,raw)=>({config,ready,reasoning,worked,raw});
const centreForScale=(a,b,k)=>a.map((v,i)=>round((b[i]-k*v)/(1-k)));
const modulo=n=>((n%4)+4)%4;
function rotationCentre(a,b,turn){
 // b = c + R(a-c), so (I-R)c = b-Ra.
 const [x,y]=transformPoint(a,{type:"rotate",angle:90*turn,direction:"anticlockwise",centre:[0,0]});
 const [u,v]=[b[0]-x,b[1]-y],c=[0,0,-1,0][turn],s=[0,1,0,-1][turn],d=(1-c)**2+s*s;
 return [round(((1-c)*u-s*v)/d),round((s*u+(1-c)*v)/d)];
}
export function clockworkFinaleSituation(room){
 const o=room.objects[0],b=polygonBounds(o.vertices),a=ref(o,"A"),bb=ref(o,"B"),c=ref(o,"C");
 if(room.id==="clockwork-11"){
  const traverse="Walk up the rising ramp onto the landing and through the portal.";
  const rising=near(a[1],bb[1])&&near(c[0],a[0])&&a[0]>bb[0]&&c[1]>a[1];
  const falling=near(a[1],bb[1])&&near(c[0],a[0])&&a[0]<bb[0]&&c[1]>a[1];
  const ready=rising&&near(a[0],34)&&near(a[1],3)&&near(c[1],9)&&near(bb[0],22);
  if(!rising){
   const target=near(b.maxY-b.minY,6)?22:14,m=round((bb[0]+target)/2);
   return state({objectId:o.id,type:"reflect",name:"Reflection",objective:"Correct the wedge's orientation, then enlarge it to the landing.",obstacle:"The wedge slopes the wrong way. Its steep edge must meet the high landing.",object:"Use the asymmetric wedge; its vertex labels let you track corresponding points.",spell:"Reflecting in a vertical line reverses the horizontal orientation but keeps every y-coordinate.",fields:"Find the midpoint of corresponding x-coordinates; enter x = a.",traverse},false,
    falling?"B = "+point(bb)+". One useful image B′ is "+point([target,bb[1]])+". Calculate the midpoint of the x-coordinates.":"The wedge has an unfamiliar orientation. Recover a floor-standing wedge before reflecting.",
    falling?"Reflect in x = "+m+", the midpoint of "+round(bb[0])+" and "+target+".":"Undo or reset to a floor-standing wedge.",falling?{line:"x = "+m}:null);
  }
  const h=c[1]-a[1],factor=round(Math.max(.5,Math.min(3,6/h))),centre=near(factor,1)?null:centreForScale(bb,[22,3],factor);
  return state({objectId:o.id,type:"enlarge",name:"Enlargement",objective:"The slope now rises right. Resize and position it to meet the landing.",obstacle:"The wedge needs to rise six units, with its steep right edge at x = 34.",object:"Track the low corner B and the high corner C of the same wedge.",spell:"Lengths multiply by the scale factor; a centre may be outside the object. The centre, original point and image point are collinear.",fields:"Calculate the scale factor and the external centre. Enter both centre coordinates.",traverse},ready,
   "Current height "+round(h)+", required height 6. Compare B "+point(bb)+" with B′ (22, 3). Use B′ = centre + scale factor × (B − centre).",
   centre?"Scale factor "+factor+" about "+point(centre)+(near(factor,6/h)?".":" is an intermediate step; recheck height and position.")+" The centre satisfies the B-to-B′ mapping.":"The height is already correct. If the position is wrong, use Undo or reset.",centre?{factor,cx:centre[0],cy:centre[1]}:null);
 }
 if(room.id==="clockwork-12"){
  const slot=room.shapeSockets[0],ready=shapeSocketFilled(room,slot),targetA=slot.vertices[0],targetB=slot.vertices[1];
  const traverse="The lock is open. Walk under the enchanted key and through the gate to the portal.";
  const length=Math.hypot(bb[0]-a[0],bb[1]-a[1]),desired=Math.hypot(targetB[0]-targetA[0],targetB[1]-targetA[1])/length;
  const turn=modulo(Math.round((Math.atan2(targetB[1]-targetA[1],targetB[0]-targetA[0])-Math.atan2(bb[1]-a[1],bb[0]-a[0]))/(Math.PI/2)));
  if(!near(desired,1)){
   const factor=round(Math.max(.5,Math.min(2,desired))),pivot=[13,8];
   const preA=turn?transformPoint(targetA,{type:"rotate",angle:90*turn,direction:"clockwise",centre:pivot}):targetA;
   const centre=centreForScale(a,near(factor,desired)?preA:a,factor);
   return state({objectId:o.id,type:"enlarge",name:"Enlargement",objective:"Match the size and orientation of the L-shaped lock outline.",obstacle:"The key and recess have different sizes. Match corresponding edge lengths before turning the key.",object:"Select the enchanted L-shaped brass key. The dashed recess is its target, not a solid obstacle.",spell:"Use the ratio of corresponding edge lengths. An enlargement preserves angles and orientation.",fields:"Enter the scale factor and centre coordinates. Compare the key's image against the lock outline.",traverse},ready,
    "AB = "+round(length)+" units; the corresponding socket edge is 6 units. Find the ratio. A = "+point(a)+"; a useful intermediate A′ = "+point(preA)+". Solve the enlargement mapping for the centre.",
    "Scale factor "+factor+" about "+point(centre)+(near(factor,desired)?".":" is an intermediate step; check the new size."),{factor,cx:centre[0],cy:centre[1]});
  }
  const centre=turn?rotationCentre(a,targetA,turn):null;
  const choices=centre?[{angle:turn*90,direction:"anticlockwise",cx:centre[0],cy:centre[1]},{angle:(4-turn)*90,direction:"clockwise",cx:centre[0],cy:centre[1]}].sort((a,b)=>a.angle-b.angle):[];
  const raw=choices.find(v=>previewRotation(room,null,o.id,v).ok)??choices[0]??null;
  return state({objectId:o.id,type:"rotate",name:"Rotation",objective:"Match the key's orientation to the recess to release the gate.",obstacle:"The key must match every edge of the L-shaped recess, not just its bounding rectangle.",object:"The enlarged key has the correct size. Match its labelled corners to the recess corners.",spell:"A rotation preserves lengths and angles. Corresponding points are equally far from the rotation centre.",fields:"Choose the angle and direction, and enter the centre coordinates. Preview the full arc.",traverse},ready,
   "A = "+point(a)+", B = "+point(bb)+". Their target points are "+point(targetA)+" and "+point(targetB)+". Compare AB's direction with the matching edge; intersect perpendicular bisectors to find the rotation centre.",
   raw?"Rotate "+raw.angle+"° "+raw.direction+" about ("+raw.cx+", "+raw.cy+").":"If the key has the correct orientation but is displaced, undo or reset.",raw);
 }
 return null;
}
