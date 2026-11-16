// Dessin SVG de la flexion animée : fibres, sections planes, centre de courbure, diagramme σ(y). Fond clair fixe, couleurs lisibles.
// Importateur : tab-flexanim.js. Citation : « dans la contrainte et calcule je veux une animation sur la flexion generer pour que l'eleve comme c'est fait la flexion ».
import { svg, arrow } from './svg.js'

const LB = 380, TH = 1.8, XM = 280, N = 9, AX = 560, W = 60
const RED = '#c2321f', BLUE = '#1f5fbf', INK = '#1d2733', VIO = '#7b3fd0'
const mix = (f) => { const k = Math.min(1, Math.abs(f)), c = f > 0 ? [194, 50, 31] : [31, 95, 191]; return `rgb(${[225, 225, 225].map((b, i) => Math.round(b + (c[i] - b) * k))})` }
const pt = (q) => q.map((v) => v.toFixed(1)).join(',')
const txt = (p, x, y, s, a = {}) => { const e = svg('text', { x, y, 'font-size': 13.5, fill: INK, 'font-weight': 600, ...a }, p); e.textContent = s; return e }

/** o = { g (geom : top, bot), t∈[0,1], sg (+1 sourit / −1 boude) }. Tronçon de longueur neutre LB constante. */
export function drawBeam(el, o) {
  const { g, t, sg } = o, H = g.top + g.bot
  el.innerHTML = ''
  svg('rect', { x: 0, y: 0, width: 640, height: 380, fill: '#fbfaf5', rx: 8 }, el)
  const hh = LB * Math.min(0.26, Math.max(0.1, 1 / 3.2))
  const top = (hh * g.top) / H, bot = (hh * g.bot) / H, ymax = Math.max(top, bot)
  const k = (TH * Math.max(t, 1e-4)) / LB, rho = 1 / k, YM = sg > 0 ? 260 : 120
  // fibre à la hauteur y (px, +haut), abscisse curviligne s de la fibre neutre : rayon ρ − sg·y, section plane radiale
  const P = (s, y) => {
    const f = k * s
    return [XM + (rho - sg * y) * Math.sin(f), YM - sg * 2 * rho * Math.sin(f / 2) ** 2 - y * Math.cos(f)]
  }
  const ys = []
  for (let i = 0; i <= 5; i++) ys.push(top * (1 - i / 5))
  for (let i = 1; i <= 5; i++) ys.push(-bot * (i / 5))
  const ss = Array.from({ length: N }, (_, i) => -LB / 2 + (LB * i) / (N - 1))
  const sm = Array.from({ length: 41 }, (_, i) => -LB / 2 + (LB * i) / 40)
  const body = ys.map((y) => sm.map((s) => P(s, y)))
  svg('polygon', { points: [...body[0], ...[...body[body.length - 1]].reverse()].map(pt).join(' '), fill: '#eceae0', stroke: INK, 'stroke-width': 1.2 }, el)
  ys.forEach((y, j) => {
    const neutral = Math.abs(y) < 1e-9
    svg('polyline', { points: body[j].map(pt).join(' '), fill: 'none', stroke: neutral ? INK : mix(((sg * y) / ymax) * Math.min(1, t * 1.6)), 'stroke-width': neutral ? 2.4 : 3.2, 'stroke-dasharray': neutral ? '7 5' : '', 'stroke-linecap': 'round' }, el)
  })
  const C = [XM, YM - sg * rho], vis = C[1] > 12 && C[1] < 368
  ss.forEach((s, i) => {
    const a = P(s, top), b = P(s, -bot)
    svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: INK, 'stroke-width': 1.5 }, el)
    if (t > 0.12 && (i === 0 || i === N - 1)) {
      const e = sg > 0 ? a : b, d = [C[0] - e[0], C[1] - e[1]], L = Math.hypot(...d) || 1, m = vis ? L : Math.min(L, 140)
      svg('line', { x1: e[0], y1: e[1], x2: e[0] + (d[0] / L) * m, y2: e[1] + (d[1] / L) * m, stroke: VIO, 'stroke-width': 1.3, 'stroke-dasharray': '5 4', opacity: Math.min(1, t * 2) }, el)
    }
  })
  if (vis) {
    svg('circle', { cx: C[0], cy: C[1], r: 4.5, fill: VIO }, el)
    txt(el, C[0] + 9, C[1] + 4, 'centre de courbure', { fill: VIO, 'font-size': 12.5 })
  }
  if (t > 0.35) {
    const al = 34 * Math.min(1, (t - 0.35) * 2.5)
    ;[[-LB / 2, -1], [LB / 2, 1]].forEach(([s, dir]) => {
      const f = k * s
      ;[[top, sg > 0], [-bot, sg < 0]].forEach(([y, cmp]) => {
        const [x, yy] = P(s, y), a = [x + Math.cos(f) * dir * al, yy - sg * Math.sin(f) * dir * al]
        arrow(el, ...(cmp ? [a[0], a[1], x, yy] : [x, yy, a[0], a[1]]), 'arr').style.color = cmp ? RED : BLUE
      })
    })
    const ly = sg > 0 ? 24 : 338
    txt(el, 14, ly, 'rouge : raccourcies', { fill: RED, 'font-size': 12.5 })
    txt(el, 14, ly + 20, 'bleu : allongées', { fill: BLUE, 'font-size': 12.5 })
  }
  if (t > 0.1) txt(el, 14, sg > 0 ? 368 : 24, 'pointillés noirs : fibre neutre, longueur inchangée', { 'font-size': 12.5 })
  // diagramme σ(y) triangulaire (compression à gauche, traction à droite), centré sur l'extrémité droite
  const yc = P(LB / 2, 0)[1], ya = (y) => yc - y, w = W * t
  const xt = AX - sg * w * (top / ymax), xb = AX + sg * w * (bot / ymax)
  svg('polygon', { points: [[AX, ya(top)], [xt, ya(top)], [xb, ya(-bot)], [AX, ya(-bot)]].map(pt).join(' '), fill: 'rgba(120,100,150,.2)', stroke: '#6b5a8c', 'stroke-width': 1.5 }, el)
  svg('line', { x1: AX, y1: ya(top), x2: AX, y2: ya(-bot), stroke: INK, 'stroke-width': 1.5 }, el)
  svg('line', { x1: AX - W - 4, y1: ya(0), x2: AX + W + 4, y2: ya(0), stroke: INK, 'stroke-dasharray': '4 3' }, el)
  txt(el, AX, ya(top) - 10, 'σ(y)', { 'text-anchor': 'middle' })
  if (t > 0.5) {
    txt(el, AX + 5, ya(0) - 4, 'σ = 0', { 'font-size': 12 })
    const lab = (x, y, str, col) => { const r = x > AX; txt(el, Math.max(4, Math.min(636, x + (r ? 30 : -30))), y, str, { 'font-size': 11.5, 'text-anchor': r ? 'end' : 'start', fill: col }) }
    lab(xt, ya(top) + 15, sg > 0 ? 'compression' : 'traction', sg > 0 ? RED : BLUE)
    lab(xb, ya(-bot) + 15, sg > 0 ? 'traction' : 'compression', sg > 0 ? BLUE : RED)
  }
}
