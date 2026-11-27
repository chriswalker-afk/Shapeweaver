import {rectangle,deepFreeze} from "../geometry/world.js";
import {resolveMechanisms} from "../mechanisms/pressure-plates.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
export const WRONG_WAY_ROUND=deepFreeze({
 schemaVersion:1,id:"clockwork-11",chapter:3,number:11,title:"The Wrong Way Round",
 bounds:{minX:0,maxX:44,minY:0,maxY:15},
 spawn:{x:1.5,y:3},exit:{x:41,y:9,width:2.2,height:3.1},
 terrain:[stone("gallery-floor",0,0,44,3),stone("high-landing",34,3,10,6)],
 hazards:[],
 objects:[{id:"clockwork-wedge",label:"Asymmetric brass wedge",kind:"wedge",material:"brass",vertices:[[8,3],[12,3],[8,5]],permissions:["reflect","enlarge"],support:"supported",scaleRange:[.5,3]}],
 ladders:[],checkpoints:[{id:"upper-gallery",x:37,y:9}],
 decor:[{kind:"lantern",x:4,y:5},{kind:"lantern",x:20,y:5},{kind:"lantern",x:37,y:11},{kind:"lantern",x:43,y:11}],
 tutorial:{spells:["reflect","enlarge"],mathDifficulty:4,puzzleDifficulty:3,efficientMoves:2}
});
export const WEDGE_SOLUTION=deepFreeze([{objectId:"clockwork-wedge",type:"reflect",line:"x = 13"},{objectId:"clockwork-wedge",type:"enlarge",factor:3,cx:10,cy:3}]);
export const THE_GIANT_KEY=deepFreeze(resolveMechanisms({
 schemaVersion:1,id:"clockwork-12",chapter:3,number:12,title:"The Giant Key",
 bounds:{minX:0,maxX:39,minY:0,maxY:15},
 spawn:{x:1.5,y:3},exit:{x:36,y:3,width:2.2,height:3.1},
 terrain:[stone("lock-room-floor",0,0,39,3),stone("lock-room-ceiling",0,14,39,1)],
 hazards:[],
 objects:[
  {id:"brass-key",label:"Enchanted L-shaped key",kind:"key",material:"brass",vertices:[[9,5],[12,5],[12,6],[10,6],[10,8],[9,8]],permissions:["enlarge","rotate"],support:"enchanted",scaleRange:[.5,2]},
  {id:"key-gate",label:"Key-linked gate",kind:"linked-gate",material:"timber",vertices:rectangle(24,3,1,11),permissions:[],support:"enchanted",open:false,decorative:false}
 ],
 shapeSockets:[{id:"key-recess",label:"L-shaped lock recess",objectId:"brass-key",gateId:"key-gate",vertices:[[10,11],[10,5],[12,5],[12,9],[16,9],[16,11]]}],
 ladders:[],checkpoints:[{id:"beyond-lock",x:28,y:3}],
 decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:20,y:5},{kind:"lantern",x:29,y:5},{kind:"lantern",x:38,y:5}],
 tutorial:{spells:["enlarge","rotate"],mathDifficulty:4,puzzleDifficulty:4,efficientMoves:2}
}));
export const KEY_SOLUTION=deepFreeze([{objectId:"brass-key",type:"enlarge",factor:2,cx:8,cy:5},{objectId:"brass-key",type:"rotate",angle:90,direction:"clockwise",cx:13,cy:8}]);
