# Guitar Tabs

A guitar songbook and tab workbench. Each song lives in a single definition file (`<slug>/song.mjs`) and builds into:

- **An interactive tab viewer** (`<slug>/index.html`) with synchronized playback, speed control, and switchable soundfonts
- **A clean chords-over-lyrics sheet** (`<slug>/chords.html`) with SVG chord diagrams
- **An Ultimate Guitar plain-text export** (`<slug>/chords.txt`) ready to copy and paste
- **A Guitar Pro 7 file** (`<slug>/<Title>.gp`)

Live site: **https://nate-selzer.github.io/guitar-tabs/**

---

## Using the Tab Viewer & Chord Sheets

From the home page, pick any song to open its **Tab** view, or click **Chords** to jump straight to its chord sheet. Once inside a song, the **Tab / Chords** switcher beneath the title lets you flip between the two views at any time.

### 1. The Tab Viewer (`/<slug>/`)

The tab page is designed to read like a clean printed songbook while giving you an interactive practice player when you need it.

- **At-a-glance setup:** The header lists the song's key facts—**Capo** (with frets always written relative to the capo), **Tuning** (when non-standard), **Sounding key**, **Time signature**, and **Tempo** (`♩ = BPM`).
- **Technique callouts:** If a song relies on an unusual grip—such as wrapping your thumb over the top of the neck for low-E bass notes—a callout note under the navigation explains how to hold the shapes.
- **Chord diagrams:** At the top of the sheet, fixed-size SVG diagrams show every voicing used in the song in order of appearance:
  - `○` for open strings and `×` for muted strings
  - Fret numbers beside the nut when a shape is played higher up the neck
  - A **`T`** badge on the low E string when a note is fretted with the thumb
- **Clutter-free notation:**
  - Chord names appear above the tab where the harmony changes, and lyrics sit aligned underneath the exact beats where they are sung.
  - Section boundaries are marked with double barlines, and rolled chords show arpeggio arrows, while noisy visual defaults (strum direction arrows on every beat, bar numbers, duplicate staff headers) are stripped out.
  - On narrower screens, the tab scales down to 2 bars per row; below `760px` the paper sheet scrolls horizontally so lyrics and fret numbers never collide.
  - The page follows your system light/dark mode while keeping the tab sheet on a warm paper background for legibility.

#### Playback Controls

A sticky transport bar stays pinned to the top of the screen as you scroll:

- **Play / Pause & Stop:** Starts playback with a live green bar highlight, beat cursor, and automatic page scrolling. You can also click any beat in the tab to jump the player to that spot.
- **Speed (`50%`, `75%`, `100%`):** Slow down tricky fingerpicking passages or transitions without changing pitch.
- **Sound (`Basic`, `GeneralUser GS`, `FluidR3`):**
  - Loads fast using the built-in **Basic** soundfont by default.
  - Pick **GeneralUser GS (32 MB)** or **FluidR3 (24 MB)** for richer acoustic guitar tones. Larger soundfonts download on demand with a live percentage indicator and are remembered in your browser (`localStorage`) for future visits.
- **Humanized guitar feel:** Rather than stiff MIDI playback, the viewer shapes the audio before playing:
  - Strummed chords brush across the strings instead of firing every string on the exact same tick.
  - Notes sustain smoothly up to the song's `ring` cap so chord changes don't blur together, while `letRing` bars and the final chord ring out naturally.
  - Dead/muted notes (`x`) play as quiet percussive ticks, grace notes play softly, and unpicked hammer-on, pull-off, and slide targets play at a gentler dynamic.
  - Subtle seeded variations in timing and velocity accent the downbeats so the tab sounds played rather than sequenced.

### 2. The Chords View (`/<slug>/chords.html`)

For strumming or singing along without reading tab:

- Shows the same capo/tuning facts, technique callouts, and SVG chord diagrams at the top.
- Renders the song section by section (`[Intro]`, `[Verse 1]`, `[Interlude]`, etc.) in a clean monospace layout with bold chord names positioned directly over the syllable where each change lands, plus italicized performance notes for instrumental bars or variations.

### 3. Plain-Text & Guitar Pro Exports

Every build also outputs two portable files in the song's folder:

- **`<slug>/chords.txt`:** Formatted specifically for pasting into Ultimate Guitar—complete with capo/tuning headers, a fret-hand legend at the top, and `[Section]` blocks with internal voicing labels (like `(barre)`) stripped from the chord lines so UG's parser recognizes every chord symbol.
- **`<slug>/<Title>.gp`:** A Guitar Pro 7 score generated from the same source.

---

## Writing a Tab with the Skill & Bar Editor

You don't have to write alphaTex or calculate beat durations by hand. The repo includes a Claude Code skill (`.claude/skills/guitar-tab/SKILL.md`) and a local visual bar editor (`edit.mjs`) that turn rough notes into a finished tab.

### 1. Starting from Notes with the `guitar-tab` Skill

To start a new song, share what you have in plain shorthand—bars between pipes, chords in order, and the lyric words where each chord starts:

```text
| "plague of" C/G "locusts, the" Cmaj7/G | "plague of" Ddim7 "lice, an" C |
```

Include whatever else you know:
- Song title, artist, tempo, time signature, capo, or alternate tuning
- Any custom chord voicings (e.g. `F/G: 3x321x, thumb on low E`)
- The general feel (e.g. basic strum, alternating `boomChuck`, or a fingerpicking pattern)

> **Note on lyrics:** Always paste or type the lyrics you want in the tab yourself. The skill only uses lyrics you provide and will never look up or auto-fill lyrics from the web.

#### What the Skill Does

