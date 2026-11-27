import {polygonBounds} from "../geometry/world.js";
export const EPS=1e-7;
export const PLAYER_SIZE=Object.freeze({width:.66,height:1.55});
export function playerBox(p){
  return {minX:p.x-PLAYER_SIZE.width/2,maxX:p.x+PLAYER_SIZE.width/2,minY:p.y,maxY:p.y+PLAYER_SIZE.height};
}
function overlap(a,b){
  return a.minX<b.maxX-EPS&&a.maxX>b.minX+EPS&&a.minY<b.maxY-EPS&&a.maxY>b.minY+EPS;
}
/** Clip a simple CCW polygon against the four sides of an AABB.
 * A positive intersection area means interior overlap; mere boundary contact is legal.
 * Concave polygons are supported: connecting segments on a clip edge contribute no extra area. */
export function polygonIntersectsBox(vertices,box,bounds=polygonBounds(vertices)){
  if(!overlap(bounds,box))return false;
  // Translate to box-local coordinates for stable area calculation.
  let points=vertices.map(([x,y])=>[x-box.minX,y-box.minY]);
  const w=box.maxX-box.minX,h=box.maxY-box.minY;
  for(const [axis,limit,sign] of [[0,0,1],[0,w,-1],[1,0,1],[1,h,-1]]){
    if(!points.length)return false;
    const result=[];
    let a=points[points.length-1],insideA=sign*(a[axis]-limit)>=0;
    for(const b of points){
      const insideB=sign*(b[axis]-limit)>=0;
      if(insideA!==insideB){
        const t=(limit-a[axis])/(b[axis]-a[axis]);
        const p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];p[axis]=limit;result.push(p);
      }
      if(insideB)result.push(b);
      a=b;insideA=insideB;
    }
    points=result;
  }
  let twiceArea=0;
  for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];twiceArea+=a[0]*b[1]-a[1]*b[0];}
  return Math.abs(twiceArea)>2e-10;
}
function compile(items){
  return items.map(item=>({id:item.id,vertices:item.vertices,bounds:polygonBounds(item.vertices)}));
}
/** Rebuild this static collision index when geometry changes in future object-engine PRs. */
export function createPhysicsWorld(room){
  return {room,bounds:room.bounds,solids:compile([...room.terrain,...room.objects.filter(o=>!o.decorative)]),hazards:compile(room.hazards),
    ladders:room.ladders??[],checkpoints:room.checkpoints??[]};
}
export function blocked(world,p){
  const b=playerBox(p),w=world.bounds;
  if(b.minX<w.minX-EPS||b.maxX>w.maxX+EPS||b.maxY>w.maxY+EPS)return true;
  return world.solids.some(s=>polygonIntersectsBox(s.vertices,b,s.bounds));
}
export function inHazard(world,p){
  if(p.y<world.bounds.minY-.25)return true;
  const b=playerBox(p);return world.hazards.some(s=>polygonIntersectsBox(s.vertices,b,s.bounds));
}
export function supported(world,p){
  return !blocked(world,p)&&blocked(world,{x:p.x,y:p.y-.025});
}
/** Small bounded substeps plus bisection to contact. No dependence on render FPS.
 * Axis-aligned character box is wider/taller than each substep, including at terminal speed. */
export function sweepAxis(world,p,axis,amount){
  if(!["x","y"].includes(axis)||!Number.isFinite(amount))throw new Error("Invalid sweep");
  const steps=Math.max(1,Math.ceil(Math.abs(amount)/.075));
  const increment=amount/steps;
  let q={x:p.x,y:p.y},hit=false;
  for(let i=0;i<steps;i++){
    const start=q[axis],candidate={...q,[axis]:start+increment};
    if(!blocked(world,candidate)){q=candidate;continue;}
    let lo=0,hi=1;
    for(let j=0;j<21;j++){
      const mid=(lo+hi)/2,trial={...q,[axis]:start+increment*mid};
      if(blocked(world,trial))hi=mid;else lo=mid;
    }
    q={...q,[axis]:start+increment*lo};hit=true;break;
  }
  return {x:q.x,y:q.y,hit};
}
/** Follow a walkable incline without allowing arbitrary vertical wall climbing. */
export function walkHorizontal(world,p,amount,grounded){
  if(amount===0)return {x:p.x,y:p.y,hit:false};
  const plain=sweepAxis(world,p,"x",amount);
  if(!grounded)return plain;
  const rise=Math.abs(amount)*1.15+.002;
  if(plain.hit){
    const lifted=sweepAxis(world,p,"y",rise);
    if(lifted.y-p.y>=rise-1e-5){
      const forward=sweepAxis(world,lifted,"x",amount);
      if(!forward.hit){
        const down=sweepAxis(world,forward,"y",-(rise+.035));
        if(down.hit&&down.y>=p.y-rise-.035&&down.y<=p.y+rise+EPS)return {...down,hit:false};
      }
    }
    return plain;
  }
  // Snap gently down a slope; do not teleport down a large drop.
  const down=sweepAxis(world,plain,"y",-(rise+.035));
  return down.hit?{...down,hit:false}:plain;
}
