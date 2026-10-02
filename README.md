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
