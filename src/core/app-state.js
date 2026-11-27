/** Scaffold state only; future level state belongs in separate modules. */
export const APP = Object.freeze({ name: "Shapeweaver", version: "0.1.0", stage: "PR15" });

export function createAppState() {
  return { stage: APP.stage, mode: "development-preview", playable: false, view: "title", selectedSpell: "translate" };
}
