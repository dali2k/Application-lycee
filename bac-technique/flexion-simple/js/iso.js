// Vue isométrique 3D (SVG pur) d'une poutre vrillée : prisme découpé en tranches tournées de θ(x).
// Repère : x = axe de la poutre, (y, z) = plan de la section, z vers le haut. Observateur en (+,+,+).
import { svg, arrow } from './svg.js'

const C = Math.cos(Math.PI / 6), S = 0.5, M = 26
const rot = ([y, z], t) => [y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)]
const circle = (r, n = 56) => Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n)])
const rect = (w, h) => [[w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]] // anti-horaire
const tone = (t) => { const a = [59, 79, 107], b = [183, 201, 226], k = Math.min(1, Math.max(0, t)); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k))})` }
const fmtP = (arr) => arr.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')
const dpath = (pts) => 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z'
let cid = 0

/** Polygones (y,z) de la section : contour extérieur et, s'il y a lieu, contour intérieur. */
export function polys(sec, q) {
  if (sec === 'plein') return { outer: circle(q.d / 2) }
  if (sec === 'tube') return { outer: circle(q.D / 2), inner: circle(q.d / 2) }
  if (sec === 'rect') return { outer: rect(q.b, q.h) }
  return { outer: rect(q.b, q.h), inner: rect(q.b - 2 * q.t, q.h - 2 * q.t) }
}

/** Point du contour touché par le rayon d'angle a, et normale sortante de l'arête touchée. */
function ray(poly, a) {
  const dy = Math.cos(a), dz = Math.sin(a)
  let best = null
  poly.forEach((p, k) => {
    const q = poly[(k + 1) % poly.length], ey = q[0] - p[0], ez = q[1] - p[1], den = dy * ez - dz * ey
    if (Math.abs(den) < 1e-9) return
    const t = (p[0] * ez - p[1] * ey) / den, u = (dz * p[0] - dy * p[1]) / den, l = Math.hypot(ey, ez)
    if (t > 0 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, pt: [t * dy, t * dz], n: [ez / l, -ey / l] }
  })
  return best
}

/**
 * o = { sec, q (dimensions normalisées), L (mm), vis (rad dessinés), lines: [textes] }
 * Renvoie { compressed } (vrai si la longueur est raccourcie à l'écran).
 */
export function drawBeam(el, o) {
  const { sec, q, L, lines = [] } = o
  const vis = -o.vis // angle négatif dans (y,z) = sens anti-horaire à l'écran, vu du bout libre
  el.innerHTML = ''
  const { outer, inner } = polys(sec, q)
  const md = Math.max(...outer.flat().map(Math.abs)) * 2
  const r = L / md, X = (r <= 5 ? r : 5 + 2 * Math.log(r / 5)) * md
  const wall = md * 1.35, wt = md * 0.3
  const raw = (x, y, z) => [(x - y) * C, (x + y) * S - z]

  // cadrage automatique
  const pts = []
  for (const x of [-wt, 0]) for (const y of [-wall, wall]) for (const z of [-wall, wall]) pts.push(raw(x, y, z))
  outer.forEach((p) => pts.push(raw(X, ...rot(p, vis))))
  circle(md * 0.72, 12).forEach((p) => pts.push(raw(X, ...p)))
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const f = Math.min(520 / (x1 - x0), 270 / (y1 - y0))
  const ox = 280 - (f * (x0 + x1)) / 2, oy = 155 - (f * (y0 + y1)) / 2
  const P = (x, y, z) => { const [a, b] = raw(x, y, z); return [ox + f * a, oy + f * b] }
  const poly = (parent, p, fill, stroke = fill, sw = 0.5) => svg('polygon', { points: fmtP(p), fill, stroke, 'stroke-width': sw }, parent)

  // mur (encastrement)
  poly(el, [P(-wt, wall, wall), P(-wt, wall, -wall), P(0, wall, -wall), P(0, wall, wall)], '#b3bcc8')
  poly(el, [P(-wt, -wall, wall), P(-wt, wall, wall), P(0, wall, wall), P(0, -wall, wall)], '#dde3ea')
  poly(el, [P(0, wall, wall), P(0, wall, -wall), P(0, -wall, -wall), P(0, -wall, wall)], '#c9d1db', '#8793a3', 1.2)
  svg('text', { x: P(0, -wall, wall)[0] - 4, y: P(0, -wall, wall)[1] - 6, class: 'lbl2' }, el).textContent = 'encastrement'

  // faces latérales visibles, triées de l'arrière vers l'avant
  const quads = (pl, inside) => {
    const out = [], n = pl.length
    for (let i = 0; i < M; i++) {
      const t0 = (vis * i) / M, t1 = (vis * (i + 1)) / M, xa = (X * i) / M, xb = (X * (i + 1)) / M
      for (let k = 0; k < n; k++) {
        const a = pl[k], b = pl[(k + 1) % n], ey = b[0] - a[0], ez = b[1] - a[1], l = Math.hypot(ey, ez) || 1
        const [ny, nz] = rot([ez / l, -ey / l], (t0 + t1) / 2)
        if (inside ? ny + nz >= 0 : ny + nz <= 0) continue
        const A = rot(a, t0), B = rot(b, t0), D = rot(b, t1), E = rot(a, t1)
        out.push({
          d: (xa + xb) / 2 + (A[0] + B[0]) / 2 + (A[1] + B[1]) / 2,
          p: [P(xa, ...A), P(xa, ...B), P(xb, ...D), P(xb, ...E)],
          c: inside ? tone(0.12) : tone(0.25 + 0.75 * Math.max(0, ny * 0.45 + nz * 0.9)),
        })
      }
    }
    return out.sort((u, v) => u.d - v.d)
  }
  quads(outer, false).forEach(({ p, c }) => poly(el, p, c))

  // génératrices : rouge = M₀M, grises = autres fibres (elles s'enroulent en hélices)
  const helix = (a, color, w) => {
    const g = ray(outer, a)
    let seg = []
    const flush = () => { if (seg.length > 1) svg('polyline', { points: fmtP(seg), fill: 'none', stroke: color, 'stroke-width': w }, el); seg = [] }
    for (let i = 0; i <= M; i++) {
      const t = (vis * i) / M, [ny, nz] = rot(g.n, t)
      if (ny + nz > 0) { const [y, z] = rot(g.pt, t); seg.push(P((X * i) / M, y, z)) } else flush()
    }
    flush()
  }
  ;[Math.PI / 4 + Math.PI / 2, Math.PI / 4 + Math.PI, Math.PI / 4 - Math.PI / 2].forEach((a) => helix(a, '#e9eef5', 1.2))
  helix(Math.PI / 4, '#d9480f', 2.8)

  // face d'extrémité (côté libre)
  const endPoly = (pl) => pl.map((p) => P(X, ...rot(p, vis)))
  svg('path', { d: dpath(endPoly(outer)) + (inner ? dpath(endPoly(inner)) : ''), 'fill-rule': 'evenodd', fill: '#e7edf5', stroke: '#2b3a4f', 'stroke-width': 1.2 }, el)
  if (inner) {
    const id = 'clp' + ++cid
    svg('polygon', { points: fmtP(endPoly(inner)) }, svg('clipPath', { id }, svg('defs', {}, el)))
    const g = svg('g', { 'clip-path': `url(#${id})` }, el)
    quads(inner, true).forEach(({ p, c }) => poly(g, p, c))
    svg('path', { d: dpath(endPoly(inner)), fill: 'none', stroke: '#2b3a4f', 'stroke-width': 1.2 }, el)
  }

  // repères de l'angle α sur la face libre : gris = départ, rouge = après torsion
  const A0 = Math.PI / 2, rho = Math.hypot(...ray(outer, A0).pt) * 0.92
  const E = (a, k = 1) => P(X, k * rho * Math.cos(a), k * rho * Math.sin(a))
  const c0 = P(X, 0, 0)
  const ln = (p, q2, st) => svg('line', { x1: p[0], y1: p[1], x2: q2[0], y2: q2[1], ...st }, el)
  ln(c0, E(A0), { stroke: '#5a6676', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' })
  if (Math.abs(vis) > 0.03) {
    const arc = Array.from({ length: 17 }, (_, j) => E(A0 + (vis * j) / 16, 0.55))
    svg('polygon', { points: fmtP([c0, ...arc]), fill: 'rgba(217,72,15,.28)' }, el)
    svg('polyline', { points: fmtP(arc), fill: 'none', stroke: '#d9480f', 'stroke-width': 2.5 }, el)
    arrow(el, ...arc[14], ...arc[16], 'arr')
    const m = E(A0 + vis / 2, 0.8)
    svg('text', { x: m[0] - 6, y: m[1] + 5, class: 'lbl', style: 'font-size:17px;font-weight:700;fill:#d9480f' }, el).textContent = 'α'
  }
  ln(c0, E(A0 + vis), { stroke: '#d9480f', 'stroke-width': 3 })
  svg('circle', { cx: c0[0], cy: c0[1], r: 3, fill: '#1d2733' }, el)

  // couple Mt appliqué au bout libre
  const ring = Array.from({ length: 31 }, (_, j) => { const a = 0.5 - (o.vis < 0 ? -4.0 : 4.0) * j / 30; return P(X, md * 0.65 * Math.cos(a), md * 0.65 * Math.sin(a)) })
  svg('polyline', { points: fmtP(ring), fill: 'none', stroke: '#1f5fbf', 'stroke-width': 3 }, el)
  arrow(el, ...ring[27], ...ring[30], 'arr blue')
  svg('text', { x: ring[0][0] + 6, y: ring[0][1] + 14, class: 'lbl', style: 'font-weight:700;fill:#1f5fbf' }, el).textContent = 'Mt'

  // encart : vue de face agrandie du bout libre, pour lire l'angle α
  const ic = [480, 82], k = 50 / Math.max(...outer.map((p) => Math.hypot(...p)))
  // encart en miroir (y vers la gauche) : même sens de rotation à l'écran que la vue 3D
  const S2 = (p, a = 0) => { const [y, z] = rot(p, a); return [ic[0] - k * y, ic[1] - k * z] }
  svg('rect', { x: 408, y: 8, width: 144, height: 150, fill: '#fff', stroke: '#c5cdd8', rx: 6 }, el)
  svg('text', { x: 414, y: 24, class: 'lbl2' }, el).textContent = 'Vue de face du bout libre'
  svg('polygon', { points: fmtP(outer.map((p) => S2(p))), fill: 'none', stroke: '#8793a3', 'stroke-dasharray': '4 3' }, el)
  svg('path', { d: dpath(outer.map((p) => S2(p, vis))) + (inner ? dpath(inner.map((p) => S2(p, vis))) : ''), 'fill-rule': 'evenodd', fill: '#e7edf5', stroke: '#2b3a4f', 'stroke-width': 1.5 }, el)
  const R2 = (a, kk = 1) => [ic[0] - k * rho * kk * Math.cos(a), ic[1] - k * rho * kk * Math.sin(a)]
  if (Math.abs(vis) > 0.03) {
    const arc2 = Array.from({ length: 17 }, (_, j) => R2(A0 + (vis * j) / 16, 0.55))
    svg('polygon', { points: fmtP([ic, ...arc2]), fill: 'rgba(217,72,15,.28)' }, el)
    svg('polyline', { points: fmtP(arc2), fill: 'none', stroke: '#d9480f', 'stroke-width': 2.5 }, el)
    arrow(el, ...arc2[14], ...arc2[16], 'arr')
    const m2 = R2(A0 + vis / 2, 0.82)
    svg('text', { x: m2[0] - 6, y: m2[1] + 6, class: 'lbl', style: 'font-size:18px;font-weight:700;fill:#d9480f' }, el).textContent = 'α'
  }
  ln(ic, R2(A0), { stroke: '#5a6676', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' })
  ln(ic, R2(A0 + vis), { stroke: '#d9480f', 'stroke-width': 3 })

  lines.forEach((t, i) => { svg('text', { x: 12, y: 300 + i * 16, class: 'lbl2' }, el).textContent = t })
  return { compressed: r > 5 }
}
