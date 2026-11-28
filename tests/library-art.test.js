import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {CHAPTER_ART} from "../src/ui/campaign.js";
import {CHAPTERS} from "../src/levels/campaign.js";
test("all seven chapter illustrations are original, distinct, local and within budget",async()=>{
 const manifest=JSON.parse(await readFile(new URL("../assets/manifest.json",import.meta.url),"utf8"));
 assert.equal(CHAPTER_ART.length,CHAPTERS.length);assert.equal(new Set(CHAPTER_ART).size,7);
 const files=await Promise.all(CHAPTER_ART.map(p=>readFile(new URL("../assets/"+p,import.meta.url),"utf8")));
 for(const [i,svg] of files.entries()){
  const item=manifest.assets.find(a=>a.path===CHAPTER_ART[i]);assert.ok(item?.provenance.includes("PR41"));assert.ok(item.rights);
  assert.match(svg,/viewBox="0 0 320 160"/);assert.ok(svg.includes("<title>"+CHAPTERS[i].title+"</title>"));
  assert.doesNotMatch(svg,/<(?:script|image|foreignObject|animate|set)\b|\bon\w+=|href=["']https?:|url\(https?:/i);
 }
 assert.equal(new Set(files).size,7);assert.ok(files.reduce((n,s)=>n+Buffer.byteLength(s),0)<65*1024);
});

test("application shell has unique IDs and distinct home and selected-puzzle details",async()=>{
 const html=await readFile(new URL("../index.html",import.meta.url),"utf8");
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,"duplicate HTML IDs");
 assert.match(html,/<span id="library-detail">Explore all 36 puzzles/);
 assert.match(html,/<aside id="library-selected-detail"[^>]*hidden/);
});
