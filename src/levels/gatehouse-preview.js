import { rectangle, deepFreeze, polygonBounds, signedArea, boundsContain } from "../geometry/world.js";

/** Renderer fixture, NOT a released puzzle or verified solution. */
export const GATEHOUSE_PREVIEW = deepFreeze({
  schemaVersion: 1, id:"gatehouse-renderer-preview", title:"The Gatehouse", chapter:1,
  bounds:{minX:0,maxX:32,minY:0,maxY:14},
  spawn:{x:2.5,y:3}, exit:{x:30,y:6,width:2.2,height:3.1},
  terrain:[
    {id:"west-bank",material:"stone",vertices:rectangle(0,0,9,3),grass:true},
    {id:"central-support",material:"stone",vertices:rectangle(14,0,2,3),grass:false},
    {id:"east-bank",material:"stone",vertices:[[21,0],[32,0],[32,6],[27,6],[24,3],[21,3]],grass:true},
    {id:"shelf",material:"stone",vertices:rectangle(1,6,7,0.65),grass:false},
    {id:"shelf-pier",material:"stone",vertices:rectangle(1,3,0.6,3),grass:false},
    {id:"shelf-pier-east",material:"stone",vertices:rectangle(7.4,3,0.6,3),grass:false}
  ],
  hazards:[
    {id:"west-water",kind:"water",vertices:rectangle(9,0,5,2.1)},
    {id:"east-water",kind:"water",vertices:rectangle(16,0,5,2.1)}
  ],
  objects:[
    {id:"beam",kind:"beam",material:"timber",vertices:rectangle(1.5,6.65,6,0.42)},
    {id:"gate",kind:"gate",material:"timber",vertices:rectangle(22.7,3,0.42,3.4),hinge:[22.91,3]},
    {id:"wedge",kind:"wedge",material:"cheese",vertices:[[4,3],[6.4,3],[6.4,4.4]]},
    {id:"crate",kind:"crate",material:"timber",vertices:rectangle(17.8,2.1,1.3,1.3),decorative:true}
  ],
  decor:[
    {kind:"lantern",x:1.3,y:5.2},{kind:"lantern",x:7.7,y:5.2},{kind:"lantern",x:28.2,y:8.1},
    {kind:"fern",x:0.8,y:3},{kind:"fern",x:8.4,y:3},{kind:"fern",x:25.7,y:4.7},{kind:"fern",x:31.4,y:6}
  ]
});

export function validateRoom(room) {
  if (!room || room.schemaVersion !== 1 || typeof room.id !== "string") throw new Error("Unsupported room schema");
  const b=room.bounds;
  if (!b || ![b.minX,b.maxX,b.minY,b.maxY].every(Number.isFinite) || b.maxX<=b.minX || b.maxY<=b.minY) throw new Error("Invalid room bounds");
  const ids=new Set();
  for (const item of [...room.terrain,...room.hazards,...room.objects]) {
    if (typeof item.id!=="string" || ids.has(item.id)) throw new Error("Duplicate or missing object ID");
    ids.add(item.id);
    if (!boundsContain(b,polygonBounds(item.vertices)) || signedArea(item.vertices)<=1e-8) throw new Error("Invalid room polygon: "+item.id);
  }
  const {spawn,exit}=room;
  if (![spawn.x,spawn.y,exit.x,exit.y,exit.width,exit.height].every(Number.isFinite) || exit.width<=0||exit.height<=0 ||
    !boundsContain(b,{minX:spawn.x,maxX:spawn.x,minY:spawn.y,maxY:spawn.y}) ||
    !boundsContain(b,{minX:exit.x-exit.width/2,maxX:exit.x+exit.width/2,minY:exit.y,maxY:exit.y+exit.height})) throw new Error("Invalid spawn or exit");
  return room;
}
