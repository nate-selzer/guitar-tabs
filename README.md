# Guitar Tabs

Tabs rendered with [alphaTab](https://alphatab.net), hosted at https://nate-selzer.github.io/guitar-tabs/.

Each song folder has a `build.mjs` that generates the alphaTex source (`song.tex`), a Guitar Pro file, the rendered tab (`index.html`, from `template.html`), and a chord sheet (`chords.html`, from `chords.template.html`).

```sh
npm install
npm run build
```
