import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const piece=(id,label,x,y,w,h)=>({id,label,kind:"beam",material:"timber",vertices:rectangle(x,y,w,h),permissions:["translate"],support:"supported",bearing:"both-ends"});
export const BRIDGE_BUILDERS=deepFreeze({
 schemaVersion:1,id:"riverworks-13",chapter:4,number:13,title:"Bridge Builders",
 bounds:{minX:0,maxX:68,minY:0,maxY:14},
 spawn:{x:1.5,y:3},exit:{x:65,y:3,width:2.2,height:3.1},
 terrain:[stone("west-quay",0,0,30,3),stone("central-pier",40,0,4,3),stone("east-quay",54,0,14,3)],
 hazards:[{id:"west-channel",kind:"water",vertices:rectangle(30,0,10,2.1)},{id:"east-channel",kind:"water",vertices:rectangle(44,0,10,2.1)}],
 objects:[piece("west-span","West span",3,3,13,.5),piece("east-span","East span",17,3,13,.5)],
 ladders:[],checkpoints:[{id:"east-quay-checkpoint",x:60,y:3}],
 decor:[{kind:"lantern",x:1,y:5},{kind:"lantern",x:28,y:5},{kind:"lantern",x:42,y:6},{kind:"lantern",x:59,y:5},{kind:"lantern",x:67,y:5}],
 tutorial:{spells:["translate"],mathDifficulty:3,puzzleDifficulty:4,efficientMoves:2}
});
export const BRIDGE_BUILDERS_SOLUTION=deepFreeze([{objectId:"east-span",type:"translate",dx:25,dy:0},{objectId:"west-span",type:"translate",dx:26,dy:0}]);

export const BROKEN_STAIRCASE=deepFreeze({
 schemaVersion:1,id:"riverworks-14",chapter:4,number:14,title:"Broken Staircase",
 bounds:{minX:0,maxX:50,minY:0,maxY:20},
 spawn:{x:1.5,y:3},exit:{x:47,y:15,width:2.2,height:3.1},
 terrain:[stone("engine-floor",0,0,50,3),stone("storage-rack",4,5,4,.5),stone("upper-works",34,3,16,12)],
 hazards:[],
 objects:[
  piece("lower-step","Long lower platform",10,3,9,2.5),
  piece("upper-step","Short upper platform",4,5.5,4,2.5),
  {id:"service-ladder",label:"Hinged service ladder",kind:"ladder",material:"timber",vertices:rectangle(29,15,5,.6),hinge:[34,15],permissions:["rotate"],support:"hinged"}
 ],
 ladders:[],checkpoints:[{id:"upper-works-checkpoint",x:38,y:15}],
 decor:[{kind:"lantern",x:2,y:5},{kind:"lantern",x:13,y:7},{kind:"lantern",x:24,y:5},{kind:"lantern",x:39,y:17},{kind:"lantern",x:49,y:17}],
 tutorial:{spells:["translate","rotate"],mathDifficulty:3,puzzleDifficulty:4,efficientMoves:3}
});
export const BROKEN_STAIRCASE_SOLUTION=deepFreeze([{objectId:"lower-step",type:"translate",dx:15,dy:0},{objectId:"upper-step",type:"translate",dx:26,dy:0},{objectId:"service-ladder",type:"rotate",angle:90,direction:"anticlockwise",cx:34,cy:15}]);
