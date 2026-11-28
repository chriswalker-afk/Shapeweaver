import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const rail=(id,x,y)=>({id,label:"Movable mirror slider",kind:"mirror-rail",material:"brass",vertices:rectangle(x-.5,y,1,.7),permissions:["translate"],support:"enchanted"});
const base=(n,title,width,spells,efficientMoves)=>({schemaVersion:1,id:"observatory-"+n,chapter:7,number:n,title,bounds:{minX:0,maxX:width,minY:0,maxY:23},spawn:{x:1.5,y:3},exit:{x:width-3,y:3,width:2.2,height:3.1},ladders:[],decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:width-3,y:5}],tutorial:{spells,mathDifficulty:n===31?4:5,puzzleDifficulty:5,efficientMoves}});
export const THE_WANDERING_MIRROR=deepFreeze({...base(31,"The Wandering Mirror",46,["translate","reflect"],2),
 terrain:[stone("west-bank",0,0,22,3),stone("east-bank",34,0,12,3)],
 hazards:[{id:"star-channel",kind:"water",vertices:rectangle(22,0,12,2.1)}],
 objects:[rail("star-mirror",10,17),{id:"star-deck",label:"Bevelled mirror bridge",kind:"beam",material:"timber",vertices:[[4,4],[16,4],[16,4.7],[15,5],[4,5]],permissions:["reflect"],mirrorRailId:"star-mirror",support:"enchanted"}],
 checkpoints:[{id:"far-observatory",x:38,y:3}]
});
export const THE_ASTRONOMERS_BRIDGE=deepFreeze({...base(32,"The Astronomer’s Bridge",68,["translate","rotate","reflect"],4),
 terrain:[stone("west-bank",0,0,22,3),stone("middle-bank",34,0,10,3),stone("east-bank",56,0,12,3)],
 hazards:[{id:"first-star-channel",kind:"water",vertices:rectangle(22,0,12,2.1)},{id:"second-star-channel",kind:"water",vertices:rectangle(44,0,12,2.1)}],
 objects:[rail("orbit-mirror",15,18),{id:"orbit-socket",label:"Movable star socket",kind:"pivot-carrier",material:"brass",vertices:rectangle(7,3.5,1,.5),hinge:[8,4],permissions:["translate","reflect"],mirrorRailId:"orbit-mirror",support:"enchanted"},
 {id:"orbit-beam",label:"Attached star beam",kind:"beam",material:"timber",vertices:[[7.4,4],[8,4],[8,16],[7.7,16],[7.4,15.5]],hinge:[8,4],attachedTo:"orbit-socket",pivotOnly:true,permissions:["rotate"],support:"enchanted"}],
 checkpoints:[{id:"star-refuge",x:39,y:3},{id:"far-star-bank",x:60,y:3}],
 decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:39,y:5},{kind:"lantern",x:65,y:5}]
});
export const WANDERING_MIRROR_CASTS=deepFreeze([{objectId:"star-mirror",type:"translate",dx:9,dy:0},{objectId:"star-deck",type:"reflect",line:"x = 19"}]);
export const ASTRONOMERS_BRIDGE_CASTS=deepFreeze([{objectId:"orbit-socket",type:"translate",dx:14,dy:0},{objectId:"orbit-beam",type:"rotate",angle:90,direction:"clockwise",cx:22,cy:4},{objectId:"orbit-mirror",type:"translate",dx:24,dy:0},{objectId:"orbit-socket",type:"reflect",line:"x = 39"}]);
