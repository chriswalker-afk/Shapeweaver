import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const water=(id,x,w)=>({id,kind:"water",vertices:rectangle(x,0,w,2.1)});
// Two linked solid paddles on an axle: the visible circular rim is a non-solid guide.
// The initial polygon is the exact inverse quarter-turn of the final continuous deck.
const rotor=[[-7.4,-.5],[-5.7,-.5],[-5.7,-.2],[5.7,-.2],[5.7,-.5],[7.4,-.5],[7.4,.5],[-7.4,.5]].map(([x,y])=>[32-y,11+x]);
export const WATERMILL=deepFreeze({
 schemaVersion:1,id:"riverworks-17",chapter:4,number:17,title:"Watermill",
 bounds:{minX:0,maxX:54,minY:0,maxY:24},
 spawn:{x:1.5,y:3},exit:{x:51,y:10.5,width:2.2,height:3.1},
 terrain:[stone("mill-west-quay",0,0,24,3),stone("mill-east-quay",40,0,14,10.5)],
 hazards:[water("mill-channel",24,16)],
 objects:[
  {id:"mill-rotor",label:"Waterwheel paddle assembly",kind:"waterwheel",material:"timber",vertices:rotor,hinge:[32,11],permissions:["rotate"],support:"hinged"},
  {id:"mill-ramp",label:"Mill ramp",kind:"wedge",material:"brass",vertices:[[18,3],[24,3],[24,5.5]],permissions:["enlarge"],support:"supported",scaleRange:[.5,3]}
 ],
 ladders:[],checkpoints:[{id:"mill-far-quay",x:45,y:10.5}],
 decor:[{kind:"lantern",x:2,y:5},{kind:"lantern",x:12,y:5},{kind:"lantern",x:44,y:13},{kind:"lantern",x:52,y:13}],
 tutorial:{spells:["rotate","enlarge"],mathDifficulty:4,puzzleDifficulty:4,efficientMoves:2}
});
export const WATERMILL_SOLUTION=deepFreeze([{objectId:"mill-rotor",type:"rotate",angle:90,direction:"clockwise",cx:32,cy:11},{objectId:"mill-ramp",type:"enlarge",factor:3,cx:24,cy:3}]);

export const AROUND_THE_TOWER=deepFreeze({
 schemaVersion:1,id:"riverworks-18",chapter:4,number:18,title:"Around the Tower",
 bounds:{minX:0,maxX:66,minY:0,maxY:29},
 spawn:{x:1.5,y:7.5},exit:{x:63,y:7.5,width:2.2,height:3.1},
 terrain:[stone("tower-west-quay",0,0,18,7.5),stone("central-tower",30,0,4,7.5),stone("tower-east-quay",46,0,20,7.5)],
 hazards:[water("tower-west-channel",18,12),water("tower-east-channel",34,12)],
 objects:[
  {id:"orbit-walkway",label:"Orbiting walkway",kind:"orbit-beam",material:"timber",vertices:rectangle(18,14,12,.5),fixedCentre:[32,11],permissions:["rotate"],support:"enchanted"},
  {id:"tower-span",label:"Tower approach span",kind:"beam",material:"timber",vertices:rectangle(3,7.5,14,.5),permissions:["translate"],support:"supported",bearing:"both-ends"}
 ],
 ladders:[],checkpoints:[{id:"tower-top",x:32,y:7.5},{id:"tower-east",x:50,y:7.5}],
 decor:[{kind:"lantern",x:2,y:10},{kind:"lantern",x:16,y:10},{kind:"lantern",x:48,y:10},{kind:"lantern",x:64,y:10}],
 tutorial:{spells:["rotate","translate"],mathDifficulty:4,puzzleDifficulty:4,efficientMoves:2}
});
export const AROUND_THE_TOWER_SOLUTION=deepFreeze([{objectId:"orbit-walkway",type:"rotate",angle:180,direction:"clockwise",cx:32,cy:11},{objectId:"tower-span",type:"translate",dx:14,dy:0}]);
