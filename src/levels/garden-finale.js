import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h,grass=false)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass});
export const MIND_THE_GAP=deepFreeze({
 schemaVersion:1,id:"gardens-07",chapter:2,number:7,title:"Mind the Gap",
 bounds:{minX:0,maxX:40,minY:0,maxY:17},
 spawn:{x:1.5,y:3},exit:{x:37,y:12,width:2.2,height:3.1},
 terrain:[stone("courtyard-floor",0,0,40,3,true),stone("garden-terrace",24,3,16,9,true)],
 hazards:[],
 objects:[
  {id:"garden-ladder",label:"Hinged ladder",kind:"ladder",material:"timber",vertices:rectangle(19,12,5,.6),hinge:[24,12],permissions:["rotate"],support:"hinged"},
  {id:"ladder-crate",label:"Step crate",kind:"crate",material:"timber",vertices:rectangle(4,3,3,2.5),permissions:["translate"],support:"supported"}
 ],
 ladders:[],checkpoints:[{id:"upper-terrace",x:27,y:12}],
 decor:[{kind:"fern",x:.8,y:3},{kind:"lantern",x:11,y:5},{kind:"fern",x:18,y:3},{kind:"lantern",x:29,y:14},{kind:"fern",x:39,y:12}],
 tutorial:{spells:["rotate","translate"],mathDifficulty:2,puzzleDifficulty:3,efficientMoves:2}
});
export const LADDER_SOLUTION=deepFreeze([{objectId:"garden-ladder",type:"rotate",angle:90,direction:"anticlockwise",cx:24,cy:12},{objectId:"ladder-crate",type:"translate",dx:17,dy:0}]);
export const ABOVE_AND_BELOW=deepFreeze({
 schemaVersion:1,id:"gardens-08",chapter:2,number:8,title:"Above and Below",
 bounds:{minX:0,maxX:44,minY:0,maxY:17},
 spawn:{x:2,y:3},exit:{x:41,y:13,width:2.2,height:3.1},
 terrain:[stone("recess-floor",0,0,20,1),stone("west-foundation",0,1,11,1.5),stone("approach-walkway",0,2.5,14,.5,true),stone("middle-walkway",20,0,14,7,true),stone("upper-terrace",34,0,10,13,true)],
 hazards:[],
 objects:[
  {id:"mirror-platform",label:"Enchanted platform",kind:"beam",material:"timber",vertices:rectangle(12,1,7.5,.5),permissions:["reflect"],support:"enchanted"},
  {id:"garden-wedge",label:"Cheese ramp",kind:"wedge",material:"cheese",vertices:[[30,7],[34,7],[34,9]],permissions:["enlarge"],support:"supported",scaleRange:[.5,3]}
 ],
 ladders:[],checkpoints:[{id:"middle-terrace",x:21,y:7}],
 decor:[{kind:"fern",x:.7,y:3},{kind:"lantern",x:7,y:5},{kind:"lantern",x:21,y:9},{kind:"fern",x:35,y:13},{kind:"lantern",x:39,y:15}],
 tutorial:{spells:["reflect","enlarge"],mathDifficulty:3,puzzleDifficulty:3,efficientMoves:2}
});
export const ABOVE_SOLUTION=deepFreeze([{objectId:"mirror-platform",type:"reflect",line:"y = 3"},{objectId:"garden-wedge",type:"enlarge",factor:3,cx:34,cy:7}]);
