import {ACROSS_THE_BROOK} from "./across-the-brook.js";
import {STUBBORN_GATE} from "./stubborn-gate.js";
import {LITTLE_CHEESY} from "./little-cheesy.js";
import {MISSING_BARREL} from "./missing-barrel.js";
import {TWO_SMALL_PROBLEMS,SECRET_GARDEN} from "./enchanted-gardens.js";
import {MIND_THE_GAP,ABOVE_AND_BELOW} from "./garden-finale.js";
import {FIND_THE_HINGE,A_TIGHT_SQUEEZE} from "./clockwork-gallery.js";
import {WRONG_WAY_ROUND,THE_GIANT_KEY} from "./clockwork-finale.js";
export const CHAPTERS=Object.freeze([
 [1,"The Gatehouse",1,4],[2,"The Enchanted Gardens",5,8],[3,"The Clockwork Gallery",9,12],[4,"The Riverworks",13,18],[5,"The Mirror Archives",19,24],[6,"The Alchemist’s Workshop",25,30],[7,"The Celestial Observatory",31,36]
].map(([id,title,first,last])=>Object.freeze({id,title,first,last})));
export const LEVELS=Object.freeze([ACROSS_THE_BROOK,STUBBORN_GATE,LITTLE_CHEESY,MISSING_BARREL,TWO_SMALL_PROBLEMS,SECRET_GARDEN,MIND_THE_GAP,ABOVE_AND_BELOW,FIND_THE_HINGE,A_TIGHT_SQUEEZE,WRONG_WAY_ROUND,THE_GIANT_KEY].map(room=>Object.freeze({id:room.id,route:"level"+room.number,number:room.number,title:room.title,chapter:room.chapter,spells:Object.freeze(room.tutorial.spells??[room.tutorial.spell??"translate"]),math:room.tutorial.mathDifficulty??1,puzzle:room.tutorial.puzzleDifficulty??1,room})));
export const LEVEL_ROUTES=Object.freeze(LEVELS.map(l=>l.route));
export function filterLevels({spell="",math="",puzzle="",chapter=""}={}){
 return LEVELS.filter(l=>(!spell||l.spells.includes(spell))&&(!math||String(l.math)===String(math))&&(!puzzle||String(l.puzzle)===String(puzzle))&&(!chapter||String(l.chapter)===String(chapter)));
}
export function campaignProgress(best){
 const done=LEVELS.filter(l=>best.get(l.id));
 return {completed:done.length,total:LEVELS.length,stars:done.reduce((n,l)=>n+best.get(l.id).stars,0),maximum:3*LEVELS.length,next:LEVELS.find(l=>!best.get(l.id))??LEVELS[0]};
}
