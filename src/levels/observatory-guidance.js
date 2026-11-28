import {polygonBounds} from "../geometry/world.js";
import {deliveryReady} from "../mechanisms/delivery.js";
import {shapeFits} from "../mechanisms/shape-sockets.js";
import {railMirrorValue} from "../mechanisms/movable-mirrors.js";
import {previewGeometry,parsePreviewRequest} from "../transformations/preview-math.js";
const near=(a,b)=>Math.abs(a-b)<1e-6,round=n=>Number(n.toFixed(8)),pt=(x,y)=>"("+round(x)+", "+round(y)+")";
const state=(phase,config,details={})=>({phase,config,ready:false,travel:false,reasoning:"",worked:"",raw:null,...details});
const ready=config=>state("traverse",config,{ready:true});
function covers(b,left,right){return b.minX<=left+1e-6&&b.maxX>=right-1e-6&&b.maxY-b.minY<1.1&&b.minY>=3&&b.maxY<=5.7;}
function mirrorStep(rail,object,target,config){
 const a=railMirrorValue(rail),m=round(target);
 if(!near(a,m)){
  const dx=round(m-a);
  return state("position-mirror",{...config,objectId:rail.id,type:"translate",name:"Translation",spell:"Move the vertical mirror horizontally. Its equation changes with the slider.",fields:"Enter a horizontal vector with vertical component zero."},{reasoning:"Corresponding x-coordinates have midpoint "+m+". The current mirror is x = "+a+". Subtract current from target.",worked:"Translate the mirror by vector "+pt(dx,0)+". The new equation is x = "+m+".",raw:{dx,dy:0}});
 }
 return state("reflect-linked",{...config,objectId:object.id,type:"reflect",name:"Reflection",spell:"The linked object reflects in the current mirror. Each x-coordinate maps to 2a − x; y is unchanged.",fields:"Enter the current vertical mirror line equation."},{reasoning:"The slider now marks x = "+a+". This is the perpendicular bisector of each point-image pair.",worked:"Reflect in x = "+a+". Compare the new coordinates with the crossing.",raw:{line:"x = "+a}});
}
export function observatorySituation(room,player=null){
 if(room.id==="observatory-31"){
  const rail=room.objects.find(o=>o.id==="star-mirror"),o=room.objects.find(o=>o.id==="star-deck"),b=polygonBounds(o.vertices);
  const config={objective:"Find a useful position for the mirror and its linked bridge.",obstacle:"The wide star channel needs a deck. The bridge can reflect only in the movable mirror.",object:"Read the bridge endpoints and the edges of the channel. Move the mirror slider so the reflected bridge covers the gap.",traverse:"Approach the channel, jump onto the reflected bridge and continue to the portal."};
  if(covers(b,22,34))return ready(config);
  return mirrorStep(rail,o,(b.minX+34)/2,config);
 }
 if(room.id==="observatory-32"){
  const rail=room.objects.find(o=>o.id==="orbit-mirror"),o=room.objects.find(o=>o.id==="orbit-socket"),beam=room.objects.find(v=>v.attachedTo===o.id),b=polygonBounds(beam.vertices),[cx,cy]=o.hinge,x=player?.x??room.spawn.x;
  const config={objective:"Reuse the attached star bridge across two gaps.",obstacle:"Two wide channels are separated by a small safe platform. You have one movable pivot assembly and one movable mirror.",object:"Move and rotate the assembly for the first crossing. Reach the star platform, then use the mirror to reflect the entire bridge and pivot to the second crossing.",traverse:"Jump onto the reflected bridge, cross the second channel and reach the portal."};
  if(covers(b,44,56))return ready(config);
  if(covers(b,22,34)){
   if(x<35||x>43||!player?.grounded)return state("first-star-crossing",{...config,traverse:"Jump onto the first bridge and cross to the safe star platform. Stop at its checkpoint before reflecting the assembly."},{travel:true});
   return mirrorStep(rail,o,(b.minX+56)/2,config);
  }
  if(!near(cx,22)||!near(cy,4)){
   const dx=round(22-cx),dy=round(4-cy);
   return state("move-star-pivot",{...config,objectId:o.id,type:"translate",name:"Translation",spell:"Translate the socket and its attached beam together, including their shared pivot.",fields:"Enter both components of the vector."},{reasoning:"Map H = "+pt(cx,cy)+" onto "+pt(22,4)+". Subtract coordinates.",worked:"Translate by vector "+pt(dx,dy)+".",raw:{dx,dy}});
  }
  for(const [angle,direction] of [[90,"clockwise"],[90,"anticlockwise"],[180,"clockwise"]]){
   const raw={angle,direction,cx,cy},image=polygonBounds(previewGeometry(beam,parsePreviewRequest("rotate",raw)).vertices);
   if(covers(image,22,34))return state("rotate-star-beam",{...config,objectId:beam.id,type:"rotate",name:"Rotation",spell:"Rotate only the attached beam about the current shared pivot.",fields:"Enter angle, direction and current centre."},{reasoning:"The pivot is now H = "+pt(cx,cy)+". Find the turn that makes the bridge horizontal across the first gap.",worked:"Rotate "+angle+"° "+direction+" about "+pt(cx,cy)+".",raw});
  }
  return state("recover-star",config,{reasoning:"The assembly is not aligned with the first crossing.",worked:"Undo or Reset to restore a known arrangement."});
 }
 if(room.id==="observatory-33"){
  const long=room.objects.find(o=>o.id==="long-star-deck"),short=room.objects.find(o=>o.id==="short-star-deck"),raised=room.objects.find(o=>o.id==="raised-star-beam"),lb=polygonBounds(long.vertices),sb=polygonBounds(short.vertices),rb=polygonBounds(raised.vertices),x=player?.x??room.spawn.x;
  const first=covers(sb,22,34),second=covers(sb,44,56)||covers(rb,44,56);
  const config={objective:"Choose your own bridge-building strategy.",obstacle:"Two wide channels are separated by an island. There is more than one valid route.",object:"Compare the long deck, the reusable short deck and the hinged span. A single long bridge is efficient; two separate spans or a reused deck also work.",traverse:"Jump onto the bridge, cross the available spans and reach the portal. On the separate spans, stop on the island and jump across the second gap."};
  if(covers(lb,22,56)||second&&(first||x>34.5))return ready(config);
  if(first&&!second){
   if(x<35||x>43||!player?.grounded)return state("island-first",{...config,traverse:"Cross the first bridge and stop on the safe island. Then reflect the short deck or turn the raised span."},{travel:true});
   const a=round((sb.minX+56)/2);
   return state("reuse-short",{...config,objectId:short.id,type:"reflect",name:"Reflection",spell:"A vertical mirror keeps the height and maps each x to twice the mirror coordinate minus x.",fields:"Enter the mirror line equation."},{reasoning:"The left edge of the bridge must become the right edge of the second crossing. Find the midpoint of "+round(sb.minX)+" and 56.",worked:"Reflect in x = "+a+". Alternatively rotate the raised span 90 degrees anticlockwise about (56, 5.4).",raw:{line:"x = "+a}});
  }
  if(second&&!first){
   const dx=round(22-sb.minX),dy=round(3-sb.minY);
   return state("first-short",{...config,objectId:short.id,type:"translate",name:"Translation",spell:"Translate the short deck to the first channel.",fields:"Enter both vector components."},{reasoning:"Map the lower-left corner to (22, 3).",worked:"Translate by vector "+pt(dx,dy)+".",raw:{dx,dy}});
  }
  const dx=round(22-lb.minX),dy=round(3-lb.minY);
  return state("long-bridge",{...config,objectId:long.id,type:"translate",name:"Translation",spell:"A translation moves every vertex by the same vector. The long deck can span both channels.",fields:"Enter both vector components."},{reasoning:"The two outer banks are 34 units apart. Map the lower-left corner of the long deck onto (22, 3).",worked:"Translate the long deck by vector "+pt(dx,dy)+". This is one efficient route; the shorter pieces permit other routes.",raw:{dx,dy}});
 }
 if(room.id==="observatory-34"){
  const o=room.objects.find(o=>o.id==="rescue-deck"),b=polygonBounds(o.vertices),crystal=room.objects.find(o=>o.id==="lost-crystal"),cb=polygonBounds(crystal.vertices),target=room.deliveries[0],tb=polygonBounds(target.vertices);
  const config={objective:"Restore the missing star and cross the channel.",obstacle:"The channel needs a bridge and the exit requires the crystal to fit its receiver.",object:"Move the rescue deck into the channel and reflect the asymmetric crystal into the receiver outline. Either objective can be done first.",traverse:"Both objectives are satisfied. Jump onto the rescue bridge, cross the channel and enter the portal."};
  if(!covers(b,22,34)){
   const dx=round(22-b.minX),dy=round(4-b.minY);
   return state("rescue-bridge",{...config,objectId:o.id,type:"translate",name:"Translation",spell:"Translate the rescue bridge without changing its size or orientation.",fields:"Enter both vector components."},{reasoning:"Map the lower-left corner onto (22, 4).",worked:"Translate by vector "+pt(dx,dy)+".",raw:{dx,dy}});
  }
  if(deliveryReady(room))return ready(config);
  const a=round((cb.minX+tb.maxX)/2),raw={line:"x = "+a};
  const c={...config,objectId:crystal.id,type:"reflect",name:"Reflection",spell:"Use corresponding vertices to find the perpendicular bisector. The asymmetric crystal must match the receiver, not only its bounding rectangle.",fields:"Enter the mirror line equation."};
  if(shapeFits(previewGeometry(crystal,parsePreviewRequest("reflect",raw)).vertices,target.vertices))return state("deliver-star",c,{reasoning:"The crystal's left edge must become the receiver's right edge. The mirror is their midpoint.",worked:"Reflect in x = ("+round(cb.minX)+" + "+round(tb.maxX)+") / 2 = "+a+". The portal will become available once the receiver is filled.",raw});
  return state("recover-crystal",c,{reasoning:"The crystal orientation does not match the intended reflection.",worked:"Undo to the original orientation, or Reset, and compare the corresponding vertices."});
 }
 return null;
}
