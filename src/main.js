import { createAppState } from "./core/app-state.js";
import { mountViewport } from "./rendering/viewport.js";
import { mountIdentity } from "./ui/identity.js";
import { mountRoomPreview } from "./ui/room-preview.js";
import { mountResults } from "./ui/results.js";
import { createBestResults } from "./core/best-results.js";
import {LEVEL_ROUTES,campaignProgress} from "./levels/campaign.js";
import {mountCampaign} from "./ui/campaign.js";

/** Export startup separately so it can be tested without loading a browser. */
export function startApp(document, view) {
  const canvas = document.getElementById("world");
  const host = document.querySelector(".game-viewport");
  const status = document.getElementById("app-status");
  if (!canvas || !host || !status) throw new Error("Missing Shapeweaver application shell");
  const state = createAppState();
  const viewport = mountViewport(canvas, host, view);
  status.textContent = viewport
    ? "Choose a puzzle in the adventure library, practise a spell or explore the spellbook."
    : "Canvas is unavailable in this browser. The game requires Canvas 2D.";
  let identity=null;
  const bestResults=createBestResults(view);
  const campaign=typeof document.createElement==="function"?mountCampaign(document,bestResults,next=>identity?.show(next)):null;
  const results=typeof document.createElement==="function"?mountResults(document,next=>identity?.show(next)):null;
  const room=typeof view.Image==="function"?mountRoomPreview(document,view,{onComplete(result){
    const best=bestResults.record(result);
    if(!results||!identity)return;
    const index=LEVEL_ROUTES.indexOf(state.view);
    if(index<0)return;
    results.show(result,best,LEVEL_ROUTES[index],LEVEL_ROUTES[index+1]??null,campaignProgress(bestResults));
    identity.show("results");
  }}):null;
  identity=typeof document.querySelectorAll==="function"?mountIdentity(document,state,next=>{
    const playable=next==="room"||LEVEL_ROUTES.includes(next);
    if(next==="campaign")campaign?.render();
    if(next!=="results")results?.clear();
    if(playable)room?.setLevel(next);
    room?.setActive(playable);
    state.playable=playable&&Boolean(room);
  }):null;
  return { state, viewport, identity, room, results, bestResults, campaign };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  try {
    startApp(document, window);
  } catch (error) {
    const status = document.getElementById("app-status");
    if (status) status.textContent = "Shapeweaver could not start. Try refreshing the page.";
    console.error("Shapeweaver startup failed", error);
  }
}
