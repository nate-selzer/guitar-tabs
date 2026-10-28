---
name: guitar-tab-chat
description: Build a playable, editable guitar tab page, chord sheet and Guitar Pro file from a song.mjs in Claude chat (claude.ai), and apply bar and chord chart edits pasted from that page. Use in chat, not Claude Code, when the user shares a song's chords to tab, attaches a song.mjs, or pastes "Apply my edits".
---

# Guitar tab (chat)

This skill's folder holds the build: `build.mjs`, `chords.mjs`, `overrides.mjs`, `apply-edits.mjs`, `templates/`, `web/` and `vendor/`. The folder is read-only, so work in a copy. `<out>` below is your outputs folder (the one whose files the user can see).

## Build and present

1. `cp -r <this skill's folder> /tmp/tabs && chmod -R u+w /tmp/tabs` (once per chat).
2. Put the song at `/tmp/tabs/<slug>/song.mjs`: copy an attached `song.mjs` from the uploads folder, or write one (see below). The slug is lowercase words joined by hyphens.
3. `cd /tmp/tabs && node build.mjs <slug> --chat <out>`. It writes `<slug>.html`, `song.mjs`, `chords.txt` and the `.gp` file into `<out>`. Tell the user each chord-name warning and ask, rather than renaming the chord.
4. Present `<slug>.html` first so it renders for the user, then the other files. It is the deliverable, so show it without asking. It is the small `<slug>/index.html` page from this skill's `templates/tab.html`, with this skill's own `vendor/` and `web/` scripts inlined by `build.mjs`; if you need to review it before presenting, review those, never the 3.4 MB output. Never open, retype or edit the output.
5. Tell the user to keep `song.mjs` and attach it in the next chat to pick up where they left off; it holds their edits too.

## Edits

When a figure or chord chart takes more than one round of text to get right (exact notes, timings, hammer-ons, fingerings), point the user to the page's editors instead of more description: **Edit**, then click a bar to open its grid (rows = strings, high e on top; columns = sixteenths, 1 e & a); type a fret to add a note, clear a cell to remove it; the Symbols legend lists the notation; **Play bar** loops the grid; **Keep edit** applies it on the page. Or click a chord chart: pick Dot, a finger (T 1-4) or Barre, click frets to place or remove dots, click above the chart to switch open/muted, drag across strings for a barre; Play chord strums it then picks each string; Name renames it; Starting fret and Capo set the top of the chart; **Keep chart** applies it. **Copy edits for Claude** copies every kept edit to paste into the chat.

A pasted message starts with "Apply my edits to <slug>:" (older pages say "Apply my bar edits") followed by one line of JSON. To apply it:

1. If `/tmp/tabs/<slug>/song.mjs` is missing (a new chat), ask the user to attach their latest `song.mjs` and set it up as in Build and present.
2. Write that JSON line exactly as pasted to `/tmp/tabs/edits.json` with a quoted heredoc (`cat > /tmp/tabs/edits.json <<'EOF'`). Don't reformat or retype parts of it.
3. `cd /tmp/tabs && node apply-edits.mjs edits.json --chat <out>`. It writes bar edits into the `overrides` export and chart edits into the `chordEdits` export at the end of `song.mjs`, and rebuilds. Relay any chord-name warnings it prints.
4. Present the new page and `song.mjs` again, as in Build and present.

Bar edits are keyed by bar number, so restructuring a song invalidates them. Before restructuring, move them into the song's bars as named templates and delete the `overrides` block.

