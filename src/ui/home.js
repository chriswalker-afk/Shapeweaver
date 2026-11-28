import {homeContinuation} from "../core/home-progress.js";
export const HOME_HERO="environments/home-kingdom.svg";
export const HOME_ART=Object.freeze(["ui/home-continue.svg","ui/home-library.svg","ui/home-spellbook.svg","ui/home-practice.svg"]);
/** Home is a view of existing progress, not a second source of scores. */
export function renderHome(document,best,pausedRoute,savedRoute){
 const state=homeContinuation(best,pausedRoute,savedRoute),$=id=>document.getElementById(id),set=(id,value)=>{const el=$(id);if(el)el.textContent=value;};
 set("continue-detail",state.detail);set("continue-note",state.note);
 const note=$("continue-note");if(note)note.hidden=!state.note;
 set("home-progress-text",state.progress.completed+" / "+state.progress.total+" puzzles");
 set("home-stars-text",state.progress.stars+" / "+state.progress.maximum+" stars");
 const bar=$("home-progress-bar");if(bar){bar.max=state.progress.total;bar.value=state.progress.completed;}
 $("open-continue")?.setAttribute("data-continuation",state.kind);
 return state;
}
