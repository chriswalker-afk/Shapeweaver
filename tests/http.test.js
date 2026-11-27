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
  assert.match(html, /src="\.\/src\/main\.js"/);
  const entry = await fetch(origin + base + "src/main.js");
  assert.match(entry.headers.get("content-type"), /javascript/);
  assert.match(await entry.text(), /startApp/);
  for (const path of ["src/core/app-state.js", "src/rendering/viewport.js", "src/styles.css", "src/ui/identity.js"]) {
    assert.equal((await fetch(origin + base + path)).status, 200);
  }
  for (const path of ["ui/crest.svg", "ui/translate.svg", "ui/rotate.svg", "ui/enlarge.svg", "ui/reflect.svg", "characters/apprentice.svg", "environments/gatehouse-title.svg"]) {
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
