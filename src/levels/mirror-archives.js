import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const water=(id,x,w)=>({id,kind:"water",vertices:rectangle(x,0,w,2.1)});
export const BRING_IT_WITH_YOU=deepFreeze({
 schemaVersion:1,id:"archives-19",chapter:5,number:19,title:"Bring It With You",
 bounds:{minX:0,maxX:70,minY:0,maxY:17},
 spawn:{x:1.5,y:3},exit:{x:67,y:4.5,width:2.2,height:3.1},
 terrain:[stone("west-archive",0,0,18,3),stone("reading-island",30,0,12,3),stone("reading-balcony",30,6,8,.5),stone("east-archive",54,0,16,4.5)],
 hazards:[water("first-archive-channel",18,12),water("second-archive-channel",42,12)],
 objects:[{id:"archive-crate",label:"Travelling archive chest",kind:"crate",material:"timber",vertices:rectangle(4,3,8,2.5),permissions:["translate"],support:"supported"}],
 ladders:[],checkpoints:[{id:"reading-refuge",x:34,y:6.5},{id:"east-reading-room",x:59,y:4.5}],
 decor:[{kind:"lantern",x:2,y:5.5},{kind:"lantern",x:16,y:5.5},{kind:"lantern",x:34,y:9},{kind:"lantern",x:40,y:5.5},{kind:"lantern",x:65,y:7}],
 tutorial:{spells:["translate"],mathDifficulty:3,puzzleDifficulty:4,efficientMoves:2}
});
export const BRING_IT_WITH_YOU_CASTS=deepFreeze([{objectId:"archive-crate",type:"translate",dx:13,dy:0},{objectId:"archive-crate",type:"translate",dx:24,dy:0}]);

export const A_BRIDGE_AND_A_LADDER=deepFreeze({
 schemaVersion:1,id:"archives-20",chapter:5,number:20,title:"A Bridge and a Ladder",
 bounds:{minX:0,maxX:68,minY:0,maxY:23},
 spawn:{x:1.5,y:3},exit:{x:65,y:15,width:2.2,height:3.1},
 terrain:[stone("west-library",0,0,18,3),stone("lower-library",30,0,24,3),stone("catalogue-balcony",34,5,4,.5),stone("upper-library",54,0,14,15)],
 hazards:[water("library-channel",18,12)],
 objects:[{id:"archive-ladder",label:"Travelling bridge ladder",kind:"ladder",material:"timber",vertices:rectangle(3,3,14,.6),hinge:[17,3],permissions:["translate","rotate"],support:"supported",pivotOnly:true,bridgeDeck:true}],
 ladders:[],checkpoints:[{id:"catalogue-refuge",x:36,y:5.5},{id:"upper-catalogue",x:59,y:15}],
 decor:[{kind:"lantern",x:2,y:5.5},{kind:"lantern",x:16,y:5.5},{kind:"lantern",x:36,y:8},{kind:"lantern",x:50,y:5.5},{kind:"lantern",x:65,y:17.5}],
 tutorial:{spells:["translate","rotate"],mathDifficulty:4,puzzleDifficulty:5,efficientMoves:3}
});
export const A_BRIDGE_AND_A_LADDER_CASTS=deepFreeze([{objectId:"archive-ladder",type:"translate",dx:14,dy:0},{objectId:"archive-ladder",type:"translate",dx:22,dy:0},{objectId:"archive-ladder",type:"rotate",angle:90,direction:"clockwise",cx:53,cy:3}]);
