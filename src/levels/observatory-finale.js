import {rectangle,deepFreeze} from "../geometry/world.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const beam=(id,label,x,y,w,h,permissions)=>({id,label,kind:"beam",material:"timber",vertices:rectangle(x,y,w,h),permissions,support:"enchanted"});
const gate=(id,label,x)=>({id,label,kind:"linked-gate",material:"timber",vertices:rectangle(x,3,1,19),permissions:[],support:"enchanted",open:false,decorative:false});
const fork=(x,y)=>[[x,y],[x+1,y],[x+1,y+2],[x+5,y+2],[x+5,y],[x+7,y],[x+7,y+3],[x,y+3]];
const key=(x,y)=>[[x,y],[x+3,y],[x+3,y+1],[x+1,y+1],[x+1,y+3],[x,y+3]];
const reflected=(vertices,a)=>vertices.map(([x,y])=>[2*a-x,y]).reverse();
const channels=[{id:"first-channel",kind:"water",vertices:rectangle(22,0,12,2.1)},{id:"second-channel",kind:"water",vertices:rectangle(44,0,12,2.1)}];
const base=(n,title,width,spells,efficientMoves)=>({schemaVersion:1,id:"observatory-"+n,chapter:7,number:n,title,bounds:{minX:0,maxX:width,minY:0,maxY:23},spawn:{x:1.5,y:3},exit:{x:width-3,y:3,width:2.2,height:3.1},terrain:[stone("west-bank",0,0,22,3),stone("star-island",34,0,10,3),stone("east-bank",56,0,width-56,3)],hazards:channels,ladders:[],checkpoints:[{id:"machine-island",x:39,y:3},{id:"machine-far-bank",x:58,y:3}],decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:39,y:5},{kind:"lantern",x:width-3,y:5}],tutorial:{spells,mathDifficulty:5,puzzleDifficulty:5,efficientMoves}});
const machine=base(35,"The Observatory Machine",76,["translate","reflect"],5);
export const THE_OBSERVATORY_MACHINE=deepFreeze(resolveMechanisms({...machine,
 terrain:[...machine.terrain,stone("ceiling",0,22,76,1),stone("selector-shelf",2,7.5,14,.5)],
 objects:[
  {id:"machine-fork",label:"Compound selector weight",kind:"compound-weight",material:"brass",vertices:fork(4,8),permissions:["translate"],support:"supported",pressesPlates:true},
  beam("machine-deck","Reusable machine deck",4,4,12,.6,["translate","reflect"]),
  {id:"machine-key",label:"Asymmetric machine key",kind:"key",material:"brass",vertices:key(3,13),permissions:["reflect"],support:"enchanted"},
  gate("machine-inlet","Inlet gate",18),gate("machine-outlet","Outlet gate",60),gate("machine-lock","Final machine gate",64)
 ],
 plates:[{id:"machine-selector",label:"Inlet/outlet selector",x:4,y:8,width:1,contact:1,gateId:"machine-outlet",closedGateId:"machine-inlet",pressed:true},
  {id:"machine-seal",label:"Final seal plate",x:9,y:8,width:2,contact:2,gateId:"machine-lock",pressed:true}],
 shapeSockets:[{id:"machine-key-recess",label:"Machine key recess",objectId:"machine-key",gateId:"machine-lock",vertices:reflected(key(3,13),36),locking:true}]
}));
export const MACHINE_CASTS=deepFreeze([
 {objectId:"machine-fork",type:"translate",dx:4,dy:0},
 {objectId:"machine-deck",type:"translate",dx:18,dy:0},
 {objectId:"machine-deck",type:"reflect",line:"x = 39"},
 {objectId:"machine-fork",type:"translate",dx:-4,dy:0},
 {objectId:"machine-key",type:"reflect",line:"x = 36"}
]);
const ascent=base(36,"The Final Ascent",92,["translate","reflect","rotate","enlarge"],5);
export const THE_FINAL_ASCENT=deepFreeze({...ascent,
 exit:{x:89,y:12,width:2.2,height:3.1},
 terrain:[...ascent.terrain,stone("summit",80,3,12,9)],
 objects:[
  beam("ascent-deck","Reusable ascent deck",2,6,12,.6,["translate","reflect"]),
  {...beam("ascent-spare","Raised hinged span",55.4,5.4,.6,12,["rotate"]),hinge:[56,5.4],support:"hinged"},
  {id:"ascent-gate",label:"Hinged summit gate",kind:"gate",material:"timber",vertices:rectangle(60,3,.5,6),hinge:[60,9],permissions:["rotate"],support:"hinged"},
  {id:"ascent-wedge",label:"Summit ramp",kind:"wedge",material:"brass",vertices:[[74,3],[80,3],[80,6]],permissions:["enlarge"],support:"supported",scaleRange:[.5,3]},
  {id:"ascent-crystal",label:"Summit star",kind:"crystal",material:"crystal",vertices:[[5,15],[8,15],[8,16],[6,18],[5,17]],permissions:["reflect"],support:"enchanted"}
 ],
 deliveries:[{id:"summit-receiver",label:"Summit receiver",objectId:"ascent-crystal",vertices:reflected([[5,15],[8,15],[8,16],[6,18],[5,17]],45)}],
 checkpoints:[{id:"ascent-island",x:39,y:3},{id:"ascent-far-bank",x:58,y:3},{id:"summit-checkpoint",x:85,y:12}],
 decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:39,y:5},{kind:"lantern",x:58,y:5},{kind:"lantern",x:89,y:14}]
});
export const ASCENT_CASTS=deepFreeze([
 {objectId:"ascent-deck",type:"translate",dx:20,dy:-3},
 {objectId:"ascent-deck",type:"reflect",line:"x = 39"},
 {objectId:"ascent-gate",type:"rotate",angle:90,direction:"anticlockwise",cx:60,cy:9},
 {objectId:"ascent-wedge",type:"enlarge",factor:3,cx:80,cy:3},
 {objectId:"ascent-crystal",type:"reflect",line:"x = 45"}
]);
export const ASCENT_ALTERNATIVE_CASTS=deepFreeze([ASCENT_CASTS[0],{objectId:"ascent-spare",type:"rotate",angle:90,direction:"anticlockwise",cx:56,cy:5.4},...ASCENT_CASTS.slice(2)]);
