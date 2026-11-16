// Onglet 3 : tracé des diagrammes T et Mf (aires colorées, valeurs signées, repères).
import { svg } from './svg.js'
import { subText } from './math.js'
import { sg as sg0 } from './fx.js'

const sg = (v, n = 2) => sg0(Math.abs(v) < 0.5 * 10 ** -n ? 0 : v, n)

function areas(s, pts, cy, k, sx) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, v0] = pts[i - 1], [x1, v1] = pts[i]
    if (x1 - x0 < 1e-9) continue
    const xc = x0 + ((x1 - x0) * v0) / (v0 - v1)
    const segs = v0 * v1 < 0 ? [[x0, v0, xc, 0], [xc, 0, x1, v1]] : [[x0, v0, x1, v1]]
    for (const [a, va, b, vb] of segs) {
      svg('polygon', { points: `${sx(a)},${cy} ${sx(a)},${cy - va * k} ${sx(b)},${cy - vb * k} ${sx(b)},${cy}`, class: 'area ' + (va + vb >= 0 ? 'pos' : 'neg') }, s)
    }
  }
}

const txt = (s, x, y, t, cls = 'lbl2', anchor = 'middle') => { svg('text', { x, y, 'text-anchor': anchor, class: cls }, s).textContent = t }
/** Ancre de texte : évite de sortir du dessin près des bords. */
const edge = (px, W) => (px < 80 ? 'start' : px > W - 80 ? 'end' : 'middle')

/** o : { sx, W, tY, mY, amp, top } — dessine les deux diagrammes et les repères verticaux. */
export function charts(s, loads, dg, o) {
  const { sx } = o, xs = [...new Set(dg.T.map((p) => p[0]))]
  for (const x of xs) svg('line', { x1: sx(x), y1: o.top, x2: sx(x), y2: o.mY + o.amp + 6, class: 'guide' }, s)
  const panel = (pts, cy, base, sub, unit, cls) => {
    const k = o.amp / Math.max(1e-9, ...pts.map((p) => Math.abs(p[1])))
    areas(s, pts, cy, k, sx)
    svg('line', { x1: sx(0), y1: cy, x2: sx(loads.L), y2: cy, class: 'axis' }, s)
    svg('polyline', { points: pts.map((p) => `${sx(p[0])},${cy - p[1] * k}`).join(' '), class: 'curve ' + cls }, s)
    subText(s, { base, sub, suffix: `(x)  [${unit}]`, x: sx(0), y: cy - o.amp - 14, anchor: 'start', cls: 'lbl' })
    return k
  }
  const kT = panel(dg.T, o.tY, 'T', '', 'N', 't')
  for (let i = 1; i < dg.T.length; i++) {
    const [x0, v] = dg.T[i - 1], x1 = dg.T[i][0]
    if (x1 - x0 > 1e-9) txt(s, sx((x0 + x1) / 2), o.tY - v * kT + (v >= 0 ? -5 : 14), sg(v, 0) + ' N', 'lbl2 val')
  }
  const kM = panel(dg.Mf, o.mY, 'M', 'f', 'N·mm', 'mf')
  for (const [x, v] of dg.Mf) {
    if (Math.abs(v) > 1e-6 && Math.abs(v) < Math.abs(dg.mfMax) - 1e-6) txt(s, sx(x), o.mY - v * kM + (v >= 0 ? -7 : 16), sg(v, 0), 'lbl2 val', edge(sx(x), o.W))
  }
  if (Math.abs(dg.mfMax) > 1e-6) {
    const px = sx(dg.xMf), py = o.mY - dg.mfMax * kM
    svg('circle', { cx: px, cy: py, r: 5, class: 'dot mf' }, s)
    subText(s, { base: 'M', sub: 'f max', suffix: ` = ${sg(dg.mfMax / 1000, 2)} N·m`, x: px, y: py + (dg.mfMax >= 0 ? -10 : 19), anchor: edge(px, o.W), cls: 'lbl strong' })
  }
  // repères T = 0 : changement de signe de T (Mf extrémal)
  for (let i = 1; i < dg.T.length; i++) {
    const [x0, a] = dg.T[i - 1], [x1, b] = dg.T[i]
    if (x1 - x0 < 1e-9 && a * b < 0) {
      svg('line', { x1: sx(x1), y1: o.tY, x2: sx(x1), y2: o.mY, class: 'tzero' }, s)
      txt(s, sx(x1) - 4, o.tY + o.amp + 16, 'T = 0', 'lbl2 strong', 'end')
    }
  }
}
