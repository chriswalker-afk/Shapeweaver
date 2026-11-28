import {polygonBounds} from "../geometry/world.js";
import {isBridgeDeck,ladderSegment} from "../mechanisms/transformable-ladders.js";
import {referencePoints,previewGeometry,parsePreviewRequest} from "../transformations/preview-math.js";
import {DOUBLE_SEAL_TARGET} from "./archives-finale.js";
const near=(a,b)=>Math.abs(a-b)<1e-7,round=n=>Number(n.toFixed(8)),point=p=>"("+p.map(round).join(", ")+")";
const ref=(o,id)=>referencePoints(o).find(p=>p.id===id).point;
const state=(phase,config,{ready=false,travel=false,reasoning="",worked="",raw=null}={})=>({phase,config,ready,travel,reasoning,worked,raw});
function translation(phase,o,target,config){
 const a=ref(o,"A"),dx=round(target[0]-a[0]),dy=round(target[1]-a[1]);
 return state(phase,{...config,objectId:o.id,type:"translate",name:"Translation",spell:"A translation adds the same signed vector to every vertex and moves any pivot by that same vector.",fields:"Enter both components of the column vector."},{
 reasoning:"Current A = "+point(a)+". A useful image A′ = "+point(target)+". Subtract original coordinates from image coordinates. Check the entire travel path, including your position.",
 worked:"Horizontal: "+target[0]+" − ("+round(a[0])+") = "+dx+". Vertical: "+target[1]+" − ("+round(a[1])+") = "+dy+". Enter column vector ("+dx+", "+dy+").",raw:{dx,dy}});
}
const travel=(phase,config)=>state(phase,config,{travel:true});
const finish=(phase,config)=>state(phase,config,{ready:true});
const playerAt=(p,x1,x2,y)=>Boolean(p&&p.x>=x1-.28&&p.x<=x2+.28&&Math.abs(p.y-y)<.09&&p.grounded);
function rotation(phase,o,direction,config){
 const h=o.hinge,raw={angle:90,direction,cx:h[0],cy:h[1]};
 return state(phase,{...config,objectId:o.id,type:"rotate",name:"Rotation",spell:"Rotate about the marked pivot in its current position. Horizontal deck geometry becomes an upright climbable ladder.",fields:"Enter angle, direction and both centre coordinates."},{
 reasoning:"H = "+point(h)+". A = "+point(ref(o,"A"))+". Compare the long edge with the required direction and choose a clear quarter-turn.",
 worked:"Rotate 90° "+direction+" about "+point(h)+". The pivot remains fixed.",raw});
}
// Compare corresponding vertices up to a translation. The target outlines do
// not move or rotate automatically; the hint supplies parameters only.
function orientOrTranslate(phase,o,target,config){
 const matches=vs=>vs.length===target.length&&vs.every((v,i)=>near(v[0]-vs[0][0],target[i][0]-target[0][0])&&near(v[1]-vs[0][1],target[i][1]-target[0][1]));
 if(matches(o.vertices))return translation(phase+"-translate",o,target[0],config);
 for(const [angle,direction] of [[90,"clockwise"],[90,"anticlockwise"],[180,"clockwise"]]){
  const [cx,cy]=o.hinge,raw={angle,direction,cx,cy};
  if(!matches(previewGeometry(o,parsePreviewRequest("rotate",raw)).vertices))continue;
  return state(phase+"-rotate",{...config,objectId:o.id,type:"rotate",name:"Rotation",spell:"Rotate the entire rigid shape about its marked pivot. Every vertex turns through the same angle.",fields:"Enter angle, direction and the current centre coordinates."},{
   reasoning:"Compare the direction of the connected edges with the target. The marked pivot is "+point(o.hinge)+".",
   worked:"Rotate "+angle+"° "+direction+" about "+point(o.hinge)+". Then compare the image with the target.",raw});
 }
 return state(phase+"-recover",config,{reasoning:"The current orientation is not the intended one.",worked:"Undo or Reset to restore a known arrangement."});
}
export function archivesSituation(room,p=null){
 if(room.id==="archives-19"){
  const o=room.objects.find(o=>o.id==="archive-crate"),b=polygonBounds(o.vertices);
  const first=near(b.minY,3)&&b.minX<=18+1e-7&&b.maxX>=25-1e-7&&b.maxX<=26+1e-7;
  const second=near(b.minY,3)&&b.minX<=42+1e-7&&b.maxX>=49-1e-7&&b.maxX<=50+1e-7;
  const firstConfig={objective:"Use the chest to cross the first channel.",obstacle:"One jump cannot reach the reading island. The chest can extend the reachable edge.",object:"Move the chest towards the west bank edge. Keep some of its base supported.",traverse:"Jump onto the chest, walk near its far edge, then jump onto the raised reading balcony. Stop on the checkpoint before moving the chest again."};
  const secondConfig={objective:"Bring the chest to the second channel.",obstacle:"You are beyond the first channel. The same chest can extend the reading island towards the east archive.",object:"Reuse the chest. Move it underneath the balcony to the second channel while standing safely above its path.",traverse:"From the balcony, jump onto the repositioned chest, move near its far edge and jump to the east archive. Walk to the portal."};
  const crossed=Boolean(p&&p.x>=29.7),safe=playerAt(p,30,38,6.5);
  if(p?.x>=54&&p.y>=4.4)return finish("exit",secondConfig);
  if(!crossed)return first?travel("first-traverse",firstConfig):translation("first-cast",o,[17,3],firstConfig);
  if(second)return finish("second-traverse",secondConfig);
  if(!safe)return travel("seek-refuge",{...secondConfig,traverse:p?.checkpoint==="reading-refuge"?"Return to the visited reading checkpoint to get clear of the chest's path.":"Reach the raised reading balcony before moving the chest. If you missed it, Return to safety and try the first crossing again."});
  return translation("second-cast",o,[41,3],secondConfig);
 }
 if(room.id==="archives-20"){
  const o=room.objects.find(o=>o.id==="archive-ladder"),b=polygonBounds(o.vertices),seg=ladderSegment(o),horizontal=isBridgeDeck(o);
  const first=horizontal&&near(b.minY,3)&&b.minX<=18+1e-7&&b.maxX>=30.9&&b.maxX<=32;
  const second=horizontal&&near(b.minX,39)&&near(b.minY,3)&&near(o.hinge[0],53);
  const climbReady=seg&&near(seg.bottom,3)&&near(seg.x,53.3)&&seg.top>=15;
  const firstConfig={objective:"Make a solid crossing to the catalogue.",obstacle:"The library channel is wider than a jump. The travelling ladder is solid when horizontal.",object:"Use the long ladder as a bridge first. Its hinge travels with it.",traverse:"Jump onto the horizontal ladder, cross to its far end, then jump onto the safe catalogue balcony. Stop at the checkpoint."};
  const secondConfig={objective:"Reuse the ladder at the high catalogue wall.",obstacle:"The wall is too high to jump. Bring the same ladder across the library to its base.",object:"Move the horizontal ladder along the lower floor while standing safely on the balcony.",traverse:"Walk off the balcony and approach the upright ladder. Hold Up / W (or the climb button) to climb, then jump right onto the upper library and reach the portal."};
  const crossed=Boolean(p&&p.x>=30.4),safe=playerAt(p,34,38,5.5);
  if(p?.x>=54&&p.y>=14.9)return finish("exit",secondConfig);
  if(!crossed&&first)return travel("first-traverse",firstConfig);
  if(crossed&&climbReady)return finish("climb",secondConfig);
  if(!horizontal){
   const a=ref(o,"A"),h=o.hinge;
   if(Math.abs(a[1]-h[1])>1e-7)return rotation("recover-orientation",o,a[1]>h[1]?"anticlockwise":"clockwise",{...firstConfig,objective:"Return the ladder to a horizontal deck."});
   return state("recover-orientation",{...firstConfig,objectId:o.id,type:"rotate",name:"Rotation",spell:"A quarter-turn changes the ladder's orientation.",fields:"Use the current marked pivot."},{reasoning:"Check the pivot and the direction of the long edge.",worked:"Undo or Reset to recover a horizontal bridge."});
  }
  if(!near(o.hinge[0],b.maxX)||!near(o.hinge[1],b.minY))return state("recover-pivot",{...firstConfig,objectId:o.id,type:"rotate",name:"Rotation",spell:"The pivot travels with the shape.",fields:"Use the current pivot coordinates."},{reasoning:"The worked route needs the pivot at the lower right end.",worked:"Undo or Reset to restore that orientation, or find another clear rotation."});
  if(!crossed)return translation("first-cast",o,[17,3],firstConfig);
  if(second)return rotation("rotate",o,"clockwise",secondConfig);
  if(!safe)return travel("seek-refuge",{...secondConfig,traverse:p?.checkpoint==="catalogue-refuge"?"Return to the visited balcony to get clear of the ladder's path.":"Reach the catalogue balcony so the ladder can travel below you."});
  return translation("second-cast",o,[39,3],secondConfig);
 }
 if(room.id==="archives-21"||room.id==="archives-22"){
  const latch=room.plates.find(p=>p.latch),gate=room.objects.find(o=>o.id===(room.id==="archives-21"?"hold-gate":"exit-gate"));
  const config={objective:"Open both doors and reach the portal.",obstacle:"Two doors block the corridor. A latch stays open after its weight is removed; a locking recess captures its key.",object:"Follow the links from the mechanisms to the doors. Reserve the only key for the exit, not the spare alcove.",traverse:"Walk right through both open doors to the portal."};
  if(latch.latched&&gate.open)return finish("exit",config);
  if(room.shapeSockets?.some(s=>s.id==="alcove-lock"&&s.filled))return travel("recover-lock",{...config,traverse:"The only key is captured in the spare alcove. Undo the locking cast or Reset to recover it."});
  if(!latch.latched)return translation("latch",room.objects.find(o=>o.id===(room.id==="archives-21"?"latch-weight":"passage-weight")),[10,8],config);
  return room.id==="archives-21"?translation("hold",room.objects.find(o=>o.id==="latch-weight"),[18,8],config):translation("lock",room.objects.find(o=>o.id==="passage-key"),[18,10],config);
 }
 if(room.id==="archives-23"){
  const o=room.objects.find(o=>o.id==="double-seal"),g=room.objects.find(o=>o.id==="double-gate");
  const config={objective:"Align both connected seals.",obstacle:"Two plates control the same gate. A raised pin obstructs the flat side of the brass assembly.",object:"The two feet are joined. Rotate the complete shape until both feet point down, then align them with the plates around the pin.",traverse:"Walk through the opened double seal gate to the portal."};
  return g.open?finish("exit",config):orientOrTranslate("seal",o,DOUBLE_SEAL_TARGET,config);
 }
 if(room.id==="archives-24"){
  const o=room.objects.find(o=>o.id==="chain-comb"),k=room.objects.find(o=>o.id==="chain-key"),g=room.objects.find(o=>o.id==="chain-gate"),slot=room.shapeSockets.find(s=>s.id==="chain-recess");
  const config={objective:"Solve the linked archive machinery.",obstacle:"Two plates open the transit gate. The final gate requires both the third plate and the fitted key.",object:"Move the joined triple seal so all three feet hold plates. Then orient the key and move it through the open transit gate. Keep the triple seal in place.",traverse:"Walk through both gates and reach the portal."};
  if(g.open&&room.objects.find(o=>o.id==="transit-gate").open)return finish("exit",config);
  if(!room.plates.every(p=>p.pressed))return translation("chain-plates",o,[12,8],config);
  return orientOrTranslate("chain-key",k,slot.vertices,config);
 }
 return null;
}
