import {rectangle,deepFreeze} from "../geometry/world.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const gate=(id,label,x)=>({id,label,kind:"linked-gate",material:"timber",vertices:rectangle(x,3,1,16),permissions:[],support:"enchanted",open:false,decorative:false});
const plate=(id,label,x,width,gateId)=>({id,label,x,y:8,width,contact:width,gateId,pressed:false});
const base=(number,title,width,efficientMoves)=>({schemaVersion:1,id:"archives-"+number,chapter:5,number,title,bounds:{minX:0,maxX:width,minY:0,maxY:20},spawn:{x:1.5,y:3},exit:{x:width-3,y:3,width:2.2,height:3.1},terrain:[stone("archive-floor",0,0,width,3),stone("archive-ceiling",0,19,width,1),stone("mechanism-shelf",2,7.5,22,.5)],hazards:[],ladders:[],checkpoints:[],decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:22,y:5},{kind:"lantern",x:width-3,y:5}],tutorial:{spells:["rotate","translate"],mathDifficulty:4,puzzleDifficulty:5,efficientMoves}});
const fork=(x,y)=>[[x,y],[x+1,y],[x+1,y+2],[x+5,y+2],[x+5,y],[x+7,y],[x+7,y+3],[x,y+3]];
const turn180=(vs,[cx,cy])=>vs.map(([x,y])=>[2*cx-x,2*cy-y]);
export const DOUBLE_SEAL_TARGET=deepFreeze(fork(16,8));
const sealBase=base(23,"The Double Seal",42,2);
export const THE_DOUBLE_SEAL=deepFreeze(resolveMechanisms({...sealBase,
 terrain:[...sealBase.terrain,stone("separator-pin",18,8,1,.25)],
 objects:[{id:"double-seal",label:"Linked double seal",kind:"compound-weight",material:"brass",vertices:turn180(fork(4,11),[7.5,13.5]),hinge:[7.5,13.5],pivotOnly:true,permissions:["rotate","translate"],support:"enchanted",pressesPlates:true},gate("double-gate","Double seal gate",30)],
 plates:[plate("seal-left","Left seal",16,1,"double-gate"),plate("seal-right","Right seal",21,2,"double-gate")],
 checkpoints:[{id:"beyond-seal",x:35,y:3}]
}));
export const DOUBLE_SEAL_CASTS=deepFreeze([{objectId:"double-seal",type:"rotate",angle:180,direction:"clockwise",cx:7.5,cy:13.5},{objectId:"double-seal",type:"translate",dx:12,dy:-3}]);
export const comb=(x,y)=>[[x,y],[x+1,y],[x+1,y+2],[x+4,y+2],[x+4,y],[x+5,y],[x+5,y+2],[x+8,y+2],[x+8,y],[x+9,y],[x+9,y+3],[x,y+3]];
const key=(x,y)=>[[x,y],[x+3,y],[x+3,y+1],[x+1,y+1],[x+1,y+3],[x,y+3]];
const turnLeft=(vs,[cx,cy])=>vs.map(([x,y])=>[cx-(y-cy),cy+(x-cx)]);
export const THE_ARCHIVISTS_CHAIN=deepFreeze(resolveMechanisms({...base(24,"The Archivist’s Chain",46,3),
 objects:[{id:"chain-comb",label:"Linked triple seal",kind:"compound-weight",material:"brass",vertices:comb(4,8),permissions:["translate"],support:"supported",pressesPlates:true},
 {id:"chain-key",label:"Archive chain key",kind:"key",material:"brass",vertices:turnLeft(key(4,13),[5,14]),hinge:[5,14],pivotOnly:true,permissions:["rotate","translate"],support:"enchanted"},
 gate("transit-gate","Transit gate",26),gate("chain-gate","Final archive gate",39)],
 plates:[plate("chain-left","Left transit plate",12,1,"transit-gate"),plate("chain-middle","Right transit plate",16,1,"transit-gate"),plate("chain-right","Final gate plate",20,1,"chain-gate")],
 shapeSockets:[{id:"chain-recess",label:"Final key recess",objectId:"chain-key",gateId:"chain-gate",vertices:key(31,13),locking:true}],
 checkpoints:[{id:"chain-refuge",x:30,y:3}]
}));
export const ARCHIVISTS_CHAIN_CASTS=deepFreeze([{objectId:"chain-comb",type:"translate",dx:8,dy:0},{objectId:"chain-key",type:"rotate",angle:90,direction:"clockwise",cx:5,cy:14},{objectId:"chain-key",type:"translate",dx:27,dy:0}]);
