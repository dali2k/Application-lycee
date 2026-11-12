// Onglet 3 : moment quadratique polaire Io = Σ ρ²·ΔS (animation par couronnes).
import { svg, h, slider, loop, fmt } from './svg.js'
import { ioPlein } from './calc.js'
import { mountExtras } from './tab-io2.js'
import { legend, shade } from './shade.js'

export function mount(root) {
  root.innerHTML = ''
  h('div', { class: 'card' }, root, `<h2>Le moment quadratique polaire Io</h2>
    <p>Io indique <b>comment la matière est répartie autour du centre</b> de la section. On découpe la section en petits morceaux d'aire ΔS. Un morceau situé à la distance <b>ρ</b> du centre compte <b>ρ² · ΔS</b> : plus il est loin, plus il compte, et même au carré !</p>
    <div class="formula">Io = Σ ρ² · ΔS &nbsp;&nbsp; (mm⁴) &nbsp;&nbsp; cercle plein : Io = π·d⁴ / 32</div>`)
  const grid = h('div', { class: 'grid2' }, root)
  const left = h('div', {}, grid), right = h('div', {}, grid)
  const s = svg('svg', { viewBox: '0 0 560 300', role: 'img', 'aria-label': 'Couronnes et contributions' }, left)
  let d = 40, n = 8, shown = 8
  const R = 115, cx = 130, cy = 140

  const read = h('div', { class: 'card' }, right)
  const ctl = h('div', { class: 'card' }, right, '<h3>Découper la section</h3>')
  slider(ctl, { label: 'Diamètre d', min: 10, max: 100, step: 5, value: d, unit: 'mm', digits: 0, onInput: (v) => { d = v; shown = n; draw() } })
  slider(ctl, { label: 'Nombre de couronnes', min: 3, max: 16, step: 1, value: n, digits: 0, onInput: (v) => { n = v; shown = n; draw() } })
  const play = h('button', { type: 'button', class: 'btn' }, ctl, '▶ Ajouter les couronnes une à une')

  function draw() {
    s.innerHTML = ''
    const rings = Array.from({ length: n }, (_, i) => {
      const r0 = ((d / 2) * i) / n, r1 = ((d / 2) * (i + 1)) / n, rho = (r0 + r1) / 2
      return { c: rho * rho * Math.PI * (r1 * r1 - r0 * r0) }
    })
    const cmax = rings[n - 1].c
    let sum = 0
    rings.forEach(({ c }, i) => {
      const on = i < shown
      if (on) sum += c
      const R0 = (R * i) / n, R1 = (R * (i + 1)) / n
      const circ = (r, sw) => `M${cx + r} ${cy}A${r} ${r} 0 1 ${sw} ${cx - r} ${cy}A${r} ${r} 0 1 ${sw} ${cx + r} ${cy}`
      svg('path', {
        d: circ(R1, 1) + (R0 > 0 ? circ(R0, 0) : '') + 'Z', 'fill-rule': 'evenodd',
        fill: on ? shade(c / cmax) : '#f3f5f8', stroke: '#fff',
      }, s)
      const bw = 220 / n, bh = (150 * c) / cmax
      svg('rect', { x: 320 + i * bw + 1, y: 240 - bh, width: bw - 2, height: bh, fill: on ? shade(c / cmax) : '#e5e9ef', stroke: on ? '#b32d00' : 'none', 'stroke-width': 0.6 }, s)
    })
    const T = (x, y, txt, cls = 'lbl2') => { svg('text', { x, y, class: cls }, s).textContent = txt }
    svg('line', { x1: 320, y1: 240, x2: 540, y2: 240, stroke: '#5a6676' }, s)
    svg('circle', { cx, cy, r: 3, fill: '#1d2733' }, s)
    T(cx - 40, 275, 'section (vue de face)'); T(320, 258, 'ρ : du centre vers le bord →')
    legend(s, 380, 278, 70)
    T(320, 40, 'contribution ρ²·ΔS de chaque couronne', 'lbl')
    T(320, 62, `Σ = ${fmt(sum, 0)} mm⁴`, 'lbl')
    const exact = ioPlein(d)
    read.innerHTML = `<table class="res">
      <tr><td>Σ ρ²·ΔS (couronnes allumées)</td><td>${fmt(sum, 0)} mm⁴</td></tr>
      <tr><td>Formule π·d⁴/32</td><td>${fmt(exact, 0)} mm⁴</td></tr>
      <tr><td>Écart (plus de couronnes → plus exact)</td><td>${fmt((100 * (sum - exact)) / exact, 2)} %</td></tr></table>
      <p>Les couronnes du <b>bord</b> contribuent le plus : ρ est grand <i>et</i> leur aire aussi.</p>
      <p><b>Pourquoi d⁴ ?</b> d = ${d} mm → Io = ${fmt(exact, 0)} mm⁴ ; d = ${2 * d} mm → Io = ${fmt(ioPlein(2 * d), 0)} mm⁴.
      Doubler d multiplie Io par 2⁴ = <b>16</b>.</p>`
  }

  const anim = loop((t) => {
    const k = Math.min(n, Math.floor(t / 0.4))
    if (k !== shown) { shown = k; draw() }
    if (k >= n) { anim.stop(); play.textContent = '↻ Rejouer' }
  })
  play.addEventListener('click', () => { shown = 0; draw(); anim.stop(); anim.start() })
  draw()
  mountExtras(root)
  return () => anim.stop()
}
