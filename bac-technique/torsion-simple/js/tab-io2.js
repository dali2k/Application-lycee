// Onglet 3 (suite) : plein vs creux à aire égale, et moment quadratique du rectangle (avec nuances de couleur).
import { svg, h, slider, fmt } from './svg.js'
import { ioPlein, ioTube, iRect } from './calc.js'
import { rings, cells, legend } from './shade.js'

export function mountExtras(root) {
  // --- Plein ou creux, à matière égale ---
  const c1 = h('div', { class: 'card' }, root, `<h3>Plein ou creux, à matière égale ?</h3>
    <p>Même échelle de couleur pour les deux : <b>plus c'est foncé, plus cette matière pèse dans Io</b> (elle est loin du centre).</p>`)
  const g1 = h('div', { class: 'grid2' }, c1)
  const s1 = svg('svg', { viewBox: '0 0 360 190' }, g1)
  const r1 = h('div', {}, g1)
  let D = 60, k = 0.6
  const ctl1 = h('div', {}, r1)
  const out1 = h('div', {}, r1)
  slider(ctl1, { label: 'Diamètre extérieur D', min: 20, max: 100, step: 5, value: D, unit: 'mm', digits: 0, onInput: (v) => { D = v; draw1() } })
  slider(ctl1, { label: 'Rapport d / D', min: 0.1, max: 0.9, step: 0.05, value: k, digits: 2, onInput: (v) => { k = v; draw1() } })
  function draw1() {
    s1.innerHTML = ''
    const d = k * D, deq = Math.sqrt(D * D - d * d), sc = 65 / 50, Rm = (D / 2) * sc
    const t = ioTube(D, d), p = ioPlein(deq)
    rings(s1, 90, 75, (d / 2) * sc, Rm, Rm)
    rings(s1, 265, 75, 0, (deq / 2) * sc, Rm)
    const o = { fill: 'none', stroke: '#5a6676', 'stroke-width': 2 }
    svg('circle', { cx: 90, cy: 75, r: Rm, ...o }, s1)
    svg('circle', { cx: 90, cy: 75, r: (d / 2) * sc, ...o }, s1)
    svg('circle', { cx: 265, cy: 75, r: (deq / 2) * sc, ...o }, s1)
    svg('text', { x: 62, y: 150, class: 'lbl2' }, s1).textContent = 'tube'
    svg('text', { x: 215, y: 150, class: 'lbl2' }, s1).textContent = 'plein, même aire'
    legend(s1, 110, 166, 140)
    out1.innerHTML = `<table class="res">
      <tr><td>Io tube</td><td>${fmt(t, 0)} mm⁴</td></tr>
      <tr><td>Io plein (d = ${fmt(deq, 1)} mm)</td><td>${fmt(p, 0)} mm⁴</td></tr>
      <tr><td>Rapport tube / plein</td><td><b>× ${fmt(t / p, 2)}</b></td></tr></table>
      <p class="lbl2">Même quantité de matière : le plein garde un cœur clair (il compte peu), le tube met toute sa matière dans la zone foncée.</p>`
  }
  draw1()

  // --- Rectangle ---
  const c2 = h('div', { class: 'card' }, root, `<h3>Section rectangulaire</h3>
    <p>Pour un rectangle b × h (h = côté vertical), les moments quadratiques par rapport aux axes passant par G sont :</p>
    <div class="formula">I<sub>Gx</sub> = b·h³ / 12 &nbsp;&nbsp; I<sub>Gy</sub> = h·b³ / 12 &nbsp;&nbsp; I<sub>o</sub> = I<sub>Gx</sub> + I<sub>Gy</sub></div>`)
  const g2 = h('div', { class: 'grid2' }, c2)
  const left2 = h('div', {}, g2)
  const s2 = svg('svg', { viewBox: '0 0 300 200' }, left2)
  const r2 = h('div', {}, g2)
  let b = 30, hh = 60, mode = 'o'
  const MODES = {
    o: ['Io : distance au centre G', 'La couleur montre ρ² : la distance au centre G (calcul de Io).'],
    x: ['I<sub>Gx</sub> : distance à l’axe Gx', 'La couleur montre y² : la distance à l’axe horizontal Gx. Le haut et le bas comptent le plus.'],
    y: ['I<sub>Gy</sub> : distance à l’axe Gy', 'La couleur montre x² : la distance à l’axe vertical Gy. La gauche et la droite comptent le plus.'],
  }
  const btns = h('div', { class: 'btns' }, r2)
  const why = h('p', { class: 'lbl2' }, r2)
  Object.entries(MODES).forEach(([key, [label]]) => {
    const bt = h('button', { type: 'button', 'data-m': key }, btns, label)
    bt.addEventListener('click', () => { mode = key; draw2() })
  })
  const out2 = h('div', {})
  slider(r2, { label: 'Base b', min: 10, max: 100, step: 5, value: b, unit: 'mm', digits: 0, onInput: (v) => { b = v; draw2() } })
  slider(r2, { label: 'Hauteur h', min: 10, max: 100, step: 5, value: hh, unit: 'mm', digits: 0, onInput: (v) => { hh = v; draw2() } })
  r2.appendChild(out2)
  function draw2() {
    s2.innerHTML = ''
    btns.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode))
    why.textContent = MODES[mode][1]
    const sc = 1.4, W = b * sc, H = hh * sc, cx = 150, cy = 85
    const tmax = (W / 2) ** 2 + (H / 2) ** 2
    const f = mode === 'o' ? (u, v) => (u * u + v * v) / tmax : mode === 'x' ? (u, v) => (v / (H / 2)) ** 2 : (u) => (u / (W / 2)) ** 2
    cells(s2, cx, cy, W, H, Math.max(4, Math.round(W / 6)), Math.max(4, Math.round(H / 6)), f)
    svg('rect', { x: cx - W / 2, y: cy - H / 2, width: W, height: H, fill: 'none', stroke: '#5a6676', 'stroke-width': 2 }, s2)
    svg('line', { x1: 10, y1: cy, x2: 290, y2: cy, class: 'axis' }, s2)
    svg('line', { x1: cx, y1: 5, x2: cx, y2: 170, class: 'axis' }, s2)
    svg('text', { x: 268, y: cy - 5, class: 'lbl2' }, s2).textContent = 'Gx'
    svg('text', { x: cx + 4, y: 14, class: 'lbl2' }, s2).textContent = 'Gy'
    legend(s2, 100, 182, 100)
    const ix = iRect(b, hh), iy = iRect(hh, b)
    out2.innerHTML = `<table class="res">
      <tr><td>I<sub>Gx</sub> = b·h³/12</td><td>${fmt(ix, 0)} mm⁴</td></tr>
      <tr><td>I<sub>Gy</sub> = h·b³/12</td><td>${fmt(iy, 0)} mm⁴</td></tr>
      <tr><td>Io = I<sub>Gx</sub> + I<sub>Gy</sub></td><td>${fmt(ix + iy, 0)} mm⁴</td></tr></table>
      <p class="lbl2">Le h est au cube : une poutre « debout » résiste bien mieux à la flexion qu'« à plat ». Pour un cercle, I<sub>Gx</sub> = I<sub>Gy</sub> = π·d⁴/64 donc Io = π·d⁴/32.</p>`
  }
  draw2()
}
