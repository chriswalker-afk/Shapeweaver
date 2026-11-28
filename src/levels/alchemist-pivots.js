import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const carrier=(id,x,y,side,permissions)=>({id,label:"Movable socket",kind:"pivot-carrier",material:"brass",vertices:rectangle(side==="left"?x-1:x,y-.5,1,.5),hinge:[x,y],permissions,support:"enchanted"});
const beam=(id,attachedTo,x,y,length,side)=>({id,label:"Attached pivot beam",kind:"beam",material:"timber",vertices:rectangle(side==="left"?x-.6:x,y,.6,length),hinge:[x,y],attachedTo,pivotOnly:true,permissions:["rotate"],support:"enchanted"});
const base=(n,title,west,east,width,spells)=>({schemaVersion:1,id:"alchemist-"+n,chapter:6,number:n,title,bounds:{minX:0,maxX:width,minY:0,maxY:22},spawn:{x:1.5,y:3},exit:{x:width-3,y:3,width:2.2,height:3.1},
 terrain:[stone("west-bank",0,0,west,3),stone("east-bank",east,0,width-east,3)],
 hazards:[{id:"workshop-channel",kind:"water",vertices:rectangle(west,0,east-west,2.1)}],ladders:[],
 checkpoints:[{id:"far-bench",x:east+3,y:3}],decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:east+4,y:5}],
 tutorial:{spells,mathDifficulty:4,puzzleDifficulty:5,efficientMoves:2}});
export const THE_WANDERING_PIVOT=deepFreeze({...base(27,"The Wandering Pivot",22,34,46,["translate","rotate"]),
 objects:[carrier("wandering-socket",8,4,"left",["translate"]),beam("wandering-beam","wandering-socket",8,4,12,"left")]
});
const mirrorBase=base(28,"The Mirrored Mechanism",24,37,49,["reflect","rotate"]);
export const THE_MIRRORED_MECHANISM=deepFreeze({...mirrorBase,terrain:[...mirrorBase.terrain,stone("mirror-partition",16,7,2,15)],
 objects:[carrier("mirror-socket",10,4,"right",["reflect"]),beam("mirror-beam","mirror-socket",10,4,13,"right")]
});
export const WANDERING_PIVOT_CASTS=deepFreeze([{objectId:"wandering-socket",type:"translate",dx:14,dy:0},{objectId:"wandering-beam",type:"rotate",angle:90,direction:"clockwise",cx:22,cy:4}]);
export const MIRRORED_MECHANISM_CASTS=deepFreeze([{objectId:"mirror-socket",type:"reflect",line:"x = 17"},{objectId:"mirror-beam",type:"rotate",angle:90,direction:"clockwise",cx:24,cy:4}]);
