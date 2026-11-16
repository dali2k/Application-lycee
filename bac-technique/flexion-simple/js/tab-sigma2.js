// Vue isométrique 3D de la poutre fléchie + répartition linéaire de σ(y) sur la section d'extrémité.
// Repère : x = axe de la poutre (vers la droite à l'écran, comme la vue de face), z vers le haut, u = largeur.
// Convention : Mf > 0 → fibres du bas tendues (bleu), fibres du haut comprimées (rouge).
import { svg, arrow } from './svg.js'

const C = Math.cos(Math.PI / 6), S = 0.5
const raw = (x, u, z) => [(x - u) * C, (x + u) * S - z]
const col = (f) => {
  const k = Math.min(1, Math.abs(f)), t = f > 0 ? [214, 64, 47] : [31, 95, 191]
  return `rgb(${[245, 245, 245].map((b, i) => Math.round(b + (t[i] - b) * k))})`
}

/** Contour extérieur (u,z) de la section, descendant à droite puis remontant à gauche. */
function outline(g) {
  const H = g.top + g.bot, ys = new Set()
  for (let i = 0; i <= 30; i++) ys.add(g.top - (H * i) / 30)
  g.breaks.forEach((b) => { ys.add(b - 1e-4); ys.add(b + 1e-4) })
  const R = [], Lf = []
  ;[...ys].map((y) => Math.min(g.top - 1e-3, Math.max(-g.bot + 1e-3, y))).sort((a, b) => b - a).forEach((y) => {
    const sg = g.segs(y)
    if (!sg.length) return
    R.push([Math.max(...sg.map((s) => s[1])), y]); Lf.push([Math.min(...sg.map((s) => s[0])), y])
  })
  return [...R, ...Lf.reverse()]
}

/** el : <svg> ; o = { g (geom), mf (N·mm), ratio (σmax/Rpe) }. */
export function drawIso(el, o) {
  const { g, mf, ratio } = o, K = o.k ?? 1
  el.innerHTML = ''
  const H = g.top + g.bot, wmax = Math.max(...outline(g).map((p) => Math.abs(p[0]))) * 2
  const Lv = 3.2 * Math.max(H, wmax), N = 12, sg = Math.sign(mf), zmax = Math.max(g.top, g.bot)
  const delta = K * sg * 0.35 * H * Math.min(1, ratio || 0)
  const z0 = (x) => -delta * 4 * (x / Lv) * (1 - x / Lv)
  const poly = outline(g), U = 0.9 * H
  const f_ = (z) => K * sg * z / zmax
  const pts = []
  for (const x of [0, Lv]) poly.forEach(([u, z]) => pts.push(raw(x, u, z + z0(x))))
  pts.push(raw(Lv + U, 0, g.top), raw(Lv + U, 0, -g.bot), raw(0, 0, -g.bot - H * 0.6))
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const k = Math.min(500 / (x1 - x0), 280 / (y1 - y0)), ox = 280 - (k * (x0 + x1)) / 2, oy = 150 - (k * (y0 + y1)) / 2
  const P = (x, u, z) => { const [a, b] = raw(x, u, z); return [ox + k * a, oy + k * b] }
  const pt = (arr) => arr.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' ')
  const quad = (a, b, c, d, fill) => svg('polygon', { points: pt([a, b, c, d]), fill, stroke: fill, 'stroke-width': 0.5 }, el)

  for (let i = 0; i < N; i++) {
    const xa = (Lv * i) / N, xb = (Lv * (i + 1)) / N
    for (let j = 0; j < poly.length; j++) {
      const [u1, zz1] = poly[j], [u2, zz2] = poly[(j + 1) % poly.length]
      const nu = -(zz2 - zz1), nz = u2 - u1
      if (nu + nz <= 1e-9) continue
      quad(P(xa, u1, zz1 + z0(xa)), P(xb, u1, zz1 + z0(xb)), P(xb, u2, zz2 + z0(xb)), P(xa, u2, zz2 + z0(xa)), col(f_((zz1 + zz2) / 2) * 0.9))
    }
  }
  // section d'extrémité : bandes colorées par σ(y)
  const n = 36, dz = H / n
  for (let i = 0; i < n; i++) {
    const z = g.top - (i + 0.5) * dz, f = col(f_(z))
    g.segs(z).forEach(([a, b]) => quad(P(Lv, a, z + dz / 2), P(Lv, b, z + dz / 2), P(Lv, b, z - dz / 2), P(Lv, a, z - dz / 2), f))
  }
  svg('polygon', { points: pt(poly.map(([u, z]) => P(Lv, u, z))), fill: 'none', stroke: '#1d2733', 'stroke-width': 1.2 }, el)
  const [gx, gy] = P(Lv, 0, 0)
  svg('line', { x1: P(Lv, -wmax / 2 - 4, 0)[0], y1: P(Lv, -wmax / 2 - 4, 0)[1], x2: P(Lv, wmax / 2 + 4, 0)[0], y2: P(Lv, wmax / 2 + 4, 0)[1], class: 'axis' }, el)
  svg('circle', { cx: gx, cy: gy, r: 3, fill: '#1d2733' }, el)
  if (!sg) return
  // diagramme linéaire de σ : flèches ∥ x (traction = sort de la face, compression = entre dans la face)
  const env = [P(Lv, 0, g.top), P(Lv + Math.abs(f_(g.top)) * U, 0, g.top), P(Lv + Math.abs(f_(-g.bot)) * U, 0, -g.bot), P(Lv, 0, -g.bot)]
  svg('polygon', { points: pt(env), fill: 'rgba(120,130,150,.12)', stroke: '#7b8794', 'stroke-dasharray': '3 3' }, el)
  for (let q = 0; q <= 6; q++) {
    const z = g.top - (H * q) / 6, f = f_(z), L = Math.abs(f) * U
    if (L < 1) continue
    const a = P(Lv, 0, z), b = P(Lv + L, 0, z), cmp = f > 0
    arrow(el, ...(cmp ? [b[0], b[1], a[0], a[1]] : [a[0], a[1], b[0], b[1]]), 'arr ' + (cmp ? 'sg-c' : 'sg-t'))
  }
  const T = (z, txt, cls) => { const [a, b] = P(Lv + U * 1.05, 0, z); svg('text', { x: a + 4, y: b + 4, class: 'lbl ' + cls }, el).textContent = txt }
  T(g.top, f_(g.top) > 0 ? 'compression' : 'traction', f_(g.top) > 0 ? 'sg-c' : 'sg-t')
  T(-g.bot, f_(-g.bot) > 0 ? 'compression' : 'traction', f_(-g.bot) > 0 ? 'sg-c' : 'sg-t')
  svg('text', { x: gx - 8, y: gy - 6, class: 'lbl2', 'text-anchor': 'end' }, el).textContent = 'fibre neutre : σ = 0'
  const [ax, ay] = [30, 300]
  arrow(el, ax, ay, ax + 40, ay + 12, 'arr blue'); svg('text', { x: ax + 44, y: ay + 18, class: 'lbl2' }, el).textContent = 'x'
  arrow(el, ax, ay, ax, ay - 40, 'arr blue'); svg('text', { x: ax - 4, y: ay - 44, class: 'lbl2' }, el).textContent = 'z'
}
