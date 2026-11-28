import {polygonBounds} from "../geometry/world.js";
import {shapeFits} from "../mechanisms/shape-sockets.js";
import {deliveryReady} from "../mechanisms/delivery.js";
import {previewGeometry,parsePreviewRequest} from "../transformations/preview-math.js";
const near=(a,b)=>Math.abs(a-b)<1e-6,round=n=>Number(n.toFixed(8)),pt=(x,y)=>"("+round(x)+", "+round(y)+")";
const state=(phase,config,details={})=>({phase,config,ready:false,travel:false,reasoning:"",worked:"",raw:null,...details});
const ready=config=>state("traverse",config,{ready:true});
const travel=(config,text)=>state("safe-crossing",{...config,traverse:text},{travel:true});
const bounds=o=>polygonBounds(o.vertices);
const covers=(b,l,r)=>b.minX<=l+1e-6&&b.maxX>=r-1e-6&&b.maxY-b.minY<1.1&&b.minY>=3-1e-6&&b.maxY<=5.7;
function shift(o,x,y,c){
 const b=bounds(o),dx=round(x-b.minX),dy=round(y-b.minY);
 return state("translate-"+o.id,{...c,objectId:o.id,type:"translate",name:"Translation",spell:"Translate every vertex by the same signed column vector.",fields:"Enter both vector components."},{reasoning:"Map the lower-left corner of the bounding rectangle from "+pt(b.minX,b.minY)+" to "+pt(x,y)+". Subtract original coordinates.",worked:"Translate by vector "+pt(dx,dy)+".",raw:{dx,dy}});
}
function reflect(o,a,c,text){
 a=round(a);
 return state("reflect-"+o.id,{...c,objectId:o.id,type:"reflect",name:"Reflection",spell:"A vertical mirror is the perpendicular bisector of corresponding points. Map x to 2a − x and keep y unchanged.",fields:"Enter the vertical mirror line equation."},{reasoning:text,worked:"Reflect in x = "+a+".",raw:{line:"x = "+a}});
}
function rotate(o,condition,c){
 const [cx,cy]=o.hinge;
 for(const [angle,direction] of [[90,"anticlockwise"],[90,"clockwise"],[180,"clockwise"]]){
  const raw={angle,direction,cx,cy},b=bounds({vertices:previewGeometry(o,parsePreviewRequest("rotate",raw)).vertices});
  if(condition(b))return state("rotate-"+o.id,{...c,objectId:o.id,type:"rotate",name:"Rotation",spell:"Rotate about the marked fixed hinge, keeping the distance of each vertex from the hinge unchanged.",fields:"Enter angle, direction and both centre coordinates."},{reasoning:"The hinge is "+pt(cx,cy)+". Find the turn that clears the route.",worked:"Rotate "+angle+"° "+direction+" about "+pt(cx,cy)+".",raw});
 }
 return state("recover-"+o.id,c,{reasoning:"No intended turn from the current orientation was found.",worked:"Undo or Reset to recover a known arrangement."});
}
function matchReceiver(o,target,c){
 const b=bounds(o),t=bounds(target),a=round((b.minX+t.maxX)/2),raw={line:"x = "+a};
 if(shapeFits(previewGeometry(o,parsePreviewRequest("reflect",raw)).vertices,target.vertices))return reflect(o,a,c,"The original left edge x = "+round(b.minX)+" maps to the receiver's right edge x = "+round(t.maxX)+". Find their midpoint and check corresponding vertices.");
 return state("recover-receiver",c,{reasoning:"Compare the orientation and corresponding vertices.",worked:"Undo or Reset to recover the intended arrangement."});
}
export function finaleSituation(room,p=null){
 const by=id=>room.objects.find(o=>o.id===id),x=p?.x??room.spawn.x;
 const onIsland=x>=35&&x<=43&&p?.grounded;
 if(room.id==="observatory-35"){
  const fork=by("machine-fork"),deck=by("machine-deck"),key=by("machine-key"),b=bounds(deck);
  const inlet=by("machine-inlet"),outlet=by("machine-outlet"),lock=by("machine-lock"),slot=room.shapeSockets[0],first=covers(b,22,34),second=covers(b,44,56);
  const c={objective:"Coordinate all the machine's mechanisms and reuse the same deck.",obstacle:"The selector opens the inlet or the outlet, never both. A separate seal plate and a shape key control the final gate, and two channels share one deck.",object:"Release the selector, build the first crossing, reach the island, reuse the deck, restore the two-foot weight and fit the key.",traverse:"Cross the second bridge and pass the two open exit gates to the portal."};
  if(second&&outlet.open&&lock.open)return ready(c);
  if(x<19.5&&!inlet.open)return shift(fork,8,8,c);
  if(!first&&!second&&x<35)return shift(deck,22,4,c);
  if(first&&!second){
   if(!onIsland)return travel(c,"Jump onto the first deck and stop at the machine island checkpoint before reusing it.");
   return reflect(deck,(b.minX+56)/2,c,"The left edge of the deck must become the right edge of the second channel. Find the midpoint of their x-coordinates.");
  }
  if(second){
   if(!outlet.open||!room.plates.find(v=>v.id==="machine-seal").pressed)return shift(fork,4,8,c);
   if(!slot.filled)return matchReceiver(key,slot,c);
   if(lock.open)return ready(c);
  }
  return state("recover-machine",c,{reasoning:"The current arrangement does not align with a known crossing.",worked:"Undo or Reset and compare the geometry of the deck and selector."});
 }
 if(room.id==="observatory-36"){
  const deck=by("ascent-deck"),spare=by("ascent-spare"),gate=by("ascent-gate"),wedge=by("ascent-wedge"),crystal=by("ascent-crystal");
  const b=bounds(deck),sb=bounds(spare),gb=bounds(gate),wb=bounds(wedge),first=covers(b,22,34),second=covers(b,44,56)||covers(sb,44,56),clear=gb.minY>=9-1e-6&&gb.maxY-gb.minY<1;
  const ramp=near(wb.maxX,80)&&near(wb.maxY,12)&&near(wb.minY,3);
  const c={objective:"Combine all four transformations to reach the summit with its star restored.",obstacle:"Two channels, a hinged gate, a high summit and an undelivered crystal separate the apprentice from the exit.",object:"Choose a reusable deck or two independent spans. Clear the summit gate, scale the ramp and reflect the star into the receiver.",traverse:"Cross the remaining span, walk beneath the opened gate and up the ramp to the summit portal."};
  if(second&&clear&&ramp&&deliveryReady(room))return ready(c);
  if(!first&&!second&&x<35)return shift(deck,22,3,c);
  if(first&&!second){
   if(!onIsland)return travel(c,"Cross the first deck and stop on the safe island. Reuse the deck by reflection or rotate the separate raised span.");
   return reflect(deck,(b.minX+56)/2,c,"The second crossing ends at x = 56. Find the midpoint of 56 and the current left edge; alternatively turn the raised span about its hinge.");
  }
  if(second&&x>=35){
   if(!clear)return rotate(gate,b=>b.minY>=9-1e-6&&b.maxY-b.minY<1,c);
   if(!ramp){
    const factor=round(9/(wb.maxY-wb.minY));
    if(near(wb.maxX,80)&&near(wb.minY,3)&&!near(factor,1)){
     return state("enlarge-summit",{...c,objectId:wedge.id,type:"enlarge",name:"Enlargement",spell:"Multiply corresponding lengths by the same scale factor. Keep the ramp's lower-right corner fixed.",fields:"Enter the scale factor and centre."},{reasoning:"The summit rises 9 units above the bank. The current ramp rises "+round(wb.maxY-wb.minY)+" units. Divide target height by current height.",worked:"Enlarge by scale factor "+factor+" about (80, 3).",raw:{factor,cx:80,cy:3}});
    }
    return state("recover-ramp",c,{reasoning:"The base must stay aligned with the summit.",worked:"Undo or Reset to restore the intended ramp."});
   }
   if(!deliveryReady(room))return matchReceiver(crystal,room.deliveries[0],c);
   return ready(c);
  }
  if(second&&!first&&x<35)return shift(deck,22,3,c);
  if(first&&second&&x<35)return travel(c,"Cross the first deck and reach the island before completing the summit mechanisms.");
  return state("recover-ascent",c,{reasoning:"The current crossings do not form a known route.",worked:"Undo or Reset, and inspect the available spans."});
 }
 return null;
}
