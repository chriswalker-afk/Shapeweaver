import {polygonBounds} from "../geometry/world.js";
import {referencePoints} from "../transformations/preview-math.js";
import {gardenFinaleSituation} from "./garden-finale-guidance.js";
const round=x=>Number(x.toFixed(8));
const point=p=>"("+p.map(round).join(", ")+")";
const near=(a,b)=>Math.abs(a-b)<1e-7;
function situation(config,ready,reasoning,worked,raw){return {config,ready,reasoning,worked,raw};}
export function gardenSituation(room){
 const get=id=>room.objects.find(o=>o.id===id),bounds=o=>polygonBounds(o.vertices);
 if(room.id==="gardens-05"){
  const beam=get("garden-beam"),gate=get("garden-hinge"),b=bounds(beam),g=bounds(gate);
  const bridged=near(b.minY,3)&&b.minX<=16+1e-7&&b.maxX>=26-1e-7,opened=g.minY>=8-1e-7;
  const traverse="Walk to the brook, jump onto the beam, cross to the checkpoint and walk under the gate to the portal.";
  if(!bridged){
   const a=referencePoints(beam)[0].point,dx=round(15-a[0]),dy=round(3-a[1]);
   return situation({objectId:beam.id,type:"translate",name:"Translation",objective:"Bridge the brook and open the garden gate.",obstacle:"There are two obstacles: a wide brook and a closed gate. Make a continuous route over the water first.",object:"The garden beam is long enough to rest on both banks.",spell:"Translation moves all points by the same horizontal and vertical distances.",fields:"Enter horizontal and vertical vector components, including zero.",traverse},false,
   "Compare A "+point(a)+" with a useful image A′ (15, 3). Subtract original coordinates from image coordinates.",
   "Horizontal: 15 − ("+round(a[0])+") = "+dx+". Vertical: 3 − ("+round(a[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+").",{dx,dy});
  }
  const h=gate.hinge,a=referencePoints(gate)[0].point;
  return situation({objectId:gate.id,type:"rotate",name:"Rotation",objective:"The brook is bridged. Open the garden gate.",obstacle:"The bridge is ready, but the gate blocks the remaining route.",object:"The timber gate is attached to a fixed hinge.",spell:"Rotation needs a centre, an angle and a direction.",fields:"Read the hinge and enter its coordinates, the angle and direction.",traverse},opened,
   "H = "+point(h)+", A = "+point(a)+". Compare HA with the horizontal ray to the right of H. Count the quarter turns.",
   "Rotate 90° anticlockwise about "+point(h)+".",{angle:90,direction:"anticlockwise",cx:h[0],cy:h[1]});
 }
 if(room.id==="gardens-06"){
  const barrel=get("garden-barrel"),mushroom=get("garden-mushroom"),plate=room.plates[0],gate=get("plate-gate");
  const traverse="Jump over the weighted barrel, walk through the open gate, jump onto the mushroom cap and land. Press Jump again while moving right to spring onto the terrace.";
  if(!gate.open){
   const b=bounds(barrel),a=referencePoints(barrel).find(p=>p.id==="A").point;
   const mirror=round(((b.minX+b.maxX)/2+plate.x+plate.width/2)/2),image=[round(2*mirror-a[0]),a[1]];
   const horizontal=near(b.minY,plate.y)&&near(b.maxX-b.minX,3)&&near(b.maxY-b.minY,2.5);
   return situation({objectId:barrel.id,type:"reflect",name:"Reflection",objective:"Hold down the amber plate to open the gate; then prepare the spring mushroom.",obstacle:"The linked gate stays shut until a weight holds the plate. The apprentice alone cannot activate it.",object:"The weighted barrel is behind the wall. Select it remotely.",spell:"Reflection can transfer the barrel through the wall. Equal perpendicular distances from the mirror line preserve its size.",fields:"Enter a vertical mirror-line equation in the form x = a.",traverse},false,
   horizontal?"Compare A "+point(a)+" with useful image A′ "+point(image)+". Find the midpoint of their x-coordinates.":"The barrel orientation needs correcting. Compare its current base with the flat plate.",
   horizontal?"Reflect in x = "+mirror+". The midpoint of "+round(a[0])+" and "+round(image[0])+" is "+mirror+".":"Undo to a supported horizontal barrel or reset.",horizontal?{line:"x = "+mirror}:null);
  }
  const b=bounds(mushroom),height=b.maxY-b.minY,base=[(b.minX+b.maxX)/2,b.minY],desired=2.5/height;
  const ready=near(height,2.5)&&near(base[0],30)&&near(base[1],3);
  const factor=round(Math.max(.5,Math.min(2,desired)));
  const centre=near(factor,1)?null:[30,3].map((v,i)=>round((v-factor*base[i])/(1-factor)));
  return situation({objectId:mushroom.id,type:"enlarge",name:"Enlargement",objective:"The plate is held down and the gate is open. Prepare the mushroom for the high terrace.",obstacle:"The spring mushroom launches you higher than a normal jump, but its current cap may be too low to reach the terrace.",object:"The red spring mushroom is the second useful object. Its cap is the spring surface.",spell:"Enlargement multiplies every length by the scale factor; the centre stays fixed.",fields:"Enter a positive scale factor and the centre coordinates. Jump from the cap once it is high enough.",traverse},ready,
   "The mushroom height is "+round(height)+" units. A useful cap height above the floor is 2.5 units. Divide target height by current height. The base midpoint is "+point(base)+".",
   centre?"Scale factor "+factor+" about "+point(centre)+(near(factor,desired)?".":" is an intermediate step; recheck the height."):"The size is already correct but the position is not. Undo or reset to realign the base.",centre?{factor,cx:centre[0],cy:centre[1]}:null);
 }
 return gardenFinaleSituation(room);
}
