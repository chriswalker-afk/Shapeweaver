import {ACROSS_THE_BROOK} from "./across-the-brook.js";
import {STUBBORN_GATE} from "./stubborn-gate.js";
import {LITTLE_CHEESY} from "./little-cheesy.js";
import {MISSING_BARREL} from "./missing-barrel.js";
import {TWO_SMALL_PROBLEMS,SECRET_GARDEN} from "./enchanted-gardens.js";
import {MIND_THE_GAP,ABOVE_AND_BELOW} from "./garden-finale.js";
import {FIND_THE_HINGE,A_TIGHT_SQUEEZE} from "./clockwork-gallery.js";
import {WRONG_WAY_ROUND,THE_GIANT_KEY} from "./clockwork-finale.js";
import {BRIDGE_BUILDERS,BROKEN_STAIRCASE} from "./riverworks.js";
import {DOUBLE_TROUBLE,DIAGONAL_DOCK} from "./riverworks-mechanisms.js";
import {WATERMILL,AROUND_THE_TOWER} from "./riverworks-finale.js";
import {BRING_IT_WITH_YOU,A_BRIDGE_AND_A_LADDER} from "./mirror-archives.js";
import {NO_GOING_BACK,LOCKED_PASSAGE} from "./archives-latches.js";
import {THE_DOUBLE_SEAL,THE_ARCHIVISTS_CHAIN} from "./archives-finale.js";
import {TOO_BIG_TO_FIT,SMALL_NOW_BIG_LATER} from "./alchemist-workshop.js";
import {THE_WANDERING_PIVOT,THE_MIRRORED_MECHANISM} from "./alchemist-pivots.js";
import {ONE_OPENS_ONE_CLOSES,THE_ALCHEMISTS_TRIAL} from "./alchemist-finale.js";
import {THE_WANDERING_MIRROR,THE_ASTRONOMERS_BRIDGE} from "./observatory-mirrors.js";
import {THREE_WAYS_ACROSS,THE_LOST_STAR} from "./observatory-routes.js";
import {THE_OBSERVATORY_MACHINE,THE_FINAL_ASCENT} from "./observatory-finale.js";
export const CHAPTERS=Object.freeze([
 [1,"The Gatehouse",1,4],[2,"The Enchanted Gardens",5,8],[3,"The Clockwork Gallery",9,12],[4,"The Riverworks",13,18],[5,"The Mirror Archives",19,24],[6,"The Alchemist’s Workshop",25,30],[7,"The Celestial Observatory",31,36]
].map(([id,title,first,last])=>Object.freeze({id,title,first,last})));
export const LEVELS=Object.freeze([ACROSS_THE_BROOK,STUBBORN_GATE,LITTLE_CHEESY,MISSING_BARREL,TWO_SMALL_PROBLEMS,SECRET_GARDEN,MIND_THE_GAP,ABOVE_AND_BELOW,FIND_THE_HINGE,A_TIGHT_SQUEEZE,WRONG_WAY_ROUND,THE_GIANT_KEY,BRIDGE_BUILDERS,BROKEN_STAIRCASE,DOUBLE_TROUBLE,DIAGONAL_DOCK,WATERMILL,AROUND_THE_TOWER,BRING_IT_WITH_YOU,A_BRIDGE_AND_A_LADDER,NO_GOING_BACK,LOCKED_PASSAGE,THE_DOUBLE_SEAL,THE_ARCHIVISTS_CHAIN,TOO_BIG_TO_FIT,SMALL_NOW_BIG_LATER,THE_WANDERING_PIVOT,THE_MIRRORED_MECHANISM,ONE_OPENS_ONE_CLOSES,THE_ALCHEMISTS_TRIAL,THE_WANDERING_MIRROR,THE_ASTRONOMERS_BRIDGE,THREE_WAYS_ACROSS,THE_LOST_STAR,THE_OBSERVATORY_MACHINE,THE_FINAL_ASCENT].map(room=>Object.freeze({id:room.id,route:"level"+room.number,number:room.number,title:room.title,chapter:room.chapter,spells:Object.freeze(room.tutorial.spells??[room.tutorial.spell??"translate"]),math:room.tutorial.mathDifficulty??1,puzzle:room.tutorial.puzzleDifficulty??1,room})));
export const LEVEL_ROUTES=Object.freeze(LEVELS.map(l=>l.route));
export function filterLevels({spell="",math="",puzzle="",chapter=""}={}){
 return LEVELS.filter(l=>(!spell||l.spells.includes(spell))&&(!math||String(l.math)===String(math))&&(!puzzle||String(l.puzzle)===String(puzzle))&&(!chapter||String(l.chapter)===String(chapter)));
}
export function campaignProgress(best){
 const done=LEVELS.filter(l=>best.get(l.id));
 return {completed:done.length,total:LEVELS.length,stars:done.reduce((n,l)=>n+best.get(l.id).stars,0),maximum:3*LEVELS.length,next:LEVELS.find(l=>!best.get(l.id))??LEVELS[0]};
}
