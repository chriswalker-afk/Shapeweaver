const PARAMETER_HELP={
  translate:"Enter both signed components of the column vector, including zero if needed.",
  rotate:"Choose an angle and direction, and enter both centre coordinates.",
  enlarge:"Enter a positive scale factor (a number or fraction) and both centre coordinates.",
  reflect:"Enter an equation of the form x = a, y = b, y = x or y = −x."
};
const ADVICE={
  "not-selectable":"Select an outlined object or choose one from the object list.",
  permission:"Choose a transformation from this object's allowed list.",
  hinge:"Read the labelled hinge coordinates and use them as the centre.",
  "scale-limit":"Use a factor within the listed per-cast range.",
  identity:"Choose a transformation that changes at least one reference point.",
  geometry:"Check the numbers and use a non-degenerate image.",
  bounds:"Use the grid to check that every image vertex lies within the room.",
  "path-bounds":"Check the entire arc, not just the final image.",
  "solid-overlap":"Adjust the parameters so the image does not overlap solid terrain or another object.",
  "hazard-overlap":"Choose a dry, clear destination.",
  unsupported:"Place the image on a supporting surface.",
  "player-supported":"Close Objects and step off the object first.",
  "player-overlap":"Close Objects and move the apprentice away from the intended image.",
  "path-player":"Close Objects and move the apprentice away from the spell's path.",
  "player-unsafe":"Return to safety or reposition the apprentice before trying again.",
  "gate-obstructed":"Move clear of the linked gate or reposition the object blocking it before releasing the plate.",
  "path-solid":"Change the parameters so the complete travel path is clear.",
  "path-hazard":"Choose a path that avoids hazards.",
  "attempt-ended":"Use Undo if available or Reset for a fresh attempt.",
  unavailable:"Finish the current action or select a permitted transformation."
};
/** Textual recovery advice supplements (never replaces) precise validator reasons. */
export function transformationFeedback(preview,type){
  if(!preview)return "";
  if(preview.ok)return preview.message;
  const advice=preview.code==="parameters"?PARAMETER_HELP[type]:ADVICE[preview.code];
  return "Not applied. "+preview.message+(advice?" "+advice:"")+" No move used.";
}
