import {rectangle,deepFreeze} from "../geometry/world.js";

/** Sealed store, accessible courtyard and a ledge higher than the normal jump. */
export const MISSING_BARREL=deepFreeze({
  schemaVersion:1,id:"gatehouse-04",chapter:1,number:4,title:"The Missing Barrel",
  bounds:{minX:0,maxX:40,minY:0,maxY:13},
  spawn:{x:10,y:3},exit:{x:36,y:8,width:2.2,height:3.1},
  terrain:[
    {id:"courtyard-floor",label:"the courtyard floor",material:"stone",vertices:rectangle(0,0,40,3),grass:true},
    {id:"store-wall",label:"the sealed store wall",material:"stone",vertices:rectangle(7,3,1,10),grass:false},
    {id:"store-roof",label:"the store roof",material:"stone",vertices:rectangle(0,8,7,1),grass:false},
    {id:"high-ledge",label:"the raised stone ledge",material:"stone",vertices:rectangle(28,3,12,5),grass:true}
  ],
  hazards:[],
  objects:[{id:"missing-barrel",label:"Timber barrel",kind:"barrel",material:"timber",vertices:rectangle(3,3,3,2.5),permissions:["reflect"],support:"supported"}],
  ladders:[],checkpoints:[],
  decor:[{kind:"lantern",x:1,y:6.8},{kind:"lantern",x:8.7,y:5},{kind:"fern",x:17,y:3},{kind:"lantern",x:32,y:10},{kind:"fern",x:39,y:8}],
  tutorial:{spell:"reflect",target:[27,3],mathDifficulty:1,puzzleDifficulty:1,efficientMoves:1}
});
export const BARREL_SOLUTION=deepFreeze({objectId:"missing-barrel",line:"x = 15"});
const round=n=>Number(n.toFixed(8));
export function barrelHint(room,stage){
  const barrel=room.objects.find(o=>o.id==="missing-barrel");
  // A is a stable reference across winding changes, not necessarily array index zero.
  const a=barrel.vertices[barrel.vertexIds?.indexOf("A")??0],target=room.tutorial.target;
  if(stage===1)return "The barrel is trapped behind a wall. A reflection can move it magically through the barrier. It must land on the floor near the ledge so you can jump onto it and then up to the exit.";
  if(stage===2)return "A vertical mirror line keeps y unchanged. Compare A ("+a.join(", ")+") with a useful image A′ ("+target.join(", ")+"). Find the midpoint of their x-coordinates.";
  if(Math.abs(a[0]-target[0])<1e-7&&Math.abs(a[1]-target[1])<1e-7)return "The barrel is at the intended position. Jump onto it, then jump again onto the ledge and walk to the portal.";
  const originalOrientation=barrel.vertices[barrel.vertexIds?.indexOf("B")??1][0]>a[0];
  if(!originalOrientation||Math.abs(a[1]-target[1])>1e-7)return "For the original barrel, reflect in x = 15. If your barrel has already changed orientation, compare its current coordinates with the ledge; reset if you want the original worked example.";
  return "The mirror is halfway between x = "+a[0]+" and x = "+target[0]+". Enter x = "+round((a[0]+target[0])/2)+", preview, then apply. Jump onto the barrel and then onto the ledge.";
}
