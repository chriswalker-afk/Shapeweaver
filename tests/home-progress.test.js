import test from "node:test";
import assert from "node:assert/strict";
import {createResumeLevel,homeContinuation,RESUME_KEY} from "../src/core/home-progress.js";
import {createBestResults} from "../src/core/best-results.js";
import {LEVELS} from "../src/levels/campaign.js";
import {renderHome,HOME_ART} from "../src/ui/home.js";
import {readFile} from "node:fs/promises";
const best=()=>createBestResults({});
const solve=(scores,l,stars=3)=>scores.record({levelId:l.id,moves:l.room.tutorial.efficientMoves,stars});
test("Continue begins at Level 1 and chooses the next unfinished puzzle despite out-of-order completion",()=>{
 const s=best();assert.equal(homeContinuation(s).kind,"begin");assert.equal(homeContinuation(s).route,"level1");
 solve(s,LEVELS[0]);solve(s,LEVELS[2]);assert.equal(homeContinuation(s).route,"level2");assert.equal(homeContinuation(s).kind,"next");assert.equal(homeContinuation(s).progress.stars,6);
});
test("Continue prioritises the single paused attempt, then a saved unfinished route; completed campaign goes to library",()=>{
 const s=best();solve(s,LEVELS[0]);
 assert.equal(homeContinuation(s,"level8","level9").route,"level8");
 assert.equal(homeContinuation(s,"level8","level9").kind,"resume");
 assert.equal(homeContinuation(s,null,"level9").kind,"reopen");
 assert.match(homeContinuation(s,null,"level9").note,/entrance/);
 assert.equal(homeContinuation(s,null,"level1").route,"level2");
 assert.equal(homeContinuation(s,"room","bad").route,"level2");
 for(const l of LEVELS)solve(s,l);
 assert.equal(homeContinuation(s,null,"level9").route,"campaign");assert.equal(homeContinuation(s,"level8","level9").route,"level8");
 assert.equal(homeContinuation(s).progress.stars,108);
});
test("remembered route validates schema and survives unavailable storage within session",()=>{
 const map=new Map(),view={localStorage:{getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}};
 const r=createResumeLevel(view);r.set("level36");assert.equal(createResumeLevel(view).route,"level36");r.set("room");assert.equal(createResumeLevel(view).route,null);
 for(const raw of ["not json",JSON.stringify({version:2,route:"level2"}),JSON.stringify({version:1,route:"level37"})]){map.set(RESUME_KEY,raw);assert.equal(createResumeLevel(view).route,null);}
 const blocked=createResumeLevel({get localStorage(){throw Error("denied");}});blocked.set("level2");assert.equal(blocked.route,"level2");blocked.clear();assert.equal(blocked.route,null);
});
test("home derives its progress and distinct illustrations from real authored data",async()=>{
 const s=best();solve(s,LEVELS[0],2);const ids=["continue-detail","continue-note","home-progress-text","home-stars-text","home-progress-bar","open-continue"];
 const els=Object.fromEntries(ids.map(id=>[id,{setAttribute(k,v){this[k]=v;}}]));
 const state=renderHome({getElementById:id=>els[id]},s,null,null);
 assert.equal(state.route,"level2");assert.equal(els["home-progress-text"].textContent,"1 / 36 puzzles");assert.equal(els["home-stars-text"].textContent,"2 / 108 stars");assert.equal(els["home-progress-bar"].value,1);
 const html=await readFile(new URL("../index.html",import.meta.url),"utf8"),home=html.slice(html.indexOf('id="title-view"'),html.indexOf('id="campaign-view"'));
 assert.equal((home.match(/<button\b/g)??[]).length,4);
 for(const asset of HOME_ART)assert.ok(home.includes('src="./assets/'+asset+'"'));
 assert.equal(new Set(HOME_ART).size,4);
});
