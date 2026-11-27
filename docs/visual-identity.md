# Shapeweaver visual identity — PR02

## Direction
Enchanted storybook adventure: twilight violet, warm brass/gold, autumn stone and muted teal water. A small purple-hooded apprentice with russet scarf, leather boots and a geometric lantern-staff. Use distinct silhouettes, restrained fine linework, aged materials, soft atmospheric layers and jewel-like magic. This first artwork is original stylised SVG, not a hand-painted raster asset or the final game art. The original illustrated concept remains the quality target; enhance texture, depth and animation in later renderer/art passes.

## Branding and interface
Wordmark: large warm-gold serif, normal text for accessibility. Crest: overlapping squares/diamond, axes and central star. Typography uses Georgia/Times and system sans to avoid network fonts; display titles serif, parameters/labels sans with tabular numerals where appropriate.
- Deep night #211C31, ink #352A3D, brass #E2BE85, parchment #F3E4C7, muted violet #73578E.
- Translation #4EADC3 (four-direction arrows), rotation #D5A044 (arc/pivot), enlargement #65A77A (nested similar shapes), reflection #A57ACB (mirrored triangles and dashed line). Consistent formal labels; colour is not the only distinction.
- Parchment panels and gold action buttons; dark spell sigils for reliable contrast. No giant permanent HUD. Compact header, collapse secondary information; responsive short-landscape and portrait layouts. Preserve large gameplay space when PR03 introduces actual world view.
- Title screen and working spellbook preview have no fake Play button. Keyboard navigation, aria-pressed spell selection, live descriptions, focus on view changes, reduced motion. Use explicit not-yet-playable status until game engine works.

## Chapter palette and silhouettes
| Chapter | Key shapes / environment | Palette direction |
| --- | --- | --- |
| Gatehouse | Weathered arches, autumn leaves, portal, brook | Moss, russet, violet, gold |
| Enchanted Gardens | Curved hedges, mushrooms, pergolas | Sage, pink, cream, plum |
| Clockwork Gallery | Brass cogs, pendulums, mechanical towers | Copper, teal, smoky plum |
| Riverworks | Aqueducts, mills and waterfalls | Deep teal, slate, timber |
| Mirror Archives | Bookshelves, tall glass and mirror rails | Indigo, silver, amethyst |
| Alchemist's Workshop | Rounded glass, tubes, bottles | Amber, jade, rose |
| Celestial Observatory | Domes, armillary rings, stars | Midnight blue, violet, antique gold |

## Asset contract for PR03 onward
Title art is a single composed backdrop with no physical role. Character SVG is separate (120×168 viewBox) and has a small decorative shadow; future sprites need a consistent measured foot anchor, bounding box and animation poses. Create separate parallax layers, terrain modules, objects, gates and exit effects; use authoritative collision shapes and exact world units, not title image coordinates. Keep background silhouettes less contrasty than playable geometry, hazards distinct, portals readable and selected objects clearly outlined. Do not bake coordinate grid or HUD into illustrations. Use versioned manifest, no third-party hotlinks, preserve relative asset URLs. Use vector assets where helpful; richer illustrated assets may follow with provenance.

## QA
Check title and spellbook at 1920×1080, 1366×768, 1280×720, short landscape and phone portrait. Confirm no overlap, accessible focus/contrast, readable spell labels and navigation, reduced-motion behaviour. Verify local and Pages subpath asset loading. Automated tests verify identity data, asset shipping and navigation semantics; actual visual sign-off requires browser screenshots.
