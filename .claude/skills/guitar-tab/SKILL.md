---
name: guitar-tab
description: Turn chords-over-lyrics notes into a tab page, chord sheet and Guitar Pro file in ~/workspace/guitar-tabs, then publish to GitHub Pages. Use when the user shares a song's chords to tab, or asks to fix one already there.
---

# Guitar tab

Repo: `~/workspace/guitar-tabs` (public, `nate-selzer/guitar-tabs`, served at https://nate-selzer.github.io/guitar-tabs/). Read `README.md`, `build.mjs`, `chords.mjs` and `nothing-on-this-earth/song.mjs` (the reference song) before writing a new one.

## Lyrics

- Only use lyrics the user types or pastes. Never look up or fill in lyrics yourself. Normalize look-alike characters (e.g. Cyrillic е) in pasted text and say so.
- Never retype a song's lyrics in bulk. When restructuring, move the existing fragments programmatically (a script that reads the current `song.mjs` by bar position and writes the new one), and don't print them in tool output. Large blocks of lyrics in the conversation can trip safeguards.

## Writing `<slug>/song.mjs`

The user's shorthand is usually `| "lyric" Chord Chord |`: bars between pipes, chords in order, words that start each chord.

- **Header:** `title`, `artist`, `tempo`, plus `capo`, `key` (sounding key), `time` (`[3, 4]`), `tuning` (low to high, e.g. `['D2','A2','D3','G3','B3','E4']`) when they apply. `ring` caps how long a note sounds in playback, in beats (default 1). Frets are relative to the capo.
- **Chords:** define a shape only when the user gives one or it differs from `chords.mjs`. Format is low E to high e, `null` = muted: `'F/G': { frets: [3,null,3,2,1,null], thumb: true, bass: [0] }`. `thumb` marks a low-E note fretted by the thumb (shown as T in the chord box); `bass` lists string indexes the bass alternates through.
- **Bars:** `{ beats: [[chord, quarters, lyric], ...] }`; quarters per bar must add up to the time signature. Chord `null` is a rest. Bar flags: `doubleBar`, `pattern`, `letRing` (skip the playback ring cap, e.g. a ringing outro), and `repeatStart`/`repeatEnd`/`ending`/`ac` when repeats fit.
- **Structure:** write the song out in order, one section after another, ending each section with a `doubleBar`. For a section form that recurs (verse, interlude), write a builder function that returns its bars and takes the lyrics, variations and pickup as arguments; see `A()` in the reference song. Use repeat signs with stacked lyric columns only when repeated sections are identical apart from lyrics.
- **Lyric fragments** start at the syllable where the chord changes. Pickup words go on the last beat(s) of the previous bar.
- **Pattern:** set `pattern` only if the user describes the rhythm (`'boomChuck'`, or a song-defined pattern like the reference's `pinch`). The default `'strum'` is a placeholder; list it as a guess.
- **Hand-written figures** (fingerpicking, hammer-ons, variations) go in `{ raw: '...' }` alphaTex: `fret.string{lr}.duration`, chords in parentheses, `{ch "Name"}` on each chord's first beat. Keep recurring figures as named templates with `%L%` lyric slots filled by `fill()`, as in the reference song.
- **Gradual strum / rolled chord:** `{ad 960}` on the chord beat (rolls low to high over one beat; drawn as an arpeggio sign).
- **Sheet:** `[sectionName, lines]`; a line is `[[chord|null, 'lyric '], ...]` and a plain string is a note in italics. One section per part, with instrumental parts as chord-only lines plus a note.
- **Note:** use `note` (HTML) for technique that would make shapes look wrong, e.g. thumb-over chords.

## Bar editor

When a figure takes more than one round of text to get right (exact notes, timings, hammer-ons), offer the local editor instead of more description:

1. Run `node edit.mjs` in the repo (in the background; it also serves the whole site for previewing) and open `http://localhost:8810/editor/?song=<slug>` in the browser pane.
2. Tell the user: click a bar to select it (it's shaded green with a cursor line) and open its grid (rows = strings, high e on top; columns = sixteenths, labeled 1 e & a); type a fret to add a note and clear a cell to remove it; the Symbols legend beside the grid lists the notation; **Play bar** loops the grid including unsaved edits; **Save & rebuild** writes `<slug>/overrides.json`; **Reset to pattern** removes the override.
3. Never type into the user's grid or save over their bars while testing; test with the API or on bars they aren't editing.
4. Overrides are keyed by bar number, so restructuring a song invalidates them. Before restructuring, move them into `song.mjs` as named templates and delete `overrides.json`. When an edited figure recurs across sections, do the same.

## Build and check

1. Before a large rewrite, commit and tag the current state (`git tag before-<change>`) and tell the user the SHA and how to reset to it.
2. Run `npm run build`. It warns when a chord name doesn't match its frets. Tell the user each warning and ask, rather than renaming the chord silently. Check bar lengths by written note values; grace notes borrow playback time from the previous note, so playback durations look short.
3. Preview locally through `edit.mjs` in the browser pane, or screenshot with the Playwright headless shell (`~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell --virtual-time-budget=20000 --window-size=<w>,3000 --screenshot=...`; crop with `sips`). Check layout changes at 1100, 560 and 400 px wide.
4. Iterate locally; commit and push only when the user asks. Then wait for Pages: poll `gh api repos/nate-selzer/guitar-tabs/pages/builds/latest --jq '.status + " " + .commit[0:7]'` until it shows `built <sha>`, and fetch the live page with a `?v=<timestamp>` query.
5. Report the live link and only the guesses that need the user's ear: rhythm pattern, voicings you chose, syllable placement.

The build also writes `<slug>/chords.txt`, a plain-text sheet formatted for pasting into Ultimate Guitar. The user submits it under their own account; don't sign in or submit for them.

## Built-in defaults (in `templates/` and the editor; every song gets them)

Change these in the shared templates, never per song.

- **Playback:** strummed chords use brush strokes; notes ring up to `ring` beats; seeded humanizing (beat accents, small volume and timing variation); mutes play near-silent, grace notes quiet (~35), and hammer-on/pull-off/slide targets at mezzo-piano (grace-note targets stay full volume); the final chord rings out.
- **Sound menu:** Basic (built-in, default), GeneralUser GS (32 MB) and FluidR3 (24 MB), downloaded only when picked and remembered per browser.
- **Layout:** chord boxes are a fixed size with an adaptive column count; the tab never renders narrower than 760 px (it scrolls instead); Speed/Sound labels wrap together with their menus; the Tab/Chords switch sits under the title; no bar numbers, chord names above the staff, or section labels in the tab.

## alphaTab rules (already handled; keep them)

- Never put section labels in lyric lines or `txt`; they knock lyric rows out of alignment.
- `useWorkers` and `enableLazyLoading` stay `false`, or the tab silently doesn't render. `scriptFile` and `fontDirectory` must be absolute URLs.
- Load a soundfont only after the first score loads, or alphaTab drops it.
- Register `midiLoaded`/`playerReady` handlers once at startup; adding one after a MIDI load makes alphaTab 1.8.4 recurse forever.
- In the browser build, identify MIDI note events by `type` (128 = on, 144 = off); class names are minified.
- The tab page clears strum (brush) markers from the drawn copy so no arrows appear, but keeps rolled-chord (arpeggio) markers.
