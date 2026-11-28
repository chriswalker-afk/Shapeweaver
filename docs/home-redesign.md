# Home page redesign — PR37

## Four actions, in reading and keyboard order
Continue (primary), Puzzle Library, Spellbook, Practice Room. The four old tutorial shortcut buttons and the fixed Chapter I badge are removed; all 36 levels remain in the library. Keep the existing brand, storybook palette and gatehouse scene. Four distinct original vector illustrations are a first pass for the cards; PR38 is the bespoke art pass. The title/intro and progress strip form the left content area, with scenery deliberately visible to the right; narrow portrait screens use a single content column with a 2×2 card grid. Short landscape screens have compact cards. Cards remain native buttons, with visible focus and reduced-motion-safe hover.

## Continue contract
- A new player opens Level 1. After completion, Continue selects the first incomplete level (out-of-order library choices are supported).
- Leaving a campaign puzzle pauses the latest attempt in memory. Home Continue resumes its actual player, immutable room geometry, cast/undo history and recovery state; practice and spellbook do not overwrite it. Selecting another campaign puzzle or using the library to select a puzzle intentionally starts a new attempt. Only one campaign attempt is parked; it is not an autosave for every level.
- The selected campaign route is remembered in a separate versioned local-storage key. After reload, Continue opens the last unfinished level from its entrance, explicitly labelled as a restart. Completed replays are not preferred after reload. Never deserialize player or geometry snapshots from storage. Best results retain their previous key, format and origin. Blocked/malformed storage does not prevent play.
- Once every puzzle is complete, Continue opens the puzzle library (unless an in-session replay is paused). The progress strip shows completed puzzles and earned stars from existing best results; no duplicate score data.
- The header home link returns to the home view without reloading, preserving the current in-tab attempt. Back from campaign rooms still opens the library; practice and spellbook return home.

## QA
Unit coverage for fresh, out-of-order, paused, remembered, invalid/blocked-storage and completed-campaign states; integration tests for restoring actual committed geometry and undo history after visiting practice. Production browser smoke exercises a real paused rotation, resumes it and completes traversal, then reloads to verify scores and the next target. Full browser QA verifies four action labels, loaded card art, keyboard Continue, menu navigation, no horizontal overflow and visible cards at desktop, small desktop, landscape and portrait phone, before checking all 144 existing level/viewport combinations. Home screenshots are retained for human inspection. No game geometry, spell legality, scoring, version or deployment settings changed.

## Next
PR38 — richer custom card illustrations and improved storybook hero art. PR39 — subtle animated mathematical spell showcase and static fallback. PR40 — home polish and manual cross-device QA. The previous optional workshop is deferred.
