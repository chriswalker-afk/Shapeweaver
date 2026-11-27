import {polygonBounds} from "../geometry/world.js";
import {platePressed,plateGroups} from "../mechanisms/pressure-plates.js";
import {bearingStatus} from "../mechanisms/structural-bearings.js";
import {shapeFits} from "../mechanisms/shape-sockets.js";
import {referencePoints,previewGeometry,parsePreviewRequest} from "../transformations/preview-math.js";
const near=(a,b)=>Math.abs(a-b)<1e-7,round=n=>Number(n.toFixed(8)),point=p=>"("+p.map(round).join(", ")+")";
const ref=(o,id)=>referencePoints(o).find(p=>p.id===id).point;
const state=(config,ready,reasoning,worked,raw)=>({config,ready,reasoning,worked,raw});
const target=[[9,3],[22,3],[22,4.5],[19,4.5],[19,3.5],[9,3.5]];
function translation(o,dest,config,ready=false){
 const a=ref(o,"A"),dx=round(dest[0]-a[0]),dy=round(dest[1]-a[1]);
 return state({...config,objectId:o.id,type:"translate",name:"Translation",spell:"A translation adds the same signed vector to every point.",fields:"Enter both components of the column vector."},ready,
 "A = "+point(a)+". One useful image A′ = "+point(dest)+". Subtract the corresponding coordinates.",
 "Horizontal: "+dest[0]+" − ("+round(a[0])+") = "+dx+". Vertical: "+dest[1]+" − ("+round(a[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+").",{dx,dy});
}
export function riverworksMechanismSituation(room){
 const get=id=>room.objects.find(o=>o.id===id);
 if(room.id==="riverworks-15"){
  const barrel=get("sluice-barrel"),crate=get("sluice-crate"),group=plateGroups(room)[0],plates=group.plates;
  const held=o=>plates.some(p=>platePressed({...room,objects:[o]},p));
  const ready=group.held===group.total&&get("sluice-gate").open,plate=plates.find(p=>!p.pressed)??plates[1];
  const traverse="Jump over each counterweight without moving it off its plate, walk through the open sluice gate and reach the portal.";
  const config={objective:"Hold both linked pressure plates at the same time.",obstacle:group.held+"/"+group.total+" plates are held. The sluice gate needs all its linked plates held simultaneously.",traverse};
  if(!held(barrel)&&!ready){
   const b=polygonBounds(barrel.vertices),a=ref(barrel,"A"),destCentre=plate.x+plate.width/2,m=round(((b.minX+b.maxX)/2+destCentre)/2),image=[round(2*m-a[0]),a[1]],aligned=near(b.minY,plate.y)&&near(b.maxX-b.minX,3)&&near(b.maxY-b.minY,1.5);
   return state({...config,objectId:barrel.id,type:"reflect",name:"Reflection",object:"Use the stored counterweight. Reflection can move it out of the sealed store without passing through its wall.",spell:"A vertical mirror keeps y unchanged. The line is halfway between corresponding x-coordinates.",fields:"Enter x = a, using the midpoint of the original and intended image coordinates."},false,
    aligned?"Compare A "+point(a)+" and A′ "+point(image)+". The weight should cover the free plate at x = "+plate.x+" to "+(plate.x+plate.width)+".":"The counterweight is no longer floor-aligned with its original orientation. Recover its usable orientation before trying to hold a plate.",
    aligned?"Reflect in x = "+m+". The x-coordinates "+round(a[0])+" and "+image[0]+" have midpoint "+m+".":"Undo or reset to a floor-aligned counterweight.",aligned?{line:"x = "+m}:null);
  }
  const b=polygonBounds(crate.vertices),a=ref(crate,"A"),dest=[round(plate.x+a[0]-b.minX),round(plate.y+a[1]-b.minY)];
  return translation(crate,dest,{...config,object:"The sliding counterweight can move along the floor to the remaining plate."},ready);
 }
 if(room.id==="riverworks-16"){
  const bracket=get("diagonal-bracket"),beam=get("dock-span"),b=polygonBounds(beam.vertices);
  const bracketReady=shapeFits(bracket.vertices,target),beamReady=near(b.minY,4.5)&&b.minX<=24+1e-7&&b.maxX>=32-1e-7&&bearingStatus(room,beam).every(Boolean);
  const traverse="Jump onto the first dock piece, walk towards its raised end, then jump onto the upper span. Cross to the east dock and reach the portal.";
  if(!bracketReady){
   const a=ref(bracket,"A"),e=ref(bracket,"E"),targetA=[9,3],targetE=[22,4.5];
   const lines=["y = x","y = -x","x = "+round((a[0]+targetA[0])/2),"y = "+round((a[1]+targetA[1])/2)];
   const line=lines.find(line=>shapeFits(previewGeometry(bracket,parsePreviewRequest("reflect",{line})).vertices,target));
   const relation=line==="y = x"?"Swapping x and y sends (x, y) to (y, x).":line==="y = -x"?"Reflecting in y = −x sends (x, y) to (−y, −x).":"Compare corresponding vertices. Each joining segment must be perpendicular to and bisected by the mirror line.";
   return state({objectId:bracket.id,type:"reflect",name:"Reflection",objective:"Connect the first two docks and create a raised bearing surface.",obstacle:"The vertical L-shaped piece needs to become a horizontal crossing with its raised end towards the middle dock.",object:"Inspect the concave dock piece on its storage shelf. Compare corresponding corners of the useful horizontal shape.",spell:"A reflection preserves lengths and angles but reverses orientation. A diagonal mirror can interchange the horizontal and vertical directions.",fields:"Choose a mirror-line equation. The diagonal lines y = x and y = −x are available.",traverse},false,
    "A = "+point(a)+" needs to reach "+point(targetA)+"; E = "+point(e)+" needs to reach "+point(targetE)+". "+relation,
    line?"Reflect in "+line+". The full image matches the first crossing, including the raised end.":"No single permitted reflection fits the intended outline from this arrangement. Undo or reset to the stored piece, or try a corrective reflection.",line?{line}:null);
  }
  return translation(beam,[21,4.5],{objective:"Connect the raised dock bracket to the east dock.",obstacle:"The L-shaped piece now provides a raised support. The upper span needs to bridge the second channel with both ends supported.",object:"Move the long upper span from the east dock towards the raised end of the reflected piece.",traverse},beamReady);
 }
 return null;
}
