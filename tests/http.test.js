import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, rm, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../tools/build.mjs";
import { createStaticServer, normalizeBasePath } from "../tools/serve.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

async function withServer(options, fn) {
  const server = createStaticServer(options);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try { await fn("http://127.0.0.1:" + server.address().port); }
  finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test("valid base paths are explicit and slash terminated", () => {
  assert.equal(normalizeBasePath("/Shapeweaver/"), "/Shapeweaver/");
  assert.throws(() => normalizeBasePath("/../"));
  assert.throws(() => normalizeBasePath("/Shapeweaver"));
});

async function smoke(origin, base) {
  const page = await fetch(origin + base);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /<title>Shapeweaver<\/title>/);
  assert.match(html, /id="world"/);
  assert.match(html, /id="spellbook-view"/);
  assert.match(html, /id="open-spellbook"/);
  assert.match(html, /id="room-canvas"/);
  assert.match(html, /id="open-room"/);
  assert.match(html, /id="grid-toggle"/);
  assert.match(html, /id="axes-toggle"/);
  assert.match(html, /id="coordinate-form"/);
  assert.match(html, /data-move="jump"/);
  assert.match(html, /id="reset-practice"/);
  assert.match(html, /id="undo-cast"/);
  assert.match(html, /id="return-safety"/);
  assert.match(html, /id="object-panel"/);
  assert.match(html, /id="object-form"/);
  assert.match(html, /id="object-toggle"/);
  assert.match(html, /id="open-level1"/);
  assert.match(html, /id="open-level2"/);
  assert.match(html, /id="open-level3"/);
  assert.match(html, /id="open-level4"/);
  assert.match(html, /id="object-apply"/);
  assert.match(html, /id="results-view"/);
  assert.match(html, /id="results-history"/);
  assert.match(html, /id="results-next"/);
  assert.match(html, /id="tutorial-guidance-toggle"/);
  assert.match(html, /id="tutorial-hint-panel"/);
  assert.match(html, /id="tutorial-hint-next"/);
  assert.match(html, /id="room-secondary-tools"/);
  assert.match(html, /id="room-tools-toggle"/);
  assert.match(html, /id="open-campaign"/);
  assert.match(html, /id="campaign-view"/);
  assert.match(html, /id="campaign-levels"/);
  assert.match(html, /src="\.\/src\/main\.js"/);
  const entry = await fetch(origin + base + "src/main.js");
  assert.match(entry.headers.get("content-type"), /javascript/);
  assert.match(await entry.text(), /startApp/);
  for (const path of ["src/core/app-state.js", "src/rendering/viewport.js", "src/styles.css", "src/ui/identity.js", "src/geometry/world.js", "src/levels/gatehouse-preview.js", "src/rendering/camera.js", "src/rendering/world-art.js", "src/ui/room-preview.js", "src/geometry/coordinates.js", "src/rendering/coordinate-grid.js", "src/physics/collision.js", "src/physics/platformer.js", "src/core/fixed-loop.js", "src/ui/movement-input.js", "src/geometry/polygons.js", "src/core/object-engine.js", "src/transformations/preview-math.js", "src/ui/object-inspector.js", "src/rendering/object-overlay.js", "src/geometry/translation-sweep.js", "src/transformations/translation.js", "src/levels/across-the-brook.js", "src/geometry/rotation-sweep.js", "src/transformations/rotation.js", "src/transformations/spell-transaction.js", "src/levels/stubborn-gate.js", "src/geometry/enlargement-sweep.js", "src/transformations/enlargement.js", "src/levels/little-cheesy.js", "src/transformations/reflection.js", "src/levels/missing-barrel.js", "src/core/attempt-history.js", "src/physics/recovery.js", "src/ui/transformation-feedback.js", "src/core/level-results.js", "src/core/best-results.js", "src/ui/results.js", "src/levels/tutorial-guidance.js", "src/rendering/cast-effects.js", "src/levels/campaign.js", "src/ui/campaign.js", "src/levels/enchanted-gardens.js", "src/levels/garden-guidance.js", "src/mechanisms/pressure-plates.js", "src/mechanisms/mushroom.js", "src/mechanisms/transformable-ladders.js", "src/levels/garden-finale.js", "src/levels/garden-finale-guidance.js", "src/levels/clockwork-gallery.js", "src/levels/clockwork-guidance.js", "src/mechanisms/hinge-sockets.js", "src/mechanisms/shape-sockets.js", "src/levels/clockwork-finale.js", "src/levels/clockwork-finale-guidance.js"]) {
    assert.equal((await fetch(origin + base + path)).status, 200);
  }
  for (const path of ["ui/crest.svg", "ui/translate.svg", "ui/rotate.svg", "ui/enlarge.svg", "ui/reflect.svg", "characters/apprentice.svg", "environments/gatehouse-title.svg", "environments/gatehouse-distant.svg", "environments/gatehouse-ruins.svg", "terrain/stone.svg", "terrain/grass.svg", "terrain/timber.svg", "terrain/water.svg", "objects/portal.svg"]) {
    const response = await fetch(origin + base + "assets/" + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /image\/svg\+xml/);
  }
  assert.equal((await fetch(origin + base + "docs/game-design.md")).status, 404);
  assert.equal((await fetch(origin + base + "src/%2e%2e%2fREADME.md")).status, 404);
  assert.equal((await fetch(origin + base + "missing")).status, 404);
  assert.equal((await fetch(origin + base, { method: "POST" })).status, 405);
  const head = await fetch(origin + base, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
}

test("source HTTP smoke at root and Pages subpath", async () => {
  await withServer({ root }, origin => smoke(origin, "/"));
  await withServer({ root, basePath: "/Shapeweaver/" }, async origin => {
    assert.equal((await fetch(origin + "/")).status, 404);
    assert.equal((await fetch(origin + "/Shapeweaver", { redirect: "manual" })).status, 308);
    await smoke(origin, "/Shapeweaver/");
  });
});

test("production build includes only public app files and serves under a subpath", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "shapeweaver-test-"));
  try {
    await cp(join(root, "index.html"), join(fixture, "index.html"));
    await cp(join(root, "src"), join(fixture, "src"), { recursive: true });
    await cp(join(root, "assets"), join(fixture, "assets"), { recursive: true });
    await writeFile(join(fixture, "private.txt"), "not public");
    const dist = await build(fixture);
    await writeFile(join(dist, "stale.txt"), "remove me");
    await build(fixture);
    assert.deepEqual((await readdir(dist)).sort(), ["assets", "index.html", "src"]);
    await withServer({ root: dist, basePath: "/Shapeweaver/" }, origin => smoke(origin, "/Shapeweaver/"));
  } finally { await rm(fixture, { recursive: true, force: true }); }
});

