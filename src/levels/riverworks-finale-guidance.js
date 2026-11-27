import {polygonBounds} from "../geometry/world.js";
import {bearingStatus} from "../mechanisms/structural-bearings.js";
import {shapeFits} from "../mechanisms/shape-sockets.js";
import {referencePoints,parsePreviewRequest,previewGeometry} from "../transformations/preview-math.js";
import {previewRotation} from "../transformations/rotation.js";
const near=(a,b)=>Math.abs(a-b)<1e-7,round=n=>Number(n.toFixed(8)),point=p=>"("+p.map(round).join(", ")+")";
const ref=(o,id)=>referencePoints(o).find(p=>p.id===id).point;
const state=(config,ready,reasoning,worked,raw)=>({config,ready,reasoning,worked,raw});
const deck=v=>{const b=polygonBounds(v);return near(b.minX,24.6)&&near(b.maxX,39.4)&&near(b.minY,10.5)&&near(b.maxY,11.5);};
const orbitTarget=[[34,7.5],[46,7.5],[46,8],[34,8]];
function rotation(room,o,centre,match,config){
 const candidates=[90,180,270].flatMap(angle=>["clockwise","anticlockwise"].map(direction=>({angle,direction,cx:centre[0],cy:centre[1]})));
 const raw=candidates.find(v=>match(previewGeometry(o,parsePreviewRequest("rotate",v)).vertices)&&previewRotation(room,null,o.id,v).ok)??null;
 const a=ref(o,"A"),image=raw?previewGeometry(o,parsePreviewRequest("rotate",raw)).points.find(p=>p.id==="A").point:null;
 return state({...config,objectId:o.id,type:"rotate",name:"Rotation",spell:"A rotation preserves distance from the centre, lengths and angles. The centre stays fixed.",fields:"Enter the angle, direction and both centre coordinates."},false,
 "Centre = "+point(centre)+". A = "+point(a)+(image?"; one useful image A′ = "+point(image):"")+". Compare the rays from the centre and check the full arc.",
 raw?"Rotate "+raw.angle+"° "+raw.direction+" about "+point(centre)+". Check the preview and the complete rotation path.":"No direct permitted arc reaches the intended arrangement from here. Undo or reset, or try a corrective rotation.",raw);
}
export function riverworksFinaleSituation(room){
 const get=id=>room.objects.find(o=>o.id===id);
 if(room.id==="riverworks-17"){
  const rotor=get("mill-rotor"),ramp=get("mill-ramp"),rotorReady=deck(rotor.vertices);
  const base=ref(ramp,"B"),top=ref(ramp,"C"),height=top[1]-base[1],rampReady=near(base[0],24)&&near(base[1],3)&&near(top[1],10.5);
  const traverse="Walk up the ramp to its high end, jump onto the horizontal paddle deck, cross it, then jump to the mill quay and walk to the portal.";
  if(!rotorReady)return rotation(room,rotor,rotor.hinge,deck,{objective:"Turn the waterwheel's linked paddles into a crossing.",obstacle:"The mill channel is too wide for a jump. The vertical rotor needs to present a horizontal deck.",object:"Inspect the entire two-paddle rotor and its fixed axle. Both paddles rotate as one shape.",traverse});
  const desired=7.5/height,factor=round(Math.max(ramp.scaleRange[0],Math.min(ramp.scaleRange[1],desired))),target=[24,3];
  const centre=near(factor,1)?target:target.map((v,i)=>round((v-factor*base[i])/(1-factor)));
  const raw=!near(factor,1)?{factor,cx:centre[0],cy:centre[1]}:null;
  return state({objectId:ramp.id,type:"enlarge",name:"Enlargement",objective:"Make a ramp that reaches the paddle deck.",obstacle:"The wheel is horizontal, but the ramp must reach the axle-level approach at y = 10.5.",object:"Inspect the wedge height and its lower right corner.",spell:"An enlargement preserves the slope; every distance from the centre is multiplied by the scale factor.",fields:"Enter a positive scale factor and centre coordinates.",traverse},rampReady,
  "Current height = "+round(height)+". Required height = 7.5. Divide required by current height. B = "+point(base)+" should remain at or map to "+point(target)+".",
  raw?"Scale factor "+(near(desired,factor)?"= 7.5 ÷ "+round(height)+" = "+factor:"for this intermediate step = "+factor)+" about "+point(centre)+". Check that the ramp reaches the approach.":"The ramp has the target height. If its base is misaligned, Undo or Reset to restore a usable base.",raw);
 }
 if(room.id==="riverworks-18"){
  const orbit=get("orbit-walkway"),span=get("tower-span"),b=polygonBounds(span.vertices);
  const orbitReady=shapeFits(orbit.vertices,orbitTarget),spanReady=near(b.minY,7.5)&&b.minX<=18+1e-7&&b.maxX>=30-1e-7&&bearingStatus(room,span).every(Boolean);
  const traverse="Jump onto the approach span, walk towards the tower, then jump onto the orbiting walkway. Cross to the east quay and portal.";
  if(!orbitReady)return rotation(room,orbit,orbit.fixedCentre,v=>shapeFits(v,orbitTarget),{objective:"Bring the orbiting walkway around the tower.",obstacle:"The walkway is too high and on the wrong side. Its marked centre lies outside the shape. The rotation must clear the tower and both quays.",object:"Inspect the walkway and its external Centre reference. The dotted circle is a guide, not a platform.",traverse});
  const a=ref(span,"A"),target=[17,7.5],dx=round(target[0]-a[0]),dy=round(target[1]-a[1]);
  return state({objectId:span.id,type:"translate",name:"Translation",objective:"Connect the west quay to the tower.",obstacle:"The orbiting walkway provides the east crossing. The western channel still needs a supported span.",object:"Move the long approach span so both bearing ends rest on solid terrain.",spell:"Every vertex moves by the same signed vector.",fields:"Enter both components of the column vector.",traverse},spanReady,
  "A = "+point(a)+". One useful A′ = "+point(target)+". Subtract corresponding coordinates.",
  "Horizontal: 17 − ("+round(a[0])+") = "+dx+". Vertical: 7.5 − ("+round(a[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+").",{dx,dy});
 }
 return null;
}
