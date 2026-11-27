import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const beam=(id,label,dockable)=>({id,label,kind:"gate",material:"timber",vertices:rectangle(5.5,3,.5,12),hinge:[6,3],permissions:["translate","rotate"],support:"supported",...(dockable?{dockable:true}:{pivotOnly:true})});
export const FIND_THE_HINGE=deepFreeze({
 schemaVersion:1,id:"clockwork-09",chapter:3,number:9,title:"Find the Hinge",
 bounds:{minX:0,maxX:42,minY:0,maxY:17},
 spawn:{x:1.5,y:3},exit:{x:39,y:3,width:2.2,height:3.1},
 terrain:[stone("workbench",0,0,18,3),stone("far-ledge",28,0,14,3)],
 hazards:[{id:"machine-channel",kind:"water",vertices:rectangle(18,0,10,2.1)}],
 objects:[beam("socket-beam","Socket beam",true)],
 sockets:[{id:"bridge-socket",label:"bridge socket S",objectId:"socket-beam",x:17,y:3}],
 ladders:[],checkpoints:[{id:"far-side",x:31,y:3}],
 decor:[{kind:"lantern",x:2.5,y:6},{kind:"lantern",x:15,y:6},{kind:"lantern",x:33,y:6},{kind:"lantern",x:40,y:5}],
 tutorial:{spells:["translate","rotate"],mathDifficulty:3,puzzleDifficulty:3,efficientMoves:2}
});
export const HINGE_SOLUTION=deepFreeze([{objectId:"socket-beam",type:"translate",dx:11,dy:0},{objectId:"socket-beam",type:"rotate",angle:90,direction:"clockwise",cx:17,cy:3}]);
export const A_TIGHT_SQUEEZE=deepFreeze({
 schemaVersion:1,id:"clockwork-10",chapter:3,number:10,title:"A Tight Squeeze",
 bounds:{minX:0,maxX:47,minY:0,maxY:17},
 spawn:{x:1.5,y:3},exit:{x:44,y:3,width:2.2,height:3.1},
 terrain:[stone("west-platform",0,0,24,3),stone("east-platform",34,0,13,3),stone("low-arch",19,6,5,11)],
 hazards:[{id:"clockwork-channel",kind:"water",vertices:rectangle(24,0,10,2.1)}],
 objects:[beam("clearance-plank","Pivot plank",false)],
 ladders:[],checkpoints:[{id:"east-platform-checkpoint",x:37,y:3}],
 decor:[{kind:"lantern",x:2.5,y:6},{kind:"lantern",x:17.5,y:6},{kind:"lantern",x:37,y:6},{kind:"lantern",x:45,y:5}],
 tutorial:{spells:["rotate","translate"],mathDifficulty:3,puzzleDifficulty:4,efficientMoves:2}
});
export const SQUEEZE_SOLUTION=deepFreeze([{objectId:"clearance-plank",type:"rotate",angle:90,direction:"clockwise",cx:6,cy:3},{objectId:"clearance-plank",type:"translate",dx:17,dy:0}]);
