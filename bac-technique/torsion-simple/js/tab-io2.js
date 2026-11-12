// Onglet 3 (suite) : plein vs creux à aire égale, et moment quadratique du rectangle.
import { svg, h, slider, fmt } from './svg.js'
import { ioPlein, ioTube, iRect } from './calc.js'

export function mountExtras(root) {
  // --- Plein ou creux, à matière égale ---
  const c1 = h('div', { class: 'card' }, root, '<h3>Plein ou creux, à matière égale ?</h3>')
  const g1 = h('div', { class: 'grid2' }, c1)
  const s1 = svg('svg', { viewBox: '0 0 360 150' }, g1)
  const r1 = h('div', {}, g1)
  let D = 60, k = 0.6
  const ctl1 = h('div', {}, r1)
  const out1 = h('div', {}, r1)
  slider(ctl1, { label: 'Diamètre extérieur D', min: 20, max: 100, step: 5, value: D, unit: 'mm', digits: 0, onInput: (v) => { D = v; draw1() } })
  slider(ctl1, { label: 'Rapport d / D', min: 0.1, max: 0.9, step: 0.05, value: k, digits: 2, onInput: (v) => { k = v; draw1() } })
  function draw1() {
    s1.innerHTML = ''
    const d = k * D, deq = Math.sqrt(D * D - d * d), sc = 65 / 50
    const t = ioTube(D, d), p = ioPlein(deq)
    svg('circle', { cx: 90, cy: 75, r: (D / 2) * sc, fill: '#fde8dc', stroke: '#5a6676', 'stroke-width': 2 }, s1)
    svg('circle', { cx: 90, cy: 75, r: (d / 2) * sc, fill: '#fff', stroke: '#5a6676', 'stroke-width': 2 }, s1)
    svg('circle', { cx: 265, cy: 75, r: (deq / 2) * sc, fill: '#fde8dc', stroke: '#5a6676', 'stroke-width': 2 }, s1)
    svg('text', { x: 60, y: 146, class: 'lbl2' }, s1).textContent = 'tube'
    svg('text', { x: 215, y: 146, class: 'lbl2' }, s1).textContent = 'plein, même aire'
    out1.innerHTML = `<table class="res">
      <tr><td>Io tube</td><td>${fmt(t, 0)} mm⁴</td></tr>
      <tr><td>Io plein (d = ${fmt(deq, 1)} mm)</td><td>${fmt(p, 0)} mm⁴</td></tr>
      <tr><td>Rapport tube / plein</td><td><b>× ${fmt(t / p, 2)}</b></td></tr></table>
      <p class="lbl2">Même quantité de matière : le tube a un Io plus grand car sa matière est loin du centre.</p>`
  }
  draw1()

  // --- Rectangle ---
  const c2 = h('div', { class: 'card' }, root, `<h3>Section rectangulaire</h3>
    <p>Pour un rectangle b × h (h = côté vertical), les moments quadratiques par rapport aux axes passant par G sont :</p>
    <div class="formula">I<sub>Gx</sub> = b·h³ / 12 &nbsp;&nbsp; I<sub>Gy</sub> = h·b³ / 12 &nbsp;&nbsp; I<sub>o</sub> = I<sub>Gx</sub> + I<sub>Gy</sub></div>`)
  const g2 = h('div', { class: 'grid2' }, c2)
  const s2 = svg('svg', { viewBox: '0 0 240 170' }, g2)
  const r2 = h('div', {}, g2)
  let b = 30, hh = 60
  const out2 = h('div', {})
  slider(r2, { label: 'Base b', min: 10, max: 100, step: 5, value: b, unit: 'mm', digits: 0, onInput: (v) => { b = v; draw2() } })
  slider(r2, { label: 'Hauteur h', min: 10, max: 100, step: 5, value: hh, unit: 'mm', digits: 0, onInput: (v) => { hh = v; draw2() } })
  r2.appendChild(out2)
  function draw2() {
    s2.innerHTML = ''
    const sc = 140 / 100, W = b * sc, H = hh * sc
    svg('rect', { x: 120 - W / 2, y: 85 - H / 2, width: W, height: H, fill: '#e3edfb', stroke: '#1f5fbf', 'stroke-width': 2 }, s2)
    svg('line', { x1: 10, y1: 85, x2: 230, y2: 85, class: 'axis' }, s2)
    svg('line', { x1: 120, y1: 5, x2: 120, y2: 165, class: 'axis' }, s2)
    svg('text', { x: 212, y: 80, class: 'lbl2' }, s2).textContent = 'Gx'
    svg('text', { x: 124, y: 14, class: 'lbl2' }, s2).textContent = 'Gy'
    const ix = iRect(b, hh), iy = iRect(hh, b)
    out2.innerHTML = `<table class="res">
      <tr><td>I<sub>Gx</sub> = b·h³/12</td><td>${fmt(ix, 0)} mm⁴</td></tr>
      <tr><td>I<sub>Gy</sub> = h·b³/12</td><td>${fmt(iy, 0)} mm⁴</td></tr>
      <tr><td>Io = I<sub>Gx</sub> + I<sub>Gy</sub></td><td>${fmt(ix + iy, 0)} mm⁴</td></tr></table>
      <p class="lbl2">Le h est au cube : une poutre « debout » résiste bien mieux à la flexion qu'« à plat ». Pour un cercle, I<sub>Gx</sub> = I<sub>Gy</sub> = π·d⁴/64 donc Io = π·d⁴/32.</p>`
  }
  draw2()
}
