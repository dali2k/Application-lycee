// Onglet 3 : vue « Comment la poutre se déforme » (dessin SVG). Appuis fixes, forces qui suivent la poutre.
import { svg, arrow, fmt } from './svg.js'
import { subText } from './math.js'
import { labelOf, labelLanes, pointRows } from './beam-layout.js'
import { drawWall } from './beam.js'
import { deformee, zonesFlexion, autoScale, sample, penteNulle } from './deform.js'

const ZH = 150, PITCH = 16

/** drawDeform(s, loads, type, { sx, W }) → { H, DY, set(amp), cursor(xmm|null), EI } ; amp = facteur d'exagération appliqué (0 = droite). */
export function drawDeform(s, loads, type, { sx, W }) {
  const pts = deformee(loads, type), k = autoScale(pts, ZH), { zones, inflex } = zonesFlexion(pts)
  const ys = pts.map((p) => p.y * k * 3)
  const up3 = Math.max(0, ...ys), dn3 = Math.max(0, ...ys.map((v) => -v))
  const lanes = labelLanes(loads.forces, sx), maxLane = Math.max(0, ...Object.values(lanes).map((p) => p.lane))
  const DY = 124 + maxLane * PITCH + up3, H = DY + dn3 + 100 + maxLane * PITCH
  const pxmm = sx(1) - sx(0), api = { H, DY, EI: 7.2e10 }
  const X = (x) => sx(x)
  // fonds de zones + libellés
  for (const z of zones) {
    const pos = z.sign > 0
    svg('rect', { x: X(z.x0), y: 4, width: X(z.x1) - X(z.x0), height: H - 8, class: 'dz ' + (pos ? 'pos' : 'neg') }, s)
    const w = X(z.x1) - X(z.x0), mid = (X(z.x0) + X(z.x1)) / 2
    svg('text', { x: mid, y: 38, 'text-anchor': 'middle', class: 'lbl2 dzt ' + (pos ? 'pos' : 'neg') }, s).textContent =
      w > 150 ? (pos ? 'Mf > 0 : sourit, bas tendu' : 'Mf < 0 : pleure, haut tendu') : w > 70 ? (pos ? 'Mf > 0 : sourit' : 'Mf < 0 : pleure') : (pos ? 'Mf > 0' : 'Mf < 0')
  }
  for (const f of loads.forces) svg('line', { x1: X(f.x), y1: 4, x2: X(f.x), y2: H - 4, class: 'guide' }, s)
  svg('line', { x1: X(0), y1: DY, x2: X(loads.L), y2: DY, class: 'axis' }, s)
  const note = svg('text', { x: W - 10, y: 18, 'text-anchor': 'end', class: 'lbl2 exag' }, s)
  // appuis (fixes)
  if (type === 'encastree') {
    const xe = loads.forces.find((f) => f.kind === 'unknown')?.x ?? 0
    drawWall(s, X(xe), DY, xe > 0)
  } else for (const f of loads.forces.filter((u) => u.kind === 'unknown')) {
    svg('polygon', { points: `${X(f.x)},${DY + 5} ${X(f.x) - 9},${DY + 22} ${X(f.x) + 9},${DY + 22}`, fill: '#e5e9ef', stroke: '#5a6676' }, s)
  }
  // poutre : bande + fibres
  const line = (cls) => svg('polyline', { class: cls, points: '' }, s)
  const edge = line('bm-edge'), body = line('bm-body'), neu = line('fiber m0 bm-neu')
  const topF = line('fiber bm-f'), botF = line('fiber bm-f')
  const tens = zones.map((z) => ({ z, el: line('tens ' + (z.sign > 0 ? 'pos' : 'neg')), idx: pts.map((p, i) => i).filter((i) => pts[i].x >= z.x0 - 1e-6 && pts[i].x <= z.x1 + 1e-6) }))
  const infl = inflex.map((x) => ({ x, c: svg('circle', { r: 6, class: 'inflex' }, s), t: svg('text', { 'text-anchor': 'middle', class: 'lbl2 strong' }, s) }))
  for (const i of infl) i.t.textContent = 'inflexion'
  // forces (suivent la poutre)
  const vmax = Math.max(1, ...loads.forces.map((f) => Math.abs(f.value)))
  const fg = loads.forces.map((f) => {
    const g = svg('g', {}, s), x = X(f.x), len = 14 + (26 * Math.abs(f.value)) / vmax, up = f.value > 0
    const a = up ? arrow(g, x, 28 + len, x, 28, 'arr') : arrow(g, x, -28 - len, x, -8, 'arr')
    a.setAttribute('class', 'arr ' + (f.kind === 'unknown' ? 'f-react' : 'f-known'))
    const lane = lanes[f.id].lane * PITCH, { base, sub, suffix } = labelOf(f)
    subText(g, { base, sub, suffix, x, y: up ? 28 + len + 14 + lane : -28 - len - 6 - lane, anchor: 'middle', cls: 'lbl2' })
    return { f, g, i: pts.findIndex((p) => p.x === f.x) }
  })
  const { lane: rows } = pointRows(loads.forces, sx)
  for (const f of loads.forces) svg('text', { x: X(f.x), y: H - 30 + rows[f.id] * 14, 'text-anchor': 'middle', class: 'lbl pt' }, s).textContent = f.id
  // curseur
  const cur = svg('g', { class: 'cur', hidden: '' }, s)
  const cl = svg('line', { class: 'cur-l', y1: 4, y2: H - 4 }, cur), ct = svg('line', { class: 'cur-t' }, cur), cc = svg('circle', { r: 6, class: 'dot mf' }, cur)
  let amp = 0, cx = null
  const Y = (p) => DY - amp * k * p.y
  const pl = (el, off, a = 0, b = pts.length - 1, ix) => el.setAttribute('points', (ix || pts.slice(a, b + 1).map((p, i) => i + a)).map((i) => `${X(pts[i].x)},${Y(pts[i]) + off}`).join(' '))
  function drawCursor() {
    cur.toggleAttribute('hidden', cx === null)
    if (cx === null) return
    const p = sample(pts, cx), x = X(cx), y = Y(p), sl = (-amp * k * p.theta) / pxmm, d = 26 / Math.hypot(1, sl)
    cl.setAttribute('x1', x); cl.setAttribute('x2', x); cc.setAttribute('cx', x); cc.setAttribute('cy', y)
    for (const [a, v] of [['x1', x - d], ['y1', y - sl * d], ['x2', x + d], ['y2', y + sl * d]]) ct.setAttribute(a, v)
  }
  api.set = (a) => {
    amp = a
    pl(edge, 0); pl(body, 0); pl(neu, 0); pl(topF, -5.5); pl(botF, 5.5)
    for (const t of tens) pl(t.el, t.z.sign > 0 ? 5.5 : -5.5, 0, 0, t.idx)
    for (const i of infl) {
      const p = sample(pts, i.x), y = Y(p)
      i.c.setAttribute('cx', X(i.x)); i.c.setAttribute('cy', y); i.t.setAttribute('x', X(i.x)); i.t.setAttribute('y', y - 14)
    }
    for (const g of fg) g.g.setAttribute('transform', `translate(0 ${Y(pts[g.i])})`)
    const r = (amp * k * api.EI) / pxmm
    note.textContent = amp === 0 ? 'Poutre droite (non déformée)' : `Déformation très exagérée (≈ × ${fmt(r, r < 10 ? 1 : 0)})`
    drawCursor()
  }
  api.cursor = (x) => { cx = x; drawCursor() }
  api.pts = pts; api.zonesInfl = inflex; api.zeroSlope = penteNulle(pts)
  api.set(0)
  return api
}
