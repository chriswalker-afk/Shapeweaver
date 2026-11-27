import {rectangle,deepFreeze} from "../geometry/world.js";

/** Closed gate is a physical wall. Rotate anticlockwise 90° about its overhead hinge. */
export const STUBBORN_GATE=deepFreeze({
  schemaVersion:1,id:"gatehouse-02",chapter:1,number:2,title:"The Stubborn Gate",
  bounds:{minX:0,maxX:30,minY:0,maxY:11},
  spawn:{x:2,y:3},exit:{x:27,y:3,width:2.2,height:3.1},
  terrain:[
    {id:"courtyard-floor",label:"the courtyard floor",material:"stone",vertices:rectangle(0,0,30,3),grass:true},
    {id:"lintel",label:"the stone lintel",material:"stone",vertices:rectangle(12,8.5,8,2.5),grass:false},
    {id:"hinge-bracket",label:"the hinge bracket",material:"stone",vertices:rectangle(13.5,8,.5,.5),grass:false}
  ],
  hazards:[],
  objects:[{id:"stubborn-gate",label:"Hinged gate",kind:"gate",material:"timber",vertices:rectangle(14,3,.5,5),hinge:[14,8],permissions:["rotate"],support:"hinged"}],
  ladders:[],checkpoints:[],
  decor:[{kind:"fern",x:.8,y:3},{kind:"lantern",x:10,y:5},{kind:"lantern",x:22,y:5},{kind:"fern",x:29.4,y:3}],
  tutorial:{spell:"rotate",mathDifficulty:1,puzzleDifficulty:1,efficientMoves:1}
});
export const GATE_SOLUTION=deepFreeze({objectId:"stubborn-gate",angle:90,direction:"anticlockwise",cx:14,cy:8});
export function gateHint(room,stage){
  const gate=room.objects.find(o=>o.id==="stubborn-gate"),h=gate.hinge,a=gate.vertices[0];
  if(stage===1)return "The gate is attached to its hinge above the passage. A rotation keeps the hinge fixed and swings the gate up out of the way.";
  if(stage===2)return "H = ("+h.join(", ")+"). Vertex A is ("+a.join(", ")+"). Compare the ray from H to A with the ray pointing right. Which angle and direction turn one into the other without crossing the floor or lintel?";
  if(Math.abs(a[1]-h[1])<1e-7&&a[0]>h[0])return "The gate is already open. Close the object inspector and walk under it to the portal.";
  return "Try 90° anticlockwise, centre ("+h.join(", ")+"). Preview the arc before applying. Then walk beneath the gate.";
}
