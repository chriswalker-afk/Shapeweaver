/** Screen-space label placement: exact anchor stays put, text may move.
 * Prefer non-overlapping visible labels. On very crowded views, omit only a
 * label for which no non-overlapping position fits; inspect zoom reveals it. */
export function layoutWorldLabels(labels,rect,measure){
 const out=[],occupied=[],clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 for(const label of labels){
  const {x,y,text}=label,w=measure(text)+8,h=16;
  if(w>rect.right-rect.left||h>rect.bottom-rect.top||x<rect.left-28||x>rect.right+28||y<rect.top-28||y>rect.bottom+28)continue;
  let best=null;
  for(const dy of [0,-17,17,-34,34,-51,51]){
   const cx=clamp(x,rect.left+w/2,rect.right-w/2),cy=clamp(y+dy,rect.top+h/2,rect.bottom-h/2);
   const b={left:cx-w/2,right:cx+w/2,top:cy-h/2,bottom:cy+h/2};
   if(occupied.some(o=>b.left<o.right+2&&b.right>o.left-2&&b.top<o.bottom+2&&b.bottom>o.top-2))continue;
   const distance=Math.hypot(cx-x,cy-y);
   if(!best||distance<best.distance)best={...b,cx,cy,distance};
  }
  if(best){occupied.push(best);out.push({...label,...best});}
 }
 return out;
}
