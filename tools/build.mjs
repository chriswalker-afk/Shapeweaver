import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

/** Only publish the explicit public app tree, not tests, tooling or docs. */
export async function build(root = projectRoot) {
  const dist = resolve(root, "dist");
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  for (const path of ["index.html", "src", "assets"]) {
    const source = resolve(root, path);
    if (path === "assets") {
      try { await stat(source); } catch (error) { if (error.code === "ENOENT") continue; throw error; }
    }
    const target = resolve(dist, path);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
  }
  return dist;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log("Built " + await build());
}
