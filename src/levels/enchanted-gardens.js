import {rectangle,deepFreeze} from "../geometry/world.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
const stone=(id,x,y,w,h,grass=false)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass});
export const TWO_SMALL_PROBLEMS=deepFreeze({
 schemaVersion:1,id:"gardens-05",chapter:2,number:5,title:"Two Small Problems",
 bounds:{minX:0,maxX:56,minY:0,maxY:11},
 spawn:{x:1.5,y:3},exit:{x:53,y:3,width:2.2,height:3.1},
 terrain:[stone("west-bank",0,0,16,3,true),stone("east-bank",26,0,30,3,true),stone("garden-lintel",35,8.5,8,2.5),stone("hinge-bracket",36.5,8,.5,.5)],
 hazards:[{id:"garden-brook",kind:"water",vertices:rectangle(16,0,10,2.1)}],
 objects:[
  {id:"garden-beam",label:"Garden beam",kind:"beam",material:"timber",vertices:rectangle(3,3,12,.5),permissions:["translate"],support:"supported"},
  {id:"garden-hinge",label:"Garden gate",kind:"gate",material:"timber",vertices:rectangle(37,3,.5,5),hinge:[37,8],permissions:["rotate"],support:"hinged"}
 ],
 ladders:[],checkpoints:[{id:"east-bank-checkpoint",x:29,y:3}],
 decor:[{kind:"fern",x:1,y:3},{kind:"fern",x:15.5,y:3},{kind:"lantern",x:32,y:5},{kind:"fern",x:45,y:3},{kind:"lantern",x:50,y:5}],
 tutorial:{spells:["translate","rotate"],mathDifficulty:2,puzzleDifficulty:2,efficientMoves:2}
});
export const GARDEN_BRIDGE=deepFreeze([{objectId:"garden-beam",type:"translate",dx:12,dy:0},{objectId:"garden-hinge",type:"rotate",angle:90,direction:"anticlockwise",cx:37,cy:8}]);
export const SECRET_GARDEN=deepFreeze(resolveMechanisms({
 schemaVersion:1,id:"gardens-06",chapter:2,number:6,title:"The Secret Garden",
 bounds:{minX:0,maxX:44,minY:0,maxY:16},
 spawn:{x:10,y:3},exit:{x:41,y:11,width:2.2,height:3.1},
 terrain:[stone("garden-floor",0,0,44,3,true),stone("store-wall",7,3,1,13),stone("store-roof",0,8,7,1),stone("high-terrace",34,3,10,8,true)],
 hazards:[],
 objects:[
  {id:"garden-barrel",label:"Weighted barrel",kind:"barrel",material:"timber",vertices:rectangle(3,3,3,2.5),permissions:["reflect"],support:"supported",pressesPlates:true},
  {id:"plate-gate",label:"Plate-linked gate",kind:"linked-gate",material:"timber",vertices:rectangle(18,3,1,13),permissions:[],support:"enchanted",open:false,decorative:false},
  {id:"garden-mushroom",label:"Spring mushroom",kind:"mushroom",material:"fungus",vertices:[[29.65,3],[30.35,3],[30.35,3.65],[31.2,3.65],[31.2,4.25],[28.8,4.25],[28.8,3.65],[29.65,3.65]],permissions:["enlarge"],support:"supported",scaleRange:[.5,2]}
 ],
 plates:[{id:"amber-plate",x:12,y:3,width:3,contact:2.5,gateId:"plate-gate"}],
 ladders:[],checkpoints:[{id:"garden-checkpoint",x:22,y:3}],
 decor:[{kind:"lantern",x:2,y:6.8},{kind:"fern",x:9,y:3},{kind:"lantern",x:16,y:5},{kind:"fern",x:24,y:3},{kind:"lantern",x:38,y:13},{kind:"fern",x:43,y:11}],
 tutorial:{spells:["reflect","enlarge"],mathDifficulty:2,puzzleDifficulty:2,efficientMoves:2}
}));
export const GARDEN_SECRET=deepFreeze([{objectId:"garden-barrel",type:"reflect",line:"x = 9"},{objectId:"garden-mushroom",type:"enlarge",factor:2,cx:30,cy:3}]);
