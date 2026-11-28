import {rectangle,deepFreeze} from "../geometry/world.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
const stone=(id,x,y,w,h)=>({id,material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const gate=(id,label,x,y=3,h=11)=>({id,label,kind:"linked-gate",material:"timber",vertices:rectangle(x,y,1,h),permissions:[],support:"enchanted",open:false,decorative:false});
const weight=(id)=>({id,label:"Archive weight",kind:"barrel",material:"brass",vertices:rectangle(4,8,2,1),permissions:["translate"],support:"supported",pressesPlates:true});
const plate=(id,label,x,gateId,latch=false)=>({id,label,x,y:8,width:2,contact:2,gateId,pressed:false,...(latch?{latch:true,latched:false}:{})});
const base=(number,title)=>({schemaVersion:1,id:"archives-"+number,chapter:5,number,title,bounds:{minX:0,maxX:42,minY:0,maxY:15},spawn:{x:1.5,y:3},exit:{x:39,y:3,width:2.2,height:3.1},terrain:[stone("floor",0,0,42,3),stone("ceiling",0,14,42,1),stone("mechanism-shelf",2,7.5,20,.5)],hazards:[],ladders:[],checkpoints:[{id:"first-door",x:27,y:3}],decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:27,y:5},{kind:"lantern",x:39,y:5}],tutorial:{spells:["translate"],mathDifficulty:3,puzzleDifficulty:5,efficientMoves:2}});
export const NO_GOING_BACK=deepFreeze(resolveMechanisms({...base(21,"No Going Back"),
 objects:[weight("latch-weight"),gate("latch-gate","Latch gate",24),gate("hold-gate","Hold gate",32)],
 plates:[plate("latch-plate","One-way latch",10,"latch-gate",true),plate("hold-plate","Hold plate",18,"hold-gate")]
}));
const key=(x)=>[[x,10],[x+2,10],[x+2,11],[x+1,11],[x+1,12],[x,12]];
export const LOCKED_PASSAGE=deepFreeze(resolveMechanisms({...base(22,"Locked Passage"),
 objects:[weight("passage-weight"),{id:"passage-key",label:"Only archive key",kind:"key",material:"brass",vertices:key(4),permissions:["translate"],support:"enchanted"},gate("passage-gate","Entrance gate",24),gate("exit-gate","Exit gate",32),gate("alcove-gate","Spare alcove gate",21,10,3)],
 plates:[plate("entry-plate","Entrance latch",10,"passage-gate",true)],
 shapeSockets:[{id:"alcove-lock",label:"Spare alcove",objectId:"passage-key",gateId:"alcove-gate",vertices:key(10),locking:true},{id:"exit-lock",label:"Exit lock",objectId:"passage-key",gateId:"exit-gate",vertices:key(18),locking:true}]
}));
export const NO_GOING_BACK_CASTS=deepFreeze([{objectId:"latch-weight",type:"translate",dx:6,dy:0},{objectId:"latch-weight",type:"translate",dx:8,dy:0}]);
export const LOCKED_PASSAGE_CASTS=deepFreeze([{objectId:"passage-weight",type:"translate",dx:6,dy:0},{objectId:"passage-key",type:"translate",dx:14,dy:0}]);
