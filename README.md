# Guitar Tabs

Tabs rendered with [alphaTab](https://alphatab.net), hosted at https://nate-selzer.github.io/guitar-tabs/.

Each song is a folder with a `song.mjs` data file: title, capo, tempo, chord shapes, the bars (chord, length, lyrics) and the chords-over-lyrics sheet. `build.mjs` turns every song folder into:

- `index.html`: the tab, with playback
- `chords.html`: the chord sheet
- `song.tex`: the alphaTex source
- `<title>.gp`: a Guitar Pro file

Chords a song doesn't define come from the standard shapes in `chords.mjs`, which also checks each chord name against the notes its frets actually play. Page layouts live in `templates/`.

```sh
npm install
npm run build
```

## Editing bars by hand

For figures that are easier to place on a grid than to describe, use the local editor:

```sh
node edit.mjs
```

Then open http://localhost:8810/editor/?song=<folder> (for example `?song=nothing-on-this-earth`).

- Click any note in a bar to open it as a grid: one row per string (high e at the top), one column per sixteenth note, with the bar's chord names and lyrics shown above the columns where they start.
- Type a fret number in a cell to add a note, or clear it to remove one. A note rings until the next note in the bar.
- Add `h` after a fret (e.g. `0h`) to hammer on or pull off to the next note on that string.
- **Play bar** loops the grid as it is, including unsaved changes.
- **Save & rebuild** writes the bar to `<folder>/overrides.json` and rebuilds the song; that bar no longer follows the song's pattern.
- **Reset to pattern** removes the bar's override.

The editor only works locally (it writes files); the copy on GitHub Pages can't save. Commit and push `overrides.json` with the rebuilt files to publish edits.
