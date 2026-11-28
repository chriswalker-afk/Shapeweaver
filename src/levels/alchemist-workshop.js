import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
export const TOO_BIG_TO_FIT=deepFreeze({
 schemaVersion:1,id:"alchemist-25",chapter:6,number:25,title:"Too Big to Fit",
 bounds:{minX:0,maxX:38,minY:0,maxY:15},
 spawn:{x:1.5,y:3},exit:{x:35,y:7.4,width:2.2,height:3.1},
 terrain:[stone("workshop-floor",0,0,20,3),stone("raised-workbench",20,0,18,7.4)],
 hazards:[],objects:[{id:"oversized-block",label:"Oversized stone step",kind:"crate",material:"timber",vertices:rectangle(10,3,10,4.4),permissions:["enlarge"],support:"supported",scaleRange:[.25,2]}],
 ladders:[],checkpoints:[{id:"upper-workbench",x:26,y:7.4}],
 decor:[{kind:"lantern",x:3,y:5.5},{kind:"lantern",x:22,y:10},{kind:"lantern",x:35,y:10}],
 tutorial:{spells:["enlarge"],mathDifficulty:4,puzzleDifficulty:4,efficientMoves:1}
});
export const TOO_BIG_CASTS=deepFreeze([{objectId:"oversized-block",type:"enlarge",factor:.5,cx:20,cy:3}]);
export const SMALL_NOW_BIG_LATER=deepFreeze({
 schemaVersion:1,id:"alchemist-26",chapter:6,number:26,title:"Small Now, Big Later",
 bounds:{minX:0,maxX:52,minY:0,maxY:23},
 spawn:{x:1.5,y:4},exit:{x:49,y:4,width:2.2,height:3.1},
 terrain:[stone("west-workshop",0,0,28,4),stone("east-workshop",40,0,12,4),stone("channel-lower-wall",18,6.6,6,4.4),stone("channel-upper-wall",18,12.6,6,10.4)],
 hazards:[{id:"alchemist-channel",kind:"water",vertices:rectangle(28,0,12,2.1)}],
 objects:[{id:"resizable-bridge",label:"Resizable enchanted bridge",kind:"beam",material:"timber",vertices:rectangle(4,11,12,3),permissions:["enlarge","translate"],support:"enchanted",scaleRange:[.5,2]}],
 ladders:[],checkpoints:[{id:"far-workshop",x:44,y:4}],
 decor:[{kind:"lantern",x:3,y:6.5},{kind:"lantern",x:25,y:6.5},{kind:"lantern",x:45,y:6.5}],
 tutorial:{spells:["enlarge","translate"],mathDifficulty:4,puzzleDifficulty:5,efficientMoves:3}
});
export const SMALL_NOW_CASTS=deepFreeze([{objectId:"resizable-bridge",type:"enlarge",factor:.5,cx:4,cy:11},{objectId:"resizable-bridge",type:"translate",dx:27,dy:0},{objectId:"resizable-bridge",type:"enlarge",factor:2,cx:34,cy:19.5}]);