1. **Builds `<slug>/song.mjs`:** Maps out the song's metadata, chord shapes (pulling standard open shapes from `chords.mjs` unless overridden), section builders, bar-by-bar tab, and chords-over-lyrics sheet.
2. **Validates chord names against fret shapes:** Running `npm run build` checks the actual pitch classes sounded by every chord's frets (accounting for custom tunings) against music theory rules. If a shape's notes don't match its chord name—or if the lowest note doesn't match a slash chord's bass—the build warns you and the skill asks how you'd like to resolve it rather than silently renaming your chord.
3. **Flags only what needs your ear:** Once built, the skill gives you the preview link and calls out any assumptions it made—such as placeholder rhythm patterns, default chord voicings, or syllable/pickup alignments.

### 2. Dialing In Specific Bars with the Visual Bar Editor

Describing exact sixteenth-note fingerpicking, bass walkdowns, or hammer-on figures in prose can be tedious. Whenever a bar needs fine-tuning by ear, use the local bar editor:

```bash
node edit.mjs
```

Then open **`http://localhost:8810/editor/?song=<slug>`** in your browser (the server also serves the full site at `http://localhost:8810/<slug>/` for local previewing).

#### Using the Editor

1. **Click any bar in the score:** The bar highlights in green and opens a bottom editing panel with a **6-string × 16th-note grid** (`1 e & a` columns, high `e` string on top, low `E` on the bottom). Chord names and lyric snippets appear above the columns where they fall.
2. **Type frets and articulations into the grid:**
   - Type a fret number into a cell to place a note; clear the cell to remove it. A note automatically rings until the next onset in the bar.
   - Combine fret numbers with shorthand symbols from the on-screen **Symbols** legend:

| Input | Meaning |
| :--- | :--- |
| `5` | Fret 5 |
| `x` | Muted / dead note |
| `5h` / `5p` | Hammer-on / pull-off to the next note on the same string |
| `5/` | Slide to the next note on the same string |
| `0h2` / `0/2` | Grace note: `0` hammered or slid onto `2` right on the beat |
| `5b` | Bend up a whole step |
| `5~` | Vibrato |
| `(5)` | Ghost note |
| `<12>` | Natural harmonic |
| `5pm` | Palm mute |
| `5>` / `5^` | Accent / heavy accent |
| `5.` | Staccato |

   *(Suffixes can be combined, e.g. `7b~`.)*

3. **Audition in a loop:** Click **Play bar** to loop just that bar with your unsaved grid changes, using the same humanized playback and soundfont options as the main viewer.
4. **Save or reset:**
   - **Save & rebuild** writes the bar's alphaTex into the `overrides` export at the end of `<slug>/song.mjs` and immediately rebuilds the song's tab, chord sheet, and `.gp` file.
   - **Reset to pattern** deletes the override for that bar and restores the song's generated pattern.
5. **Promote recurring figures:** When a hand-edited bar is ready to be reused across multiple verses or sections (or before restructuring a song's bar count), the skill promotes the override out of the `overrides` block into a named template in the song's bars.

### 3. Using the Skill in Claude Chat

The same workflow runs in a claude.ai chat, with no repo or local server:

Download **[guitar-tab-chat.zip](https://github.com/nate-selzer/guitar-tabs/releases/download/chat-skill/guitar-tab-chat.zip)** (about 1.7 MB) and upload it in claude.ai under Skills, with code execution on. It's rebuilt from `main` whenever the build or the skill changes; `npm run package-skill` makes the same zip locally in `~/Downloads`. Then, in a chat, share a song's chords or attach a `song.mjs`, and Claude builds:

- **A self-contained tab page** that renders right in the chat, with playback (Basic sound only) and a built-in bar editor
- **`song.mjs`, `chords.txt`, and the `.gp` file** to download

To fix bars in chat, click **Edit bars** on the page, then click a bar. The grid, symbols, and **Play bar** work as in the local editor. **Keep edit** applies an edit on the page, and **Copy edits for Claude** copies all kept edits to paste into the chat, where Claude writes them into `song.mjs` and rebuilds. Keep the latest `song.mjs` and attach it in your next chat to continue.

After changing the build, templates, `web/` scripts, or the skill text, push to `main`, then download and re-upload the new zip.

---

## Repository Commands & Layout

```bash
npm run build                     # Build all songs and the home index
node build.mjs <slug>             # Build a single song
node build.mjs <slug> --chat <dir> # Also write the self-contained chat page and song files into <dir>
npm run edit                      # Start the local preview & bar editor at http://localhost:8810
npm run package-skill             # Pack the Claude chat skill into ~/Downloads/guitar-tab-chat.zip
```

- `<slug>/song.mjs` — Source of truth for a song (metadata, chord shapes, patterns, bars, lyric sheet, and any bar edits from the editors)
- `<slug>/index.html`, `chords.html`, `chords.txt`, `song.tex`, `<Title>.gp` — Generated build outputs
- `chords.mjs` — Standard open-chord library and music-theory chord-voicing validator
- `templates/` — Shared HTML/CSS templates for the home page, tab viewer, and chord sheet
- `web/playback.js` & `web/editor.js` — Browser code shared by the tab viewer, the local editor, and the chat page (alphaTab setup, sounds, playback shaping, the bar editor)
- `editor/index.html` & `edit.mjs` — Local 16th-note grid bar editor
- `overrides.mjs` & `apply-edits.mjs` — Write bar edits into a song's `song.mjs`
- `package-skill.mjs` & `.claude/skills/guitar-tab/` — The Claude Code skill (`SKILL.md`) and the chat skill's instructions (`chat.md`)
- `vendor/alphatab/` — alphaTab (browser and Node builds), its music font, and the Basic soundfont; no `npm install` needed
