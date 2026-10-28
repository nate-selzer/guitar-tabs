// Bar editor shared by the local editor and the chat page; option functions follow score reloads, and onSave/onReset return a status message.
GT.mountEditor = (api, { header, ringBeats = () => 1, letRingBars = () => [], enabled = () => true, saveLabel = 'Save', resetLabel = 'Reset to pattern', onSave, onReset, soundMenu = false }) => {
  const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E']; // top row = alphaTex string 1
  const LENGTHS = [[16, '.1', false], [12, '.2', true], [8, '.2', false], [6, '.4', true], [4, '.4', false], [3, '.8', true], [2, '.8', false], [1, '.16', false]];
  const BAD_CELLS = 'Fix the red cells: use a fret number with symbols from the Symbols list, or x.';

  document.head.insertAdjacentHTML('beforeend', `<style>
    .gte-sheet { position: relative; }
    .gte-sel { position: absolute; pointer-events: none; background: rgb(46 106 88 / .14); border-left: 3px solid var(--accent, #2e6a58); z-index: 5; }
    @media (prefers-reduced-motion: no-preference) { .gte-sel { transition: left .15s, top .15s, width .15s; } }
    .gte-panel { position: fixed; z-index: 2000; inset: auto 0 0 0; background: var(--bg, #eef0ec); color: var(--fg, #1c221f); border-top: 1px solid var(--line, #cfd6d0); padding: 12px 16px 16px; display: grid; gap: 10px; max-height: 48vh; overflow: auto; font: 14px/1.5 var(--body, system-ui, sans-serif); }
    .gte-panel[hidden] { display: none !important; }
    .gte-panel .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .gte-panel button, .gte-panel select { font: 600 13px var(--body, system-ui, sans-serif); border-radius: 6px; padding: 6px 12px; border: 1px solid var(--line, #cfd6d0); background: var(--paper, #fff); color: #1c221f; cursor: pointer; }
    .gte-panel button.primary { background: var(--accent, #2e6a58); border-color: var(--accent, #2e6a58); color: var(--accent-fg, #fff); }
    .gte-panel .close { margin-left: auto; }
    .gte-panel .field { display: inline-flex; align-items: center; gap: 6px; color: var(--muted, #5b6660); font-weight: 600; font-size: 13px; }
    .gte-panel .status { color: var(--muted, #5b6660); white-space: pre-wrap; }
    .gte-panel .status.bad { color: #b3261e; }
    .gte-panel .hint { margin: 0; color: var(--muted, #5b6660); }
    .gte-panel .work { display: flex; flex-wrap: wrap; gap: 12px 28px; align-items: flex-start; }
    .gte-panel .grid-wrap { min-width: 0; flex: 1 1 560px; display: grid; gap: 6px; overflow-x: auto; }
    .gte-panel .legend { flex: 1 1 300px; max-width: 520px; display: grid; gap: 6px; }
    .gte-panel .legend h2 { margin: 0; font: 700 12px var(--body, system-ui, sans-serif); letter-spacing: .06em; text-transform: uppercase; color: var(--muted, #5b6660); }
    .gte-panel .legend dl { margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 4px 16px; }
    .gte-panel .legend dl > div { display: grid; grid-template-columns: 44px 1fr; gap: 8px; align-items: baseline; }
    .gte-panel .legend dt, .gte-panel .legend code { font: 700 13px var(--mono, ui-monospace, monospace); color: var(--accent, #2e6a58); }
    .gte-panel .legend dt { text-align: center; background: var(--paper, #fff); color: #2e6a58; border: 1px solid var(--line, #cfd6d0); border-radius: 4px; padding: 1px 0; }
    .gte-panel .legend dd { margin: 0; font-size: 13px; }
    .gte-panel table { border-collapse: collapse; font: 500 13px var(--mono, ui-monospace, monospace); }
    .gte-panel th { font-weight: 500; color: var(--muted, #5b6660); padding: 0 1px; text-align: center; min-width: 34px; }
    .gte-panel th.beat { color: var(--fg, #1c221f); font-weight: 700; }
    .gte-panel th.str { text-align: right; padding-right: 6px; }
    .gte-panel td { padding: 1px; }
    .gte-panel td.down { border-left: 1px solid var(--line, #cfd6d0); }
    .gte-panel .marker { font: 400 11px var(--body, system-ui, sans-serif); color: var(--accent, #2e6a58); white-space: nowrap; max-width: 34px; overflow: visible; text-align: left; }
    .gte-panel input { width: 30px; box-sizing: border-box; text-align: center; font: 600 13px var(--mono, ui-monospace, monospace); border: 1px solid var(--line, #cfd6d0); border-radius: 4px; padding: 3px 0; background: #fff; color: #1c221f; }
    .gte-panel input.bad { border-color: #b3261e; color: #b3261e; }
    .gte-panel input:not(:placeholder-shown) { background: #e3efe9; }
    .gte-panel button:focus-visible, .gte-panel input:focus-visible, .gte-panel select:focus-visible { outline: 2px solid var(--accent, #2e6a58); outline-offset: 1px; }
  </style>`);

  const sheet = api.container.element.parentElement;
  sheet.classList.add('gte-sheet');
  const sel = Object.assign(document.createElement('div'), { className: 'gte-sel', hidden: true });
  sheet.append(sel);
  const panel = Object.assign(document.createElement('section'), { className: 'gte-panel', hidden: true });
  panel.setAttribute('aria-label', 'Bar editor');
  const sounds = ['basic', ...Object.keys(GT.sounds)];
  panel.innerHTML = `
    <div class="row">
      <b class="label"></b>
      <button class="play">Play bar</button>
      <button class="save primary">${saveLabel}</button>
      <button class="reset">${resetLabel}</button>
      ${soundMenu && sounds.length > 1 ? `<label class="field"><span>Sound</span><select class="sound">${sounds.map(s => `<option value="${s}">${s === 'basic' ? 'Basic' : GT.sounds[s][1]}</option>`).join('')}</select></label>` : ''}
      <span class="status" role="status"></span>
      <button class="close" aria-label="Close the bar editor">Close</button>
    </div>
    <div class="work">
      <div class="grid-wrap">
        <p class="hint">Type a fret in a cell; clear it to remove the note. A note rings until the next note in the bar.</p>
        <table></table>
      </div>
      <aside class="legend">
        <h2>Symbols</h2>
        <dl>
          <div><dt>5</dt><dd>Fret 5</dd></div>
          <div><dt>x</dt><dd>Muted</dd></div>
          <div><dt>5h</dt><dd>Hammer-on to the next note on the string</dd></div>
          <div><dt>5p</dt><dd>Pull-off to the next note on the string</dd></div>
          <div><dt>5/</dt><dd>Slide to the next note on the string</dd></div>
          <div><dt>0h2</dt><dd>Grace note: 0 hammered onto 2 on the beat (<code>0/2</code> slides)</dd></div>
          <div><dt>5b</dt><dd>Bend up a whole step</dd></div>
          <div><dt>5~</dt><dd>Vibrato</dd></div>
          <div><dt>(5)</dt><dd>Ghost note</dd></div>
          <div><dt>&lt;12&gt;</dt><dd>Natural harmonic</dd></div>
          <div><dt>5pm</dt><dd>Palm mute</dd></div>
          <div><dt>5&gt;</dt><dd>Accent</dd></div>
          <div><dt>5^</dt><dd>Heavy accent</dd></div>
          <div><dt>5.</dt><dd>Staccato</dd></div>
        </dl>
        <p class="hint">Suffixes combine, e.g. <code>7b~</code>.</p>
      </aside>
    </div>`;
  document.body.append(panel);
  const $ = c => panel.querySelector(c);
  const status = (text, bad = false) => { $('.status').textContent = text; $('.status').classList.toggle('bad', bad); };
  let selected = null; // { index, length, markers }

  // Play bar renders the grid's current contents into a hidden one-bar score, so unsaved edits can be heard.
  const previewEl = Object.assign(document.createElement('div'), { style: 'position:absolute; left:-10000px; width:900px' });
  document.body.append(previewEl);
  const preview = GT.newApi(previewEl, { display: { staveProfile: 'Tab' }, player: { enablePlayer: true, enableCursor: false, scrollMode: 0 } });
  let sound = GT.savedSound();
  if ($('.sound')) $('.sound').value = sound;
  preview.scoreLoaded.on(GT.quietMutes);
  // alphaTab only creates the player once a score is loaded, so the soundfont goes in after the first one.
  preview.scoreLoaded.on(function first() { preview.scoreLoaded.off(first); GT.soundBytes(sound).then(bytes => preview.loadSoundFont(bytes, false)); });
  $('.sound')?.addEventListener('change', async e => {
    sound = e.target.value;
    GT.saveSound(sound);
    if (!preview.score) return; // the first preview loads the chosen soundfont itself
    e.target.disabled = true;
    status('Loading sounds…');
    preview.loadSoundFont(await GT.soundBytes(sound, status), false);
    e.target.disabled = false;
    status('');
  });
  preview.midiLoad.on(midi => { if (!pendingPlay?.ring && !letRingBars().includes(selected?.index)) GT.capRing(midi, ringBeats() * 960); GT.humanize(midi); });

  api.scoreLoaded.on(() => { if (selected) select(selected.index); });
  document.addEventListener('gt-panel', e => { if (e.detail !== panel && !panel.hidden) close(); });
  // Opens on release: a panel opened under the pointer swallows alphaTab's mouseup, and its next render then throws.
  api.beatMouseDown.on(beat => { if (enabled()) addEventListener('mouseup', () => select(beat.voice.bar.index), { once: true }); });
  // Shades the selected bar and marks its start, like the playback cursor.
  function showSelection() {
    const b = selected && api.boundsLookup?.findMasterBarByIndex(selected.index)?.realBounds;
    sel.hidden = !b;
    if (!b) return;
    const tab = api.container.element;
    Object.assign(sel.style, { left: `${tab.offsetLeft + b.x}px`, top: `${tab.offsetTop + b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
  }
  api.renderFinished.on(showSelection);

  // Reads one bar of the loaded score into the grid: cells[row][sixteenth] = "fret" or "fret" + "h".
  function select(index) {
    const masterBar = api.score.masterBars[index];
    const bar = api.score.tracks[0].staves[0].bars[index];
    const length = Math.round(masterBar.calculateDuration() / 240);
    const cells = STRINGS.map(() => Array(length).fill(''));
    const markers = {};
    const pendingGrace = {};
    for (const beat of bar.voices[0].beats) {
      if (beat.graceType) { for (const n of beat.notes) pendingGrace[n.string] = n; continue; }
      const pos = Math.round(beat.playbackStart / 240);
      for (const note of beat.notes) {
        const g = pendingGrace[note.string];
        cells[6 - note.string][pos] = (g ? `${g.fret}${g.slideOutType ? '/' : 'h'}` : '') + formatNote(note);
      }
      for (const k in pendingGrace) delete pendingGrace[k];
      if (beat.chord || beat.lyrics?.some(Boolean)) markers[pos] = { chord: beat.chord?.name, lyrics: beat.lyrics ?? [] };
    }
    document.dispatchEvent(new CustomEvent('gt-panel', { detail: panel }));
    selected = { index, length, markers };
    if (preview.playerState === 1) preview.stop();
    $('.label').textContent = `Bar ${index + 1}`;
    renderGrid(cells);
    panel.hidden = false;
    document.body.style.paddingBottom = `${panel.offsetHeight + 16}px`;
    showSelection();
    status('');
  }
  function close() {
    if (preview.playerState === 1) preview.stop();
    selected = null;
    panel.hidden = true;
    sel.hidden = true;
    document.body.style.paddingBottom = '';
  }

  function renderGrid(cells) {
    const { length, markers } = selected;
    const counts = ['', 'e', '&', 'a'];
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const head = Array.from({ length }, (_, i) => `<th class="${i % 4 ? '' : 'beat'}">${i % 4 ? counts[i % 4] : i / 4 + 1}</th>`).join('');
    const marks = Array.from({ length }, (_, i) => {
      const m = markers[i];
      return `<th class="marker" title="${m ? esc([m.chord, ...m.lyrics].filter(Boolean).join(' / ')) : ''}">${m ? esc((m.chord ?? '') + (m.lyrics.find(Boolean) ? ` “${m.lyrics.find(Boolean)}”` : '')) : ''}</th>`;
    }).join('');
    const rows = STRINGS.map((name, r) => `<tr><th class="str">${name}</th>${cells[r].map((v, i) =>
      `<td class="${i % 4 ? '' : 'down'}"><input data-cell="${r}-${i}" value="${esc(v)}" placeholder=" " aria-label="${name} string, sixteenth ${i + 1}"></td>`).join('')}</tr>`).join('');
    $('table').innerHTML = `<tr><th></th>${marks}</tr><tr><th></th>${head}</tr>${rows}`;
  }

  // Cell text <-> note: x, (5) ghost, <12> harmonic, 5 plain; suffixes h/p (hammer/pull), / (slide), b (bend), ~ (vibrato), pm, > (accent), ^ (heavy accent), . (staccato).
  const SUFFIX_FX = { h: 'h', p: 'h', '/': 'sl', b: 'b (0 4)', '~': 'v', pm: 'pm', '>': 'ac', '^': 'hac', '.': 'st' };
  function parseCell(text) {
    if (!text) return null;
    if (/^x$/i.test(text)) return { dead: true };
    const grace = text.match(/^(\d{1,2})([hp/])(.+)$/i);
    if (grace) {
      const main = parseCell(grace[3]);
      return main && !main.dead && { ...main, grace: grace[1], graceFx: grace[2] === '/' ? 'sl' : 'h' };
    }
    const m = text.match(/^(?:\((\d{1,2})\)|<(\d{1,2})>|(\d{1,2}))((?:pm|[hp/b~>^.])*)$/i);
    if (!m) return undefined;
    const fx = [m[1] && 'g', m[2] && 'nh', ...[...new Set(m[4].toLowerCase().match(/pm|[hp/b~>^.]/g) ?? [])].map(k => SUFFIX_FX[k])];
    return { fret: m[1] ?? m[2] ?? m[3], fx: [...new Set(fx.filter(Boolean))] };
  }
  function formatNote(n) {
    if (n.isDead) return 'x';
    let text = n.isGhost ? `(${n.fret})` : n.harmonicType === 1 ? `<${n.fret}>` : `${n.fret}`;
    if (n.isHammerPullOrigin) text += n.hammerPullDestination && n.hammerPullDestination.fret < n.fret ? 'p' : 'h';
    if (n.slideOutType) text += '/';
    if (n.hasBend) text += 'b';
    if (n.vibrato) text += '~';
    if (n.isPalmMute) text += 'pm';
    if (n.accentuated) text += n.accentuated === 2 ? '^' : '>';
    if (n.isStaccato) text += '.';
    return text;
  }

  // Turns the grid back into alphaTex: one beat per onset, lasting until the next onset, padded with rests.
  function gridToTex() {
    const { length, markers } = selected;
    const notes = Array.from({ length }, () => []);
    const graces = Array.from({ length }, () => []);
    let ok = true;
    for (let r = 0; r < 6; r++) for (let i = 0; i < length; i++) {
      const input = $(`[data-cell="${r}-${i}"]`);
      const m = parseCell(input.value.trim());
      input.classList.toggle('bad', !!input.value.trim() && !m);
      if (input.value.trim() && !m) ok = false;
      if (m) notes[i].push(m.dead ? `x.${r + 1}` : `${m.fret}.${r + 1}{${[m.fx.includes('st') ? null : 'lr', ...m.fx].filter(Boolean).join(' ')}}`);
      if (m?.grace) graces[i].push(`${m.grace}.${r + 1}{lr ${m.graceFx}}`);
    }
    if (!ok) return null;
    const onsets = [...new Set([0, ...notes.flatMap((n, i) => (n.length ? [i] : [])), ...Object.keys(markers).map(Number)])].sort((a, b) => a - b);
    const out = [];
    onsets.forEach((pos, k) => {
      let gap = (onsets[k + 1] ?? length) - pos;
      let first = true;
      while (gap > 0) {
        const [len, dur, dotted] = LENGTHS.find(([l]) => l <= gap);
        const m = first ? markers[pos] : null;
        const fx = [dotted && 'd', m?.chord && `ch "${m.chord}"`, ...(m?.lyrics ?? []).map((t, i) => t && `lyrics ${i} "${t.replace(/"/g, '\\"')}"`)].filter(Boolean);
        const body = first && notes[pos].length ? (notes[pos].length > 1 ? `(${notes[pos].join(' ')})` : notes[pos][0]) : 'r';
        if (first && graces[pos].length) out.push(`${graces[pos].length > 1 ? `(${graces[pos].join(' ')})` : graces[pos][0]}.16 {gr}`);
        out.push(`${body}${dur}${fx.length ? ` {${fx.join(' ')}}` : ''}`);
        gap -= len;
        first = false;
      }
    });
    return out.join(' ');
  }

  async function run(action) {
    try {
      const message = await action();
      if (message) status(message);
    } catch (e) {
      status(e.message, true);
    }
  }
  $('.save').addEventListener('click', () => {
    const raw = gridToTex();
    if (raw === null) return status(BAD_CELLS, true);
    run(() => onSave(selected.index, raw));
  });
  $('.reset').addEventListener('click', () => run(() => onReset(selected.index)));
  $('.close').addEventListener('click', close);
  $('.play').addEventListener('click', () => {
    if (preview.playerState === 1) return preview.stop();
    const raw = gridToTex();
    if (raw === null) return status(BAD_CELLS, true);
    const ts = api.score.masterBars[selected.index];
    playTex(`\\ts (${ts.timeSignatureNumerator} ${ts.timeSignatureDenominator}) ${raw}`, { loop: true });
  });
  // Plays alphaTex bars after the song's header; ring skips the let-ring cap.
  function playTex(tex, { loop = false, ring = false } = {}) {
    if (preview.playerState === 1) preview.stop();
    pendingPlay = { loop, ring };
    preview.tex(header() + tex);
  }
  // Registered once up front: adding a midiLoaded handler after a load makes alphaTab 1.8.4 recurse forever.
  let pendingPlay = null;
  const playIfPending = () => {
    if (!pendingPlay || !preview.isReadyForPlayback) return;
    preview.isLooping = pendingPlay.loop;
    pendingPlay = null;
    preview.play();
  };
  preview.midiLoaded.on(playIfPending);
  preview.playerReady.on(playIfPending);
  preview.playerStateChanged.on(e => { $('.play').textContent = e.state === 1 ? 'Stop' : 'Play bar'; });

  return { close, status, playTex };
};
