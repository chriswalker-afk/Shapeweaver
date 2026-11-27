import {polygonBounds} from "../geometry/world.js";
export const MUSHROOM_JUMP_SPEED=17.5;
/** Only the real horizontal top of a mushroom is a spring surface. */
export function onMushroomCap(room,player){
 return room.objects.some(o=>{
  if(o.kind!=="mushroom"||o.decorative)return false;
  const b=polygonBounds(o.vertices);
  return Math.abs(player.y-b.maxY)<.035&&o.vertices.some((a,i)=>{
   const c=o.vertices[(i+1)%o.vertices.length];
   return Math.abs(a[1]-b.maxY)<1e-7&&Math.abs(c[1]-b.maxY)<1e-7&&player.x+.33>Math.min(a[0],c[0])+1e-7&&player.x-.33<Math.max(a[0],c[0])-1e-7;
  });
 });
}
