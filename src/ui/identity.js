/** Canonical spell identity. Keep formal maths names visible throughout the game. */
export const SPELLS = Object.freeze([
  Object.freeze({"id":"translate","label":"Translation","color":"#4EADC3","description":"Move without turning or resizing.","example":"Column vector: (4, −2) — four right, two down.","icon":"assets/ui/translate.svg"}),
  Object.freeze({"id":"rotate","label":"Rotation","color":"#D5A044","description":"Turn about a chosen centre.","example":"90° clockwise about (2, 3).","icon":"assets/ui/rotate.svg"}),
  Object.freeze({"id":"enlarge","label":"Enlargement","color":"#65A77A","description":"Change size about a centre, preserving shape.","example":"Scale factor 2, centre (1, 1).","icon":"assets/ui/enlarge.svg"}),
  Object.freeze({"id":"reflect","label":"Reflection","color":"#A57ACB","description":"Flip a shape across a mirror line.","example":"Reflection in the line x = 5.","icon":"assets/ui/reflect.svg"}),
]);

export function getSpell(id) {
  return SPELLS.find(spell => spell.id === id) ?? null;
}

/** Title and spellbook are real views; no gameplay is simulated by this menu. */
export function mountIdentity(document, state) {
  const title = document.getElementById("title-view");
  const book = document.getElementById("spellbook-view");
  const name = document.getElementById("spell-name");
  const description = document.getElementById("spell-description");
  const example = document.getElementById("spell-example");
  const icon = document.getElementById("spell-image");
  const panel = document.getElementById("spell-detail");
  if (!title || !book || !name || !description || !example || !icon || !panel) return null;
  const buttons = Array.from(document.querySelectorAll("[data-spell]"));
  const listeners = [];
  function on(element, fn) {
    if (!element) return;
    element.addEventListener("click", fn);
    listeners.push([element, fn]);
  }
  function select(id) {
    const spell = getSpell(id);
    if (!spell) return false;
    state.selectedSpell = id;
    for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.spell === id));
    name.textContent = spell.label;
    description.textContent = spell.description;
    example.textContent = spell.example;
    icon.src = new URL("../../" + spell.icon, import.meta.url).href;
    panel.style.setProperty("--spell-colour", spell.color);
    return true;
  }
  function show(view) {
    if (view !== "title" && view !== "spellbook") return false;
    state.view = view;
    title.hidden = view !== "title";
    book.hidden = view !== "spellbook";
    (view === "title" ? document.getElementById("open-spellbook") : document.getElementById("spellbook-heading"))?.focus();
    return true;
  }
  for (const button of buttons) on(button, () => select(button.dataset.spell));
  on(document.getElementById("open-spellbook"), () => show("spellbook"));
  on(document.getElementById("close-spellbook"), () => show("title"));
  select(state.selectedSpell);
  return { select, show, destroy() { for (const [element, fn] of listeners) element.removeEventListener("click", fn); } };
}
