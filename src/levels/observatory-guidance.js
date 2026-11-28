import {polygonBounds} from "../geometry/world.js";
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
 return null;
}
