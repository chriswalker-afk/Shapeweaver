import { createAppState } from "./core/app-state.js";
import { mountViewport } from "./rendering/viewport.js";
import { mountIdentity } from "./ui/identity.js";
import { mountRoomPreview } from "./ui/room-preview.js";
import { mountResults } from "./ui/results.js";
import { createBestResults } from "./core/best-results.js";
import {LEVEL_ROUTES,campaignProgress} from "./levels/campaign.js";
import {mountCampaign} from "./ui/campaign.js";
import {createResumeLevel,homeContinuation} from "./core/home-progress.js";
import {renderHome} from "./ui/home.js";
import {mountHomeShowcase} from "./ui/home-showcase.js";

/** Export startup separately so it can be tested without loading a browser. */
export function startApp(document, view) {
  const canvas = document.getElementById("world");
  const host = document.querySelector(".game-viewport");
  const status = document.getElementById("app-status");
  if (!canvas || !host || !status) throw new Error("Missing Shapeweaver application shell");
  const state = createAppState();
  const viewport = mountViewport(canvas, host, view);
  status.textContent = viewport
    ? ""
    : "Canvas is unavailable in this browser. The game requires Canvas 2D.";
  let identity=null;
  const bestResults=createBestResults(view),resumeLevel=createResumeLevel(view);
  let activeRoute=null,paused=null;
  const continuation=()=>homeContinuation(bestResults,paused?.route,resumeLevel.route);
  const updateHome=()=>renderHome(document,bestResults,paused?.route,resumeLevel.route);
  const campaign=typeof document.createElement==="function"?mountCampaign(document,bestResults,next=>identity?.show(next)):null;
  const results=typeof document.createElement==="function"?mountResults(document,next=>identity?.show(next)):null;
  const room=typeof view.Image==="function"?mountRoomPreview(document,view,{onComplete(result){
    const index=LEVEL_ROUTES.indexOf(state.view);
    if(index<0)return;
    const best=bestResults.record(result);
    paused=null;resumeLevel.clear();
    if(!results||!identity)return;
    results.show(result,best,LEVEL_ROUTES[index],LEVEL_ROUTES[index+1]??null,campaignProgress(bestResults));
    identity.show("results");
  }}):null;
  const homeShowcase=mountHomeShowcase(document,view);
  identity=typeof document.querySelectorAll==="function"?mountIdentity(document,state,(next,{resume=false}={})=>{
    const playable=next==="room"||LEVEL_ROUTES.includes(next);
    if(LEVEL_ROUTES.includes(activeRoute)&&room&&!room.getPlayer().completed){
      paused={route:activeRoute,attempt:room.captureAttempt()};
    }
    room?.setActive(false);
    if(next==="campaign")campaign?.render();
    if(next!=="results")results?.clear();
    if(playable){
      if(LEVEL_ROUTES.includes(next)){
        const attempt=resume&&paused?.route===next?paused.attempt:null;
        room?.setLevel(next,attempt);paused=null;resumeLevel.set(next);
      }else room?.setLevel(next);
      room?.setActive(true);
    }
    activeRoute=playable?next:null;
    state.playable=playable&&Boolean(room);
    if(next==="title")updateHome();
    homeShowcase?.setActive(next==="title");
  },{continueRoute:()=>continuation().route}):null;
  if(identity){updateHome();homeShowcase?.setActive(true);}
  return { state, viewport, identity, room, results, bestResults, campaign, homeShowcase };
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
