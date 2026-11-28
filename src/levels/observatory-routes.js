import {rectangle,deepFreeze} from "../geometry/world.js";
const stone=(id,x,y,w,h)=>({id,label:id.replace(/-/g," "),material:"stone",vertices:rectangle(x,y,w,h),grass:false});
const base=(n,title,width,spells,efficientMoves)=>({schemaVersion:1,id:"observatory-"+n,chapter:7,number:n,title,bounds:{minX:0,maxX:width,minY:0,maxY:23},spawn:{x:1.5,y:3},exit:{x:width-3,y:3,width:2.2,height:3.1},ladders:[],decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:width-3,y:5}],tutorial:{spells,mathDifficulty:4,puzzleDifficulty:5,efficientMoves}});
const beam=(id,label,x,y,w,h,permissions)=>({id,label,kind:"beam",material:"timber",vertices:rectangle(x,y,w,h),permissions,support:"enchanted"});
export const THREE_WAYS_ACROSS=deepFreeze({...base(33,"Three Ways Across",68,["translate","rotate","reflect"],1),
 terrain:[stone("west-bank",0,0,22,3),stone("star-island",34,0,10,3),stone("east-bank",56,0,12,3)],
 hazards:[{id:"first-star-channel",kind:"water",vertices:rectangle(22,0,12,2.1)},{id:"second-star-channel",kind:"water",vertices:rectangle(44,0,12,2.1)}],
 objects:[beam("long-star-deck","Long star deck",4,16,34,.6,["translate"]),beam("short-star-deck","Reusable short deck",2,6,12,.6,["translate","reflect"]),
 {...beam("raised-star-beam","Raised hinged span",56,4.8,.6,12,["rotate"]),hinge:[56,4.8],support:"hinged"}],
 checkpoints:[{id:"three-ways-island",x:39,y:3},{id:"three-ways-far",x:60,y:3}],
 decor:[{kind:"lantern",x:3,y:5},{kind:"lantern",x:39,y:5},{kind:"lantern",x:65,y:5}]
});
export const LONG_DECK_CASTS=deepFreeze([{objectId:"long-star-deck",type:"translate",dx:18,dy:-12}]);
export const TWO_SPAN_CASTS=deepFreeze([{objectId:"short-star-deck",type:"translate",dx:20,dy:-2},{objectId:"raised-star-beam",type:"rotate",angle:90,direction:"anticlockwise",cx:56,cy:4.8}]);
export const REUSE_DECK_CASTS=deepFreeze([{...TWO_SPAN_CASTS[0]},{objectId:"short-star-deck",type:"reflect",line:"x = 39"}]);
export const THE_LOST_STAR=deepFreeze({...base(34,"The Lost Star",46,["translate","reflect"],2),
 terrain:[stone("west-bank",0,0,22,3),stone("east-bank",34,0,12,3)],
 hazards:[{id:"star-channel",kind:"water",vertices:rectangle(22,0,12,2.1)}],
 objects:[beam("rescue-deck","Rescue bridge",4,4,12,.6,["translate"]),
 {id:"lost-crystal",label:"Lost star crystal",kind:"crystal",material:"crystal",vertices:[[5,10],[8,10],[8,11],[6,13],[5,12]],permissions:["reflect"],support:"enchanted"}],
 deliveries:[{id:"star-receiver",label:"Star receiver",objectId:"lost-crystal",vertices:[[41,12],[40,13],[38,11],[38,10],[41,10]]}],
 checkpoints:[{id:"rescue-far",x:38,y:3}]
});
export const LOST_STAR_CASTS=deepFreeze([{objectId:"rescue-deck",type:"translate",dx:18,dy:0},{objectId:"lost-crystal",type:"reflect",line:"x = 23"}]);
