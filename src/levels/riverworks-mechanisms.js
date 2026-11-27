import {rectangle,deepFreeze} from "../geometry/world.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const water=(id,x,w)=>({id,kind:"water",vertices:rectangle(x,0,w,2.1)});
export const DOUBLE_TROUBLE=deepFreeze(resolveMechanisms({
 schemaVersion:1,id:"riverworks-15",chapter:4,number:15,title:"Double Trouble",
 bounds:{minX:0,maxX:50,minY:0,maxY:14},
 spawn:{x:9.5,y:3},exit:{x:47,y:3,width:2.2,height:3.1},
 terrain:[stone("sluice-floor",0,0,50,3),stone("sealed-store-wall",7,3,1,11),stone("sealed-store-roof",0,7,7,1)],
 hazards:[],
 objects:[
  {id:"sluice-barrel",label:"Stored counterweight",kind:"barrel",material:"timber",vertices:rectangle(3,3,3,1.5),permissions:["reflect"],support:"supported",pressesPlates:true},
  {id:"sluice-crate",label:"Sliding counterweight",kind:"crate",material:"timber",vertices:rectangle(22,3,3,1.5),permissions:["translate"],support:"supported",pressesPlates:true},
  {id:"sluice-gate",label:"Sluice gate",kind:"linked-gate",material:"timber",vertices:rectangle(38,3,1,11),permissions:[],support:"enchanted",open:false,decorative:false}
 ],
 plates:[
  {id:"sluice-plate-a",label:"Plate 1",x:14,y:3,width:3,contact:2.5,gateId:"sluice-gate"},
  {id:"sluice-plate-b",label:"Plate 2",x:28,y:3,width:3,contact:2.5,gateId:"sluice-gate"}
 ],
 ladders:[],checkpoints:[{id:"sluice-exit-checkpoint",x:42,y:3}],
 decor:[{kind:"lantern",x:2,y:6},{kind:"lantern",x:11,y:5},{kind:"lantern",x:20,y:5},{kind:"lantern",x:34,y:5},{kind:"lantern",x:45,y:5}],
 tutorial:{spells:["reflect","translate"],mathDifficulty:3,puzzleDifficulty:4,efficientMoves:2}
}));
export const DOUBLE_TROUBLE_SOLUTION=deepFreeze([{objectId:"sluice-barrel",type:"reflect",line:"x = 10"},{objectId:"sluice-crate",type:"translate",dx:6,dy:0}]);

export const DIAGONAL_DOCK=deepFreeze({
 schemaVersion:1,id:"riverworks-16",chapter:4,number:16,title:"Diagonal Dock",
 bounds:{minX:0,maxX:52,minY:0,maxY:24},
 spawn:{x:1.5,y:3},exit:{x:49,y:4.5,width:2.2,height:3.1},
 terrain:[stone("west-dock",0,0,10,3),stone("storage-shelf",2,8.5,3,.5),stone("middle-dock",20,0,4,3),stone("upper-east-dock",32,0,20,4.5)],
 hazards:[water("first-dock-channel",10,10),water("second-dock-channel",24,8)],
 objects:[
  {id:"diagonal-bracket",label:"L-shaped dock piece",kind:"beam",material:"timber",vertices:[[3,9],[3.5,9],[3.5,19],[4.5,19],[4.5,22],[3,22]],permissions:["reflect"],support:"supported"},
  {id:"dock-span",label:"Upper dock span",kind:"beam",material:"timber",vertices:rectangle(33,4.5,13,.5),permissions:["translate"],support:"supported",bearing:"both-ends"}
 ],
 ladders:[],checkpoints:[{id:"east-dock-checkpoint",x:47.5,y:4.5}],
 decor:[{kind:"lantern",x:.8,y:5},{kind:"lantern",x:8.5,y:5},{kind:"lantern",x:23,y:3.8},{kind:"lantern",x:50.5,y:7}],
 tutorial:{spells:["reflect","translate"],mathDifficulty:4,puzzleDifficulty:4,efficientMoves:2}
});
export const DIAGONAL_DOCK_SOLUTION=deepFreeze([{objectId:"diagonal-bracket",type:"reflect",line:"y = x"},{objectId:"dock-span",type:"translate",dx:-12,dy:0}]);
