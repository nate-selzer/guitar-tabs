// Chord chart SVG for build.mjs and the pages. A shape has frets (low E -> high e, null = muted), and optionally fingers ('T' or '1'-'4' per string), barres ([{ fret, from, to, finger }], strings low to high), baseFret and capo.
const chordChart = (() => {
  const X0 = 14, DX = 10, Y0 = 12, DY = 12;
  const x = i => X0 + i * DX;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // The first fret shown is baseFret if set, else 1 unless the shape reaches past fret 4; at least 5 frets are shown.
  function layout({ frets, baseFret, barres = [] }) {
    const fretted = [...frets, ...barres.map(b => b.fret)].filter(f => f);
    const top = Math.max(0, ...fretted);
    const base = baseFret ?? (top > 4 ? Math.min(...fretted) : 1);
    return { base, rows: Math.max(5, top - base + 1) };
  }
  const covered = (barres = [], i, f) => barres.some(b => b.fret === f && i >= b.from && i <= b.to);

  function svg(name, shape) {
    const { frets, fingers = [], barres = [], capo } = shape;
    const { base, rows } = layout(shape);
    const cy = f => Y0 + (f - base + 0.5) * DY;
    const inView = f => f >= base && f < base + rows;
    const label = (cx, y, text) => `<text x="${cx}" y="${y + 2.6}" text-anchor="middle" font-size="7" font-weight="700" style="fill: var(--thumb-text, #fff)">${esc(text)}</text>`;
    const marks = frets.map((f, i) => {
      if (f === null) return `<text x="${x(i)}" y="9" text-anchor="middle" font-size="9">×</text>`;
      if (f === 0) return `<circle cx="${x(i)}" cy="6" r="3" fill="none" stroke="currentColor"/>`;
      if (!inView(f) || covered(barres, i, f)) return '';
      return fingers[i] ? `<circle cx="${x(i)}" cy="${cy(f)}" r="4.6"/>${label(x(i), cy(f), fingers[i])}` : `<circle cx="${x(i)}" cy="${cy(f)}" r="3.6"/>`;
    });
    const bars = barres.filter(b => inView(b.fret)).map(b =>
      `<rect x="${x(b.from) - 4.6}" y="${cy(b.fret) - 4.6}" width="${x(b.to) - x(b.from) + 9.2}" height="9.2" rx="4.6"/>${b.finger ? label((x(b.from) + x(b.to)) / 2, cy(b.fret), b.finger) : ''}`);
    const nut = base === 1 && !capo;
    const lines = [
      ...[0, 1, 2, 3, 4, 5].map(i => `<line x1="${x(i)}" y1="${Y0}" x2="${x(i)}" y2="${Y0 + rows * DY}" stroke="currentColor" stroke-width=".8"/>`),
      ...Array.from({ length: rows + 1 }, (_, j) => `<line x1="${X0}" y1="${Y0 + j * DY}" x2="${x(5)}" y2="${Y0 + j * DY}" stroke="currentColor" stroke-width="${j === 0 && nut ? 3 : .8}"/>`),
    ];
    const side = base > 1 ? `<text x="7" y="${Y0 + 0.5 * DY + 3}" text-anchor="middle" font-size="9">${base}</text>`
      : capo ? `<rect x="${X0 - 4}" y="${Y0 - 3}" width="${5 * DX + 8}" height="4" rx="2"/><text x="6" y="${Y0 + 2.5}" text-anchor="middle" font-size="7" font-weight="700">C${capo}</text>` : '';
    return `<svg viewBox="0 0 72 ${Y0 + rows * DY + 4}" role="img" aria-label="${esc(name)}: ${frets.map(f => f ?? 'x').join(' ')}" fill="currentColor" font-family="ui-monospace, Menlo, monospace">${lines.join('')}${side}${bars.join('')}${marks.join('')}</svg>`;
  }

  return { svg, layout, covered, X0, DX, Y0, DY };
})();
