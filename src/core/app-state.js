/** Public application identity. Keep version in sync with package.json and index.html. */
export const APP = Object.freeze({ name: "Shapeweaver", version: "1.0.0", stage: "PR36" });
export function createAppState() {
  return { stage: APP.stage, mode: "production", playable: false, view: "title", selectedSpell: "translate" };
}
