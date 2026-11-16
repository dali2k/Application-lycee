// Onglet 2 : mini-courbes T(x) et Mf(x) tracées progressivement jusqu'à G, avec point suivi.
import { svg } from './svg.js'
import { subText } from './math.js'
import { sg as sg0 } from './fx.js'

const sg = (v, n = 2) => sg0(Math.abs(v) < 0.5 * 10 ** -n ? 0 : v, n)

/** o : { sx, xe, T, Mf (valeurs en G), tY, mY, amp, g0 (début du repère vertical) }. */
export function drawCurves(s, loads, dg, o) {
  svg('line', { x1: o.sx(o.xe), y1: o.g0, x2: o.sx(o.xe), y2: o.mY + o.amp + 8, class: 'guide' }, s)
  const one = (pts, cy, v, cls, base, sub, unit) => {
    const k = o.amp / Math.max(1e-9, ...pts.map((p) => Math.abs(p[1])))
    const P = (p) => `${o.sx(p[0])},${cy - p[1] * k}`
    svg('line', { x1: o.sx(0), y1: cy, x2: o.sx(loads.L), y2: cy, class: 'axis' }, s)
    svg('polyline', { points: pts.map(P).join(' '), class: 'curve ghost' }, s)
    // à gauche : tracé de 0 à G ; à droite : tracé de G à L (le côté étudié suit le choix de l'élève)
    const done = o.side === 'd' ? [[o.xe, v], ...pts.filter((p) => p[0] > o.xe)] : [...pts.filter((p) => p[0] < o.xe), [o.xe, v]]
    svg('polyline', { points: done.map(P).join(' '), class: 'curve ' + cls }, s)
    svg('circle', { cx: o.sx(o.xe), cy: cy - v * k, r: 4.5, class: 'dot ' + cls }, s)
    const y = cy - o.amp - 8
    subText(s, { base, sub, suffix: `(x)  [${unit}]`, x: o.sx(0), y, anchor: 'start', cls: 'lbl' })
    subText(s, { base, sub, suffix: ` = ${sg(v, 0)} ${unit}`, x: o.sx(loads.L), y, anchor: 'end', cls: 'lbl cur ' + cls })
  }
  one(dg.T, o.tY, o.T, 't', 'T', '', 'N')
  one(dg.Mf, o.mY, o.Mf, 'mf', 'M', 'f', 'N·mm')
}
