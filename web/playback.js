// alphaTab setup, sounds and playback shaping for every page; GT_ASSETS is { base } (site root) or, in the self-contained chat page, { font } (data URL).
const GT = (() => {
  const assets = window.GT_ASSETS;
  const url = p => new URL(assets.base + p, location.href).href;

  function newApi(el, settings) {
    const core = assets.font
      ? { smuflFontSources: new Map([[alphaTab.FontFileFormat.Woff2, assets.font]]) }
      : { fontDirectory: url('vendor/alphatab/font/'), scriptFile: url('vendor/alphatab/alphaTab.min.js') };
    const api = new alphaTab.AlphaTabApi(el, { ...settings, core: { ...core, useWorkers: false, enableLazyLoading: false } });
    // Chat's preview blocks workers and worklets, so the synthesizer runs on the page there.
    if (assets.font) api.uiFacade.createWorkerPlayer = () => new alphaTab.synth.AlphaSynth(new alphaTab.synth.AlphaSynthScriptProcessorOutput(), api.settings.player.bufferTimeInMilliseconds);
    return api;
  }

  // Basic is built in; the others download when picked. A chat page only has Basic.
  const SOUNDS = assets.font ? {} : {
    gugs: ['vendor/soundfont-hq/GeneralUser-GS.sf2', 'GeneralUser GS'],
    fluid: ['vendor/soundfont-fluid/FluidR3Mono_GM.sf3', 'FluidR3'],
  };
  function savedSound() {
    let name = 'basic';
    try { name = localStorage.getItem('guitar-tabs:sound') || (localStorage.getItem('guitar-tabs:hq') === '1' ? 'gugs' : 'basic'); } catch {}
    return SOUNDS[name] ? name : 'basic';
  }
  function saveSound(name) {
    try { localStorage.setItem('guitar-tabs:sound', name); } catch {}
  }
  async function soundBytes(name, onProgress = () => {}) {
    if (!SOUNDS[name]) {
      const b64 = assets.font ? document.getElementById('sf').textContent : await (await fetch(url('vendor/alphatab/soundfont/sonivox.sf2.b64.txt'))).text();
      return Uint8Array.from(atob(b64.trim()), c => c.charCodeAt(0));
    }
    const [path, label] = SOUNDS[name];
    const res = await fetch(url(path));
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    const chunks = [];
    let loaded = 0;
    for (let r; !(r = await reader.read()).done;) {
      chunks.push(r.value);
      loaded += r.value.length;
      if (total) onProgress(`Downloading ${label} ${Math.floor((loaded / total) * 100)}%`);
    }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
    return bytes;
  }

  // Let-ring sustains up to a bar; cap it so chords don't blur, except the final chord and `free` [start, end) tick ranges.
  function capRing(midi, maxTicks, free = []) {
    for (const track of midi.tracks) {
      const open = new Map();
      const lastOn = Math.max(...track.events.filter(e => e.type === 128).map(e => e.tick));
      for (const e of track.events) {
        const key = `${e.channel}:${e.noteKey}`;
        // alphaTab's event types: 128 = note on, 144 = note off (class names are minified in the browser build).
        if (e.type === 128 && e.noteVelocity > 0 && e.tick < lastOn && !free.some(([a, b]) => e.tick >= a && e.tick < b)) open.set(key, e.tick);
        else if ((e.type === 144 || e.type === 128) && open.has(key)) {
          e.tick = Math.min(e.tick, open.get(key) + maxTicks);
          open.delete(key);
        }
      }
      track.events.sort((a, b) => a.tick - b.tick);
    }
  }
  // Seeded variations so playback sounds played, not sequenced: beat accents, volume and timing nudges, spread chords.
  function humanize(midi) {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    for (const track of midi.tracks) {
      // Grace notes are short and start off the sixteenth-note grid (240 ticks); find them before shifting anything.
      const grace = new Set();
      const started = new Map();
      for (const e of track.events) {
        const key = `${e.channel}:${e.noteKey}`;
        if (e.type === 128 && e.noteVelocity > 0) started.set(key, e);
        else if ((e.type === 144 || e.type === 128) && started.has(key)) {
          const on = started.get(key);
          if (e.tick - on.tick < 200 && on.tick % 240 !== 0) grace.add(on);
          started.delete(key);
        }
      }
      const shift = new Map();
      for (const e of track.events) {
        const key = `${e.channel}:${e.noteKey}`;
        if (e.type === 128 && e.noteVelocity > 0) {
          const onBeat = e.tick % 960 === 0;
          // Already-quiet notes (mutes) stay quiet.
          const base = grace.has(e) ? 35 : e.noteVelocity < 30 ? e.noteVelocity : e.noteVelocity + (onBeat ? 8 : -6);
          e.noteVelocity = Math.max(1, Math.min(127, Math.round(base + rand() * 6)));
          const d = Math.round(rand() * 8);
          shift.set(key, d);
          e.tick = Math.max(0, e.tick + d);
        } else if ((e.type === 144 || e.type === 128) && shift.has(key)) {
          e.tick = Math.max(0, e.tick + shift.get(key));
          shift.delete(key);
        }
      }
      track.events.sort((a, b) => a.tick - b.tick);
    }
  }
  // Mutes barely sound; unpicked legato targets play softer, except grace-note targets.
  function quietMutes(score) {
    for (const track of score.tracks) for (const staff of track.staves) for (const bar of staff.bars)
      for (const voice of bar.voices) for (const beat of voice.beats) for (const note of beat.notes) {
        if (note.isDead) note.dynamics = 0;
        else if ((note.hammerPullOrigin && !note.hammerPullOrigin.beat.graceType) || note.slideOrigin) note.dynamics = 3;
      }
  }
  // Playback MIDI for a whole song: strummed (brushed) chords, quiet mutes, capped ring outside `letRing` bars, humanized.
  function strummedMidi(tex, settings, ringBeats, letRingBars) {
    const midi = new alphaTab.midi.MidiFile();
    const importer = new alphaTab.importer.AlphaTexImporter();
    importer.initFromString(tex, settings);
    const score = importer.readScore();
    quietMutes(score);
    const generator = new alphaTab.midi.MidiFileGenerator(score, settings, new alphaTab.midi.AlphaSynthMidiFileHandler(midi));
    generator.generate();
    const free = generator.tickLookup.masterBars.filter(m => letRingBars.includes(m.masterBar.index)).map(m => [m.start, m.end]);
    capRing(midi, ringBeats * 960, free);
    humanize(midi);
    return midi;
  }

  return { newApi, sounds: SOUNDS, savedSound, saveSound, soundBytes, capRing, humanize, quietMutes, strummedMidi };
})();
