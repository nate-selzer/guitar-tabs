// Chord chart editor for the local editor and chat page (styled by editor.js's .gte-panel): click a chart in `boxes` while it has data-editing; onSave/onReset return a status message.
GT.mountChartEditor = (boxes, { chart, playTex, saveLabel = 'Save', resetLabel = 'Reset chart', onSave, onReset }) => {
  const { X0, DX, Y0, DY } = chordChart;
  const STRINGS = ['E', 'A', 'D', 'G', 'B', 'e'];
  const TOOLS = [['', 'Dot'], ['T', 'T'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['barre', 'Barre']];

  document.head.insertAdjacentHTML('beforeend', `<style>
    .boxes[data-editing] figure[data-chord] { cursor: pointer; border-radius: 6px; outline: 1px dashed transparent; outline-offset: 4px; }
    .boxes[data-editing] figure[data-chord]:hover { outline-color: var(--line, #cfd6d0); }
    .boxes figure.gtc-selected { outline: 2px solid var(--accent, #2e6a58) !important; outline-offset: 4px; border-radius: 6px; }
    .gtc-chart { flex: 0 0 auto; background: var(--paper, #fff); color: #1c221f; border-radius: 6px; padding: 8px 12px; box-shadow: 0 0 0 1px var(--line, #cfd6d0); }
    .gtc-chart svg { width: 210px; height: auto; display: block; cursor: crosshair; touch-action: none; user-select: none; }
    .gtc-controls { flex: 1 1 320px; display: grid; gap: 10px; align-content: start; }
    .gte-panel .tools button[aria-pressed="true"] { background: var(--accent, #2e6a58); border-color: var(--accent, #2e6a58); color: var(--accent-fg, #fff); }
    .gte-panel .gtc-controls input { width: 56px; }
    .gte-panel .gtc-controls input.frets, .gte-panel .gtc-controls input.name { width: 130px; }
    .gte-panel .warn { color: #b3261e; margin: 0; }
  </style>`);

  const panel = Object.assign(document.createElement('section'), { className: 'gte-panel', hidden: true });
  panel.setAttribute('aria-label', 'Chord chart editor');
  panel.innerHTML = `
    <div class="row">
      <b class="label"></b>
      ${playTex ? '<button class="play">Play chord</button>' : ''}
      <button class="save primary">${saveLabel}</button>
      <button class="reset">${resetLabel}</button>
      <span class="status" role="status"></span>
      <button class="close" aria-label="Close the chart editor">Close</button>
    </div>
    <div class="work">
      <div class="gtc-chart"></div>
      <div class="gtc-controls">
        <div class="row tools" role="group" aria-label="What a click places">${TOOLS.map(([v, t]) => `<button data-tool="${v}" aria-pressed="false">${t}</button>`).join('')}</div>
        <p class="hint">Click a fret to place a dot with the chosen finger (Dot = no label); click it again to remove it, or with another finger to relabel it. Click above the top line to switch a string between open and muted. With Barre, drag across the strings on one fret; click a barre to remove it, or click it with a finger to label it.</p>
        <div class="row">
          <label class="field"><span>Name</span><input class="name"></label>
          <label class="field"><span>Frets</span><input class="frets" aria-describedby="gtc-frets-hint"></label>
          <label class="field"><span>Starting fret</span><input class="base" type="number" min="1" max="20"></label>
          <label class="field"><span>Capo</span><input class="capo" type="number" min="0" max="12"></label>
        </div>
        <p class="hint" id="gtc-frets-hint">Name is what the charts, chord sheet and Guitar Pro file show. Frets run low E to high e, x = muted, relative to the song's capo. Starting fret is the fret at the top of the chart; Capo draws a capo there instead of the nut (0 = none).</p>
        <p class="warn"></p>
      </div>
    </div>`;
  document.body.append(panel);
  const $ = c => panel.querySelector(c);
  const status = (text, bad = false) => { $('.status').textContent = text; $('.status').classList.toggle('bad', bad); };
  let name = null;
  let draft = null;
  let tool = '';
  let drag = null; // { string, fret, to } while dragging a barre

  boxes.addEventListener('click', e => {
    const fig = e.target.closest('figure[data-chord]');
    if (fig && boxes.hasAttribute('data-editing')) open(fig.dataset.chord);
  });
  document.addEventListener('gt-panel', e => { if (e.detail !== panel && !panel.hidden) close(); });

  function open(chord) {
    document.dispatchEvent(new CustomEvent('gt-panel', { detail: panel }));
    const s = chart(chord);
    name = chord;
    draft = {
      frets: [...s.frets],
      fingers: Array.from({ length: 6 }, (_, i) => s.fingers?.[i] ?? null),
      barres: (s.barres ?? []).map(b => ({ ...b })),
      baseFret: s.baseFret ?? null,
      capo: s.capo ?? 0,
      name: s.name ?? chord,
    };
    mark();
    status('');
    $('.name').value = draft.name;
    render();
    panel.hidden = false;
    document.body.style.paddingBottom = `${panel.offsetHeight + 16}px`;
  }
  const mark = () => { for (const f of boxes.querySelectorAll('figure')) f.classList.toggle('gtc-selected', f.dataset.chord === name); };
  function close() {
    name = null;
    panel.hidden = true;
    mark();
    document.body.style.paddingBottom = '';
  }

  function render() {
    const shown = drag && drag.to !== drag.string
      ? { ...draft, barres: [...draft.barres, { fret: drag.fret, from: Math.min(drag.string, drag.to), to: Math.max(drag.string, drag.to) }] }
      : draft;
    $('.gtc-chart').innerHTML = chordChart.svg(draft.name, shown);
    $('.label').textContent = `Chart: ${draft.name}`;
    const { base } = chordChart.layout(draft);
    $('.frets').value = draft.frets.map(f => f ?? 'x').join(' ');
    $('.frets').classList.remove('bad');
    $('.base').value = base;
    $('.capo').value = draft.capo;
    $('.capo').disabled = base > 1;
    for (const b of panel.querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed', String(b.dataset.tool === tool));
    const hidden = draft.frets.map((f, i) => f > 0 && f < base && `${STRINGS[i]} string (fret ${f})`).filter(Boolean);
    const clash = [...boxes.querySelectorAll('figure[data-chord]')].some(f => f.dataset.chord !== name && f.querySelector('figcaption').textContent === draft.name);
    $('.warn').textContent = [hidden.length && `Not shown above the starting fret: ${hidden.join(', ')}.`, clash && `Another chart is already called ${draft.name}.`].filter(Boolean).join(' ');
  }

  // Pointer position -> { string, fret }, where fret 0 means the area above the chart.
  function spot(e) {
    const svg = $('.gtc-chart svg');
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    const string = Math.round((p.x - X0) / DX);
    const { base, rows } = chordChart.layout(draft);
    const row = Math.floor((p.y - Y0) / DY);
    if (string < 0 || string > 5 || row >= rows) return null;
    return { string, fret: p.y < Y0 ? 0 : base + row };
  }
  const barreAt = (string, fret) => draft.barres.find(b => b.fret === fret && string >= b.from && string <= b.to);
  const barreBelow = (string, fret) => Math.max(0, ...draft.barres.filter(b => b.fret < fret && string >= b.from && string <= b.to).map(b => b.fret));

  function place({ string: i, fret }) {
    const { frets, fingers } = draft;
    if (fret === 0) {
      frets[i] = frets[i] === null ? 0 : null;
      fingers[i] = null;
      return;
    }
    const label = tool || null;
    const barre = barreAt(i, fret);
    if (barre) barre.finger = barre.finger === label ? null : label;
    else if (frets[i] === fret && fingers[i] === label) [frets[i], fingers[i]] = [barreBelow(i, fret), null];
    else [frets[i], fingers[i]] = [fret, label];
  }
  function finishBarre({ string: from, fret }, to) {
    const existing = barreAt(from, fret);
    if (from === to) {
      if (!existing) return status('Drag across two or more strings to make a barre.');
      draft.barres = draft.barres.filter(b => b !== existing);
      for (let i = existing.from; i <= existing.to; i++) if (draft.frets[i] === fret && !draft.fingers[i]) draft.frets[i] = barreBelow(i, fret);
      return status('');
    }
    const b = { fret, from: Math.min(from, to), to: Math.max(from, to), finger: null };
    draft.barres = [...draft.barres.filter(x => x.fret !== fret), b];
    for (let i = b.from; i <= b.to; i++) {
      if (draft.frets[i] === null || draft.frets[i] <= fret) [draft.frets[i], draft.fingers[i]] = [fret, null];
    }
    status('');
  }

  $('.gtc-chart').addEventListener('pointerdown', e => {
    const s = e.target.closest('svg') && spot(e);
    if (!s) return;
    if (tool !== 'barre' || s.fret === 0) { place(s); return render(); }
    drag = { ...s, to: s.string };
    e.target.setPointerCapture?.(e.pointerId);
  });
  $('.gtc-chart').addEventListener('pointermove', e => {
    const s = drag && spot(e);
    if (s && s.string !== drag.to) { drag.to = s.string; render(); }
  });
  $('.gtc-chart').addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    finishBarre(d, d.to);
    render();
  });
  for (const b of panel.querySelectorAll('[data-tool]')) b.addEventListener('click', () => { tool = b.dataset.tool; render(); });

  $('.frets').addEventListener('change', e => {
    const raw = e.target.value.trim();
    const tokens = /\s/.test(raw) ? raw.split(/\s+/) : [...raw];
    const frets = tokens.map(t => (/^x$/i.test(t) ? null : /^\d{1,2}$/.test(t) ? Number(t) : undefined));
    if (frets.length !== 6 || frets.includes(undefined)) return e.target.classList.add('bad');
    draft.frets.forEach((f, i) => { if (f !== frets[i]) draft.fingers[i] = null; });
    draft.frets = frets;
    render();
  });
  $('.name').addEventListener('input', e => {
    draft.name = e.target.value.trim() || name;
    render();
  });
  $('.base').addEventListener('change', e => {
    const n = Math.round(Number(e.target.value));
    if (n >= 1 && n <= 20) draft.baseFret = n;
    render();
  });
  $('.capo').addEventListener('change', e => {
    const n = Math.round(Number(e.target.value));
    if (n >= 0 && n <= 12) draft.capo = n;
    render();
  });

  async function run(action) {
    try {
      const message = await action();
      if (message) status(message);
    } catch (e) {
      status(e.message, true);
    }
  }
  $('.save').addEventListener('click', () => run(async () => {
    const message = await onSave(name, { ...structuredClone(draft), name: draft.name === name ? null : draft.name });
    mark();
    return message;
  }));
  $('.reset').addEventListener('click', () => run(async () => {
    const message = await onReset(name);
    open(name);
    return message;
  }));
  $('.close').addEventListener('click', close);
  // Strums the chart as drawn, then picks each sounding string low to high.
  $('.play')?.addEventListener('click', () => {
    const notes = draft.frets.map((f, i) => (f === null ? null : `${f}.${6 - i}{lr}`)).filter(Boolean);
    if (!notes.length) return status('Every string is muted.', true);
    const picked = [...notes.map(n => `${n}.8`), ...Array(8 - notes.length).fill('r.8')];
    playTex(`\\ts (4 4) (${notes.join(' ')}).1 {bd} | ${picked.join(' ')}`, { ring: true });
  });

  return { close, status };
};
