import {rectangle,deepFreeze} from "../geometry/world.js";

/** A short wedge must become a walkable ramp. Centre and factor are chosen by the learner. */
export const LITTLE_CHEESY=deepFreeze({
  schemaVersion:1,id:"gatehouse-03",chapter:1,number:3,title:"A Little Cheesy",
  bounds:{minX:0,maxX:38,minY:0,maxY:16},
  spawn:{x:2,y:3},exit:{x:34,y:12,width:2.2,height:3.1},
  terrain:[
    {id:"courtyard-floor",label:"the courtyard floor",material:"stone",vertices:rectangle(0,0,38,3),grass:true},
    {id:"high-ledge",label:"the high stone ledge",material:"stone",vertices:rectangle(25,3,13,9),grass:true}
  ],
  hazards:[],
  objects:[{id:"cheesy-wedge",label:"Cheese wedge",kind:"wedge",material:"cheese",vertices:[[19,3],[25,3],[25,6]],permissions:["enlarge"],support:"supported",scaleRange:[.5,3]}],
  ladders:[],checkpoints:[],
  decor:[{kind:"fern",x:.8,y:3},{kind:"lantern",x:4,y:5},{kind:"lantern",x:30,y:14},{kind:"fern",x:37,y:12}],
  tutorial:{spell:"enlarge",target:[25,12],mathDifficulty:1,puzzleDifficulty:1,efficientMoves:1}
});
export const CHEESY_SOLUTION=deepFreeze({objectId:"cheesy-wedge",factor:3,cx:25,cy:3});
const round=n=>Number(n.toFixed(8));
export function cheesyHint(room,stage){
  const wedge=room.objects.find(o=>o.id==="cheesy-wedge"),[,base,top]=wedge.vertices;
  const height=round(top[1]-base[1]),targetHeight=9;
  if(stage===1)return "The ledge is 9 units above the floor. Enlarge the wedge into a ramp. A positive scale factor changes lengths in the same ratio without changing its slope.";
  if(stage===2)return "The wedge is "+height+" units high. The ledge needs 9 units of height. Compare top C ("+top.join(", ")+") and base B ("+base.join(", ")+"). Which centre keeps the base at (25, 3)?";
  if(Math.abs(base[0]-25)<1e-7&&Math.abs(base[1]-3)<1e-7){
    const factor=targetHeight/height;
    if(Math.abs(factor-1)<1e-7)return "The ramp already reaches the ledge. Close the inspector and walk up it to the portal.";
    if(factor>=wedge.scaleRange[0]&&factor<=wedge.scaleRange[1])return "Use scale factor "+round(factor)+" (9 ÷ "+height+"), centre (25, 3). Preview the enlargement, apply, then walk up the ramp.";
    return "The remaining scale factor is "+round(factor)+". It exceeds this wedge's per-cast range; use smaller legal enlargements or reset to try the original factor 3.";
  }
  return "For the original wedge, use scale factor 3 about (25, 3). If you have moved the base, adjust with another legal enlargement or reset to follow this example.";
}
