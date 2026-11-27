import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SPELLS, getSpell, mountIdentity } from "../src/ui/identity.js";
import { createAppState } from "../src/core/app-state.js";

test("four distinct spell identities, valid formal labels and local asset manifest", async () => {
  assert.deepEqual(SPELLS.map(x => x.label), ["Translation", "Rotation", "Enlargement", "Reflection"]);
  assert.equal(new Set(SPELLS.map(x => x.color)).size, 4);
  assert.equal(getSpell("unknown"), null);
  const manifest = JSON.parse(await readFile(new URL("../assets/manifest.json", import.meta.url), "utf8"));
  for (const item of manifest.assets) {
    const svg = await readFile(new URL("../assets/" + item.path, import.meta.url), "utf8");
    assert.match(svg, /^<svg /);
    assert.ok(item.provenance);
    assert.doesNotMatch(svg, /<script|<image|href=["']https?:/i);
  }
  for (const spell of SPELLS) {
    assert.ok(spell.example.length > 12);
    assert.ok(manifest.assets.some(item => "assets/" + item.path === spell.icon));
  }
});

function element(dataset = {}) {
  const listeners = new Map();
  const attributes = {};
  return { dataset, listeners, attributes, hidden: false, style: { setProperty(k,v) { attributes[k] = v; } },
    setAttribute(k,v) { attributes[k] = v; },
    addEventListener(k,v) { listeners.set(k,v); }, removeEventListener(k,v) { if (listeners.get(k) === v) listeners.delete(k); },
    focus() { this.focused = true; },
    click() { listeners.get("click")?.(); } };
}
test("spellbook opens, selects all spells, returns to title and cleans up", () => {
  const ids = ["title-view","spellbook-view","spell-name","spell-description","spell-example","spell-image","spell-detail","open-spellbook","close-spellbook","spellbook-heading","translation-vector"];
  const elements = Object.fromEntries(ids.map(id => [id,element()]));
  elements["spellbook-view"].hidden = true;
  const buttons = SPELLS.map(spell => element({spell:spell.id}));
  const document = { getElementById: id => elements[id], querySelectorAll: () => buttons };
  const state = createAppState();
  const ui = mountIdentity(document,state);
  elements["open-spellbook"].click();
  assert.equal(state.view,"spellbook");
  assert.equal(elements["title-view"].hidden,true);
  assert.equal(elements["spellbook-view"].hidden,false);
  assert.equal(elements["spellbook-heading"].focused,true);
  for (const [i,button] of buttons.entries()) {
    button.click();
    assert.equal(state.selectedSpell,SPELLS[i].id);
    assert.equal(elements["spell-name"].textContent,SPELLS[i].label);
    assert.equal(elements["spell-example"].textContent,SPELLS[i].example);
    assert.equal(elements["translation-vector"].hidden,SPELLS[i].id !== "translate");
    assert.equal(elements["spell-detail"].attributes["--spell-colour"],SPELLS[i].color);
    assert.equal(buttons.filter(x => x.attributes["aria-pressed"] === "true").length,1);
    assert.equal(button.attributes["aria-pressed"],"true");
    assert.ok(elements["spell-image"].src.endsWith(SPELLS[i].icon));
  }
  assert.equal(ui.select("invalid"),false);
  elements["close-spellbook"].click();
  assert.equal(state.view,"title");
  assert.equal(elements["spellbook-view"].hidden,true);
  assert.equal(elements["open-spellbook"].focused,true);
  ui.destroy();
  assert.equal(buttons.every(x => x.listeners.size === 0),true);
  assert.equal(elements["open-spellbook"].listeners.size,0);
});

test("title opens the room, refreshes the renderer and returns to the title", () => {
  const ids=["title-view","spellbook-view","spell-name","spell-description","spell-example","spell-image","spell-detail","open-spellbook","close-spellbook","spellbook-heading","translation-vector","room-view","title-art","open-room","close-room","room-heading"];
  const elements=Object.fromEntries(ids.map(id=>[id,element()]));
  elements["spellbook-view"].hidden=true;
  elements["room-view"].hidden=true;
  const buttons=SPELLS.map(spell=>element({spell:spell.id}));
  const document={getElementById:id=>elements[id],querySelectorAll:()=>buttons};
  const state=createAppState(), changes=[];
  const ui=mountIdentity(document,state,next=>changes.push(next));
  elements["open-room"].click();
  assert.equal(state.view,"room");
  assert.equal(elements["title-view"].hidden,true);
  assert.equal(elements["spellbook-view"].hidden,true);
  assert.equal(elements["room-view"].hidden,false);
  assert.equal(elements["title-art"].hidden,true);
  assert.equal(elements["room-heading"].focused,true);
  elements["close-room"].click();
  assert.equal(state.view,"title");
  assert.equal(elements["room-view"].hidden,true);
  assert.equal(elements["title-art"].hidden,false);
  assert.equal(elements["title-view"].hidden,false);
  assert.deepEqual(changes,["room","title"]);
  ui.destroy();
  assert.equal(elements["open-room"].listeners.size,0);
});
