import {rectangle,deepFreeze} from "../geometry/world.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const gate=(id,label,x)=>({id,label,kind:"linked-gate",material:"timber",vertices:rectangle(x,3,1,11),permissions:[],support:"enchanted",open:false,decorative:false});
export const ONE_OPENS_ONE_CLOSES=deepFreeze(resolveMechanisms({
 schemaVersion:1,id:"alchemist-29",chapter:6,number:29,title:"One Opens, One Closes",
 bounds:{minX:0,maxX:43,minY:0,maxY:15},spawn:{x:1.5,y:3},exit:{x:40,y:3,width:2.2,height:3.1},
 terrain:[stone("floor",0,0,43,3),stone("ceiling",0,14,43,1),stone("selector-shelf",2,7.5,13,.5)],
 hazards:[],ladders:[],checkpoints:[{id:"airlock-refuge",x:24,y:3}],
 objects:[{id:"selector-weight",label:"Selector weight",kind:"barrel",material:"brass",vertices:rectangle(10,8,2,1),permissions:["translate"],support:"supported",pressesPlates:true},gate("free-gate","Entrance gate",18),gate("held-gate","Exit gate",30)],
 plates:[{id:"airlock-selector",label:"Airlock selector",x:10,y:8,width:2,contact:2,gateId:"held-gate",closedGateId:"free-gate",pressed:true}],
 decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:24,y:5},{kind:"lantern",x:40,y:5}],
 tutorial:{spells:["translate"],mathDifficulty:4,puzzleDifficulty:5,efficientMoves:2}
}));
export const AIRLOCK_CASTS=deepFreeze([{objectId:"selector-weight",type:"translate",dx:-6,dy:0},{objectId:"selector-weight",type:"translate",dx:6,dy:0}]);
export const THE_ALCHEMISTS_TRIAL=deepFreeze({
 schemaVersion:1,id:"alchemist-30",chapter:6,number:30,title:"The Alchemist’s Trial",
 bounds:{minX:0,maxX:80,minY:0,maxY:23},spawn:{x:1.5,y:4},exit:{x:77,y:4,width:2.2,height:3.1},
 terrain:[stone("west-bank",0,0,28,4),stone("middle-bank",40,0,12,4),stone("raised-refuge",42,7.7,5,.5),stone("east-bank",64,0,16,4),
 stone("channel-lower-wall",18,6,6,5),stone("channel-upper-wall",18,12.1,6,10.9)],
 hazards:[{id:"first-channel",kind:"water",vertices:rectangle(28,0,12,2.1)},{id:"second-channel",kind:"water",vertices:rectangle(52,0,12,2.1)}],
 objects:[{id:"trial-bridge",label:"Reusable alchemist bridge",kind:"beam",material:"timber",vertices:rectangle(4,11,12,2),permissions:["enlarge","translate"],support:"enchanted",scaleRange:[.5,2]},
 {id:"trial-gate",label:"Hinged exit gate",kind:"gate",material:"timber",vertices:rectangle(72,4,.5,4),hinge:[72,8],permissions:["rotate"],support:"hinged"}],
 ladders:[],checkpoints:[{id:"trial-refuge",x:45,y:8.2},{id:"trial-far-bank",x:67,y:4}],
 decor:[{kind:"lantern",x:3,y:6.2},{kind:"lantern",x:46,y:6.2},{kind:"lantern",x:77,y:6.2}],
 tutorial:{spells:["enlarge","translate","rotate"],mathDifficulty:5,puzzleDifficulty:5,efficientMoves:5}
});
export const TRIAL_CASTS=deepFreeze([{objectId:"trial-bridge",type:"enlarge",factor:.5,cx:4,cy:11},{objectId:"trial-bridge",type:"translate",dx:27,dy:0},{objectId:"trial-bridge",type:"enlarge",factor:2,cx:34,cy:18},{objectId:"trial-bridge",type:"translate",dx:24,dy:0},{objectId:"trial-gate",type:"rotate",angle:90,direction:"anticlockwise",cx:72,cy:8}]);
