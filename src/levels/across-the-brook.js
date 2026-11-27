import {rectangle,deepFreeze} from "../geometry/world.js";

/** First official tutorial. One intended translation, then actual traversal. */
export const ACROSS_THE_BROOK=deepFreeze({
  schemaVersion:1,id:"gatehouse-01",chapter:1,number:1,title:"Across the Brook",
  bounds:{minX:0,maxX:40,minY:0,maxY:12},
  spawn:{x:1.5,y:3},exit:{x:37,y:3,width:2.2,height:3.1},
  terrain:[
    {id:"west-bank",label:"the west bank",material:"stone",vertices:rectangle(0,0,16,3),grass:true},
    {id:"east-bank",label:"the east bank",material:"stone",vertices:rectangle(26,0,14,3),grass:true}
  ],
  hazards:[{id:"brook",kind:"water",vertices:rectangle(16,0,10,2.1)}],
  objects:[{id:"brook-beam",label:"Timber beam",kind:"beam",material:"timber",vertices:rectangle(3,3,12,.5),permissions:["translate"],support:"supported"}],
  ladders:[],checkpoints:[],
  decor:[{kind:"fern",x:.7,y:3},{kind:"fern",x:15.7,y:3},{kind:"lantern",x:28,y:5},{kind:"fern",x:39,y:3}],
  tutorial:{target:[15,3],mathDifficulty:1,puzzleDifficulty:1,efficientMoves:1}
});
export const BROOK_SOLUTION=deepFreeze({objectId:"brook-beam",dx:12,dy:0});
export function brookHint(room,stage){
  const beam=room.objects.find(o=>o.id==="brook-beam"),a=beam.vertices[0],[x,y]=room.tutorial.target;
  if(stage===1)return "The brook is 10 units wide. Place the beam so it rests on both banks. Translation changes position, not size or orientation.";
  if(stage===2)return "Compare vertex A ("+a.join(", ")+") with a useful destination ("+x+", "+y+"). Find the change in x and the change in y.";
  return "One possible translation: horizontal "+Number((x-a[0]).toFixed(10))+", vertical "+Number((y-a[1]).toFixed(10))+". Enter those components, preview and apply if the path is clear.";
}
