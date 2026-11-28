import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {HOME_ART,HOME_HERO} from "../src/ui/home.js";

test("bespoke home art is self-contained, unique, manifest-listed and within budget",async()=>{
 const paths=[...HOME_ART,HOME_HERO],manifest=JSON.parse(await readFile(new URL("../assets/manifest.json",import.meta.url),"utf8"));
 assert.equal(new Set(paths).size,5);
 const files=await Promise.all(paths.map(path=>readFile(new URL("../assets/"+path,import.meta.url),"utf8")));
 for(const [i,path] of paths.entries()){
  const art=files[i],entry=manifest.assets.find(a=>a.path===path);
  assert.ok(entry?.provenance.includes("PR38"));assert.ok(entry.rights);
  assert.match(art,i===4?/viewBox="0 0 1440 800"/:/viewBox="0 0 160 132"/);
  assert.doesNotMatch(art,/<(?:script|image|foreignObject|animate|set)\b|\bon\w+=|href=["']https?:|url\(https?:/i);
  assert.match(art,/<title>.+<\/title>/);assert.ok(art.endsWith("</svg>\n"));
 }
 assert.equal(new Set(files).size,5);
 assert.ok(files.reduce((n,s)=>n+Buffer.byteLength(s),0)<=65*1024,"home illustration budget");
 const html=await readFile(new URL("../index.html",import.meta.url),"utf8");
 assert.match(html,/class="scene-composition home-kingdom-composition"[^>]*aria-hidden="true"/);
 assert.ok(html.includes('href="./assets/'+HOME_HERO+'"'));
 assert.ok(html.includes('href="./assets/environments/gatehouse-title.svg"'));
});