test("workshop is opt-in locally, never part of the normal static site or production build", async ()=>{
 await withServer({root},async origin=>{
  assert.equal((await fetch(origin+"/workshop/index.html")).status,404);
  assert.equal((await fetch(origin+"/workshop/model.js")).status,404);
 });
 await withServer({root,basePath:"/Shapeweaver/",workshop:true},async origin=>{
  const page=await fetch(origin+"/Shapeweaver/workshop/index.html");
  assert.equal(page.status,200);assert.match(await page.text(),/Internal Level Workshop/);
  for(const path of ["main.js","model.js","replay.js","workshop.css"])assert.equal((await fetch(origin+"/Shapeweaver/workshop/"+path)).status,200);
  assert.equal((await fetch(origin+"/Shapeweaver/docs/roadmap.md")).status,404);
  assert.equal((await fetch(origin+"/Shapeweaver/workshop/%2e%2e%2fREADME.md")).status,404);
 });
 const fixture=await mkdtemp(join(tmpdir(),"shapeweaver-workshop-"));
 try{
  for(const path of ["index.html","src","assets","workshop"])await cp(join(root,path),join(fixture,path),{recursive:true});
  const dist=await build(fixture);assert.deepEqual((await readdir(dist)).sort(),["assets","index.html","src"]);
  await withServer({root:dist,workshop:true},async origin=>assert.equal((await fetch(origin+"/workshop/index.html")).status,404));
 }finally{await rm(fixture,{recursive:true,force:true});}
});
