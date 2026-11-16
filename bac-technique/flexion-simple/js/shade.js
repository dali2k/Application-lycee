// Nuances de couleur : plus c'est foncé, plus la matière « compte » dans le moment quadratique.
import { svg } from './svg.js'

const A = [255, 243, 226], B = [179, 45, 0]
let gid = 0

/** t ∈ [0,1] → couleur (clair = peu d'effet, foncé = beaucoup). */
export function shade(t) {
  const k = Math.max(0, Math.min(1, t))
  return `rgb(${A.map((a, i) => Math.round(a + (B[i] - a) * k)).join(',')})`
}

/** Couronne pleine r0..r1 découpée en n anneaux, teinte = (ρ / rRef)². */
export function rings(parent, cx, cy, r0, r1, rRef, n = 30) {
  const circ = (r, sw) => `M${cx + r} ${cy}A${r} ${r} 0 1 ${sw} ${cx - r} ${cy}A${r} ${r} 0 1 ${sw} ${cx + r} ${cy}`
  for (let i = 0; i < n; i++) {
    const a = r0 + ((r1 - r0) * i) / n, b = r0 + ((r1 - r0) * (i + 1)) / n
    const c = shade((((a + b) / 2) / rRef) ** 2)
    svg('path', {
      d: circ(b, 1) + (a > 0 ? circ(a, 0) : '') + 'Z', 'fill-rule': 'evenodd', fill: c, stroke: c, 'stroke-width': 0.6,
    }, parent)
  }
}

/** Rectangle w×h centré en (cx,cy) découpé en nx×ny cellules ; f(u,v) → t, (u,v) = décalage au centre en px. */
export function cells(parent, cx, cy, w, h, nx, ny, f) {
  const cw = w / nx, ch = h / ny
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const u = -w / 2 + (i + 0.5) * cw, v = -h / 2 + (j + 0.5) * ch
    const c = shade(f(u, v))
    svg('rect', { x: cx + u - cw / 2, y: cy + v - ch / 2, width: cw + 0.6, height: ch + 0.6, fill: c, stroke: c, 'stroke-width': 0.3 }, parent)
  }
}

/** Légende : barre dégradée clair → foncé. */
export function legend(parent, x, y, w) {
  const id = 'lg' + ++gid
  const defs = svg('defs', {}, parent)
  const g = svg('linearGradient', { id }, defs)
  svg('stop', { offset: 0, 'stop-color': shade(0) }, g)
  svg('stop', { offset: 1, 'stop-color': shade(1) }, g)
  svg('rect', { x, y, width: w, height: 10, fill: `url(#${id})`, stroke: '#7b8794', 'stroke-width': 0.6 }, parent)
  svg('text', { x: x - 6, y: y + 9, class: 'lbl2', 'text-anchor': 'end' }, parent).textContent = 'compte peu'
  svg('text', { x: x + w + 6, y: y + 9, class: 'lbl2' }, parent).textContent = 'compte beaucoup'
}
