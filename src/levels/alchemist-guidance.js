import {polygonBounds} from "../geometry/world.js";
import {previewGeometry,parsePreviewRequest} from "../transformations/preview-math.js";
const near=(a,b)=>Math.abs(a-b)<1e-6,round=n=>Number(n.toFixed(8)),pt=(x,y)=>"("+round(x)+", "+round(y)+")";
const state=(phase,config,details={})=>({phase,config,ready:false,travel:false,reasoning:"",worked:"",raw:null,...details});
const ready=(config)=>state("traverse",config,{ready:true});
function resize(phase,o,b,target,config){
 const factor=target.w/(b.maxX-b.minX);
 const c={...config,objectId:o.id,type:"enlarge",name:"Enlargement",spell:"A positive scale factor smaller than 1 reduces every length. A factor greater than 1 increases every length. The centre remains fixed.",fields:"Enter the scale factor (a fraction is allowed) and centre coordinates."};
 if(near(factor,1))return state("recover",c,{reasoning:"The current size is correct, but the position is not.",worked:"Undo or Reset to restore the example. An enlargement of factor 1 cannot move the shape."});
 const cx=round((target.x-factor*b.minX)/(1-factor)),cy=round((target.y-factor*b.minY)/(1-factor)),k=round(factor);
 const shown=near(k,.5)?"1/2":String(k);
 return state(phase,c,{
 reasoning:"Compare the required width with the current width. Use A′ = C + k(A − C), or extend the lines through corresponding corners to locate C. All sides scale by the same factor.",
 worked:"Width ratio = "+target.w+" / "+round(b.maxX-b.minX)+" = "+shown+". The lower-left corner moves from "+pt(b.minX,b.minY)+" to "+pt(target.x,target.y)+". Use centre "+pt(cx,cy)+" and scale factor "+shown+".",raw:{factor:k,cx,cy}});
}
function shift(o,b,target,config){
 const dx=round(target.x-b.minX),dy=round(target.y-b.minY);
 return state("translate-small",{...config,objectId:o.id,type:"translate",name:"Translation",spell:"Translate each vertex by the same vector; the reduced bridge keeps its size.",fields:"Enter the signed horizontal and vertical components."},{
 reasoning:"Subtract the present lower-left coordinates from the intended image coordinates. Check the whole passage, not just the endpoints.",
 worked:"Move "+pt(b.minX,b.minY)+" to "+pt(target.x,target.y)+". Column vector "+pt(dx,dy)+".",raw:{dx,dy}});
}
export function alchemistSituation(room){
 if(room.id==="alchemist-25"){
  const o=room.objects.find(o=>o.id==="oversized-block"),b=polygonBounds(o.vertices);
  const config={objective:"Split the rise into two manageable jumps using an enlargement.",obstacle:"The original block is too tall to jump onto. Split the total rise into two manageable jumps.",object:"Make the block half its original height and width, keeping its right-hand base corner against the workbench.",traverse:"Move right, jump onto the smaller block, then jump again onto the raised workbench and reach the portal."};
  if(near(b.minX,15)&&near(b.maxX,20)&&near(b.minY,3)&&near(b.maxY,5.2))return ready(config);
  return resize("reduce-step",o,b,{x:15,y:3,w:5},config);
 }
 if(room.id==="alchemist-26"){
  const o=room.objects.find(o=>o.id==="resizable-bridge"),b=polygonBounds(o.vertices),w=b.maxX-b.minX;
  const config={objective:"Cross the alchemist's channel.",obstacle:"A thick wall has a narrow 1.6-unit opening. The full-size bridge is 3 units thick, but the river is too wide to jump.",object:"Reduce the bridge before moving it through the opening, then grow it in the far bay to span the channel.",traverse:"Walk under the workshop wall, jump onto the bridge, cross it and continue to the portal."};
  if(near(b.minX,28)&&near(b.maxX,40)&&near(b.minY,2.5)&&near(b.maxY,5.5))return ready(config);
  if(near(w,6)){
   if(near(b.minX,31)&&near(b.minY,11))return resize("grow-bridge",o,b,{x:28,y:2.5,w:12},config);
   return shift(o,b,{x:31,y:11},config);
  }
  if(b.minX>=24-1e-6)return resize("grow-bridge",o,b,{x:28,y:2.5,w:12},config);
  return resize("shrink-bridge",o,b,{x:4,y:11,w:6},config);
 }
 if(room.id==="alchemist-27"||room.id==="alchemist-28"){
  const mirror=room.id==="alchemist-28",o=room.objects.find(o=>o.kind==="pivot-carrier"),beam=room.objects.find(v=>v.attachedTo===o.id),b=polygonBounds(beam.vertices),target=mirror?24:22,far=mirror?37:34;
  const config={objective:"Make a continuous deck by moving a socket and rotating its beam.",obstacle:"The channel is wider than a jump. The beam is attached to a movable socket.",object:"Move the socket to the near edge. The beam and its hinge move with it. Select the beam separately for rotation.",traverse:"Approach the channel, jump onto the horizontal beam, cross and walk to the portal."};
  if(b.minX<=target+1e-6&&b.maxX>=far-1e-6&&b.maxY-b.minY<1&&b.maxY>=3&&b.maxY<=5.7)return ready(config);
  const [cx,cy]=o.hinge;
  if(!near(cx,target)||!near(cy,4)){
   if(mirror){
    const c={...config,objectId:o.id,type:"reflect",name:"Reflection",spell:"A vertical mirror maps x to 2a − x and leaves y unchanged. The attached beam and pivot are reflected together.",fields:"Enter the vertical mirror line equation."};
    if(!near(cy,4))return state("recover-pivot",c,{reasoning:"The pivot needs the same height as the channel edge.",worked:"Undo or Reset to recover the original mechanism."});
    const a=round((cx+target)/2);
    return state("reflect-socket",c,{reasoning:"The current pivot is "+pt(cx,cy)+". The target is "+pt(target,4)+". Find their horizontal midpoint.",worked:"Mirror line x = ("+round(cx)+" + "+target+") / 2 = "+a+". The hinge image is "+pt(target,4)+".",raw:{line:"x = "+a}});
   }
   const dx=round(target-cx),dy=round(4-cy);
   return state("translate-socket",{...config,objectId:o.id,type:"translate",name:"Translation",spell:"The same signed vector moves both the socket and every point of its attached beam.",fields:"Enter both components of the column vector."},{reasoning:"The current pivot is "+pt(cx,cy)+". Target pivot "+pt(target,4)+". Subtract current from target.",worked:"Column vector "+pt(dx,dy)+". The pivot and attached beam move together.",raw:{dx,dy}});
  }
  const c={...config,objectId:beam.id,type:"rotate",name:"Rotation",spell:"Turn the beam about the current shared pivot. The socket stays in place.",fields:"Enter the angle, direction and the new centre coordinates."};
  for(const [angle,direction] of [[90,"clockwise"],[90,"anticlockwise"],[180,"clockwise"]]){
   const raw={angle,direction,cx,cy},image=polygonBounds(previewGeometry(beam,parsePreviewRequest("rotate",raw)).vertices);
   if(image.minX<=target+1e-6&&image.maxX>=far-1e-6&&image.maxY-image.minY<1&&image.maxY>=3&&image.maxY<=5.7)return state("rotate-attached",c,{reasoning:"Use the current pivot H = "+pt(cx,cy)+". Compare the beam's long edge with the required horizontal deck.",worked:"Rotate "+angle+"° "+direction+" about "+pt(cx,cy)+". The socket stays fixed during this cast.",raw});
  }
  return state("recover-pivot",c,{reasoning:"The beam is not aligned with the crossing.",worked:"Undo or Reset to restore the intended arrangement."});
 }
 return null;
}
