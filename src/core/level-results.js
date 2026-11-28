import {deepFreeze} from "../geometry/world.js";
import {attemptSummary} from "./attempt-history.js";

const count=n=>Number.isSafeInteger(n)&&n>=0;
export function starThresholds(room){
  const target=room?.tutorial?.efficientMoves;
  if(!count(target))return null;
  const twoStar=room.tutorial.twoStarMoves??target+2;
  if(!count(twoStar)||twoStar<target)throw new Error("Invalid two-star threshold for "+room.id);
  return {threeStar:target,twoStar};
}
export function starsForMoves(moves,thresholds){
  if(!count(moves)||!thresholds||!count(thresholds.threeStar)||!count(thresholds.twoStar)||thresholds.twoStar<thresholds.threeStar)throw new Error("Invalid efficiency score");
  return moves<=thresholds.threeStar?3:moves<=thresholds.twoStar?2:1;
}
const number=n=>String(Object.is(n,-0)?0:n).replace(/-/g,"−");
const point=p=>"("+p.map(number).join(", ")+")";

/** Complete formal mathematical descriptions from the actual committed record. */
export function describeCast(record){
  switch(record.type){
    case "translate":return {name:"Translation",text:"Column vector ("+number(record.dx)+", "+number(record.dy)+")",vector:[number(record.dx),number(record.dy)]};
    case "rotate":return {name:"Rotation",text:number(record.angle)+"° "+record.direction+" about "+point(record.centre)};
    case "enlarge":return {name:"Enlargement",text:"Scale factor "+number(record.factor)+", centre "+point(record.centre)};
    case "reflect":return {name:"Reflection",text:"In the line "+record.line.replace(/-/g,"−")};
    default:throw new Error("Unknown committed transformation: "+record.type);
  }
}
/** No score for previews, unfinished attempts, blocked respawns or practice. */
export function completedResult(room,player,history){
  if(!player?.completed||player.blockedRespawn)return null;
  const thresholds=starThresholds(room);if(!thresholds)return null;
  const summary=attemptSummary(history,player);
  return deepFreeze({
    levelId:room.id,number:room.number,title:room.title,chapter:room.chapter,
    thresholds,stars:starsForMoves(summary.moves,thresholds),
    moves:summary.moves,undos:summary.undos,activeMoves:summary.activeMoves,returns:summary.respawns,
    entries:summary.entries.map(({record,undone},index)=>({
      number:index+1,objectId:record.objectId,objectLabel:(room.objects.find(o=>o.id===record.objectId)?.label??record.objectId)+(record.attachedIds?.length?" + "+record.attachedIds.map(id=>room.objects.find(o=>o.id===id)?.label??id).join(", "):""),
      type:record.type,...describeCast(record),undone
    }))
  });
}
