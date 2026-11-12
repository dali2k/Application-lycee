// Onglet 1 : qu'est-ce que la torsion ? (hélice, angle de torsion α, angle unitaire θ)
import { svg, h, slider, loop, fmt } from './svg.js'
import { ioPlein, theta, alpha, radToDeg } from './calc.js'

const D = 30, G = 80000, MT_MAX = 200, L_MAX = 1000
const X0 = 80, X1 = 480, CY = 150, R = 60, N = 60, A0 = Math.PI / 3

export function mount(root) {
  root.innerHTML = ''
  const grid = h('div', { class: 'grid2' }, root)
  const left = h('div', {}, grid), right = h('div', {}, grid)
  const s = svg('svg', { viewBox: '0 0 560 300', role: 'img', 'aria-label': 'Arbre soumis à la torsion' }, left)
  const face = svg('svg', { viewBox: '0 0 560 230', role: 'img', 'aria-label': 'Vue de face : angle de torsion α', style: 'margin-top:12px' }, left)
  const info = h('div', { class: 'card', style: 'margin-top:12px' }, left)

  svg('rect', { x: X0, y: CY - R, width: X1 - X0, height: 2 * R, fill: '#eef2f7', stroke: '#7b8794' }, s)
  svg('ellipse', { cx: X0, cy: CY, rx: 10, ry: R, fill: '#dde4ec', stroke: '#7b8794' }, s)
  svg('line', { x1: 40, y1: CY, x2: 520, y2: CY, class: 'axis' }, s)
  svg('text', { x: 235, y: CY - 5, class: 'lbl2' }, s).textContent = 'fibre neutre (reste droite)'
  const dyn = svg('g', {}, s)

  let mt = 120, len = 600

  function couple(x, left, w) {
    const dir = left ? 1 : -1
    const d = left ? `M${x} ${CY + 46}A12 46 0 0 1 ${x} ${CY - 46}` : `M${x} ${CY - 46}A12 46 0 0 1 ${x} ${CY + 46}`
    svg('path', { d, fill: 'none', stroke: '#1f5fbf', 'stroke-width': w }, dyn)
    const y = left ? CY - 46 : CY + 46
    svg('polygon', { points: `${x + 9 * dir},${y} ${x - 1 * dir},${y - 5 * dir} ${x - 1 * dir},${y + 5 * dir}`, fill: '#1f5fbf' }, dyn)
    svg('text', { x: left ? x - 38 : x + 18, y: left ? CY - 52 : CY + 62, class: 'lbl' }, dyn).textContent = 'Mt'
  }

  function mark(x, ang, color) {
    const front = Math.cos(ang) > 0
    svg('line', { x1: x, y1: CY, x2: x, y2: CY + R * Math.sin(ang), stroke: color, 'stroke-width': 3, 'stroke-dasharray': front ? '' : '3 3' }, dyn)
  }

  // Vue de face (côté libre) : rayon gris = position de départ, rayon rouge = après torsion, secteur = α.
  function drawFace(vis, al) {
    const cx = 150, cy = 115, r = 85, a0 = -Math.PI / 2, a1 = a0 + vis
    const P = (a, k = 1) => [cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)]
    face.innerHTML = ''
    svg('circle', { cx, cy, r, fill: '#fff', stroke: '#7b8794', 'stroke-width': 2 }, face)
    const [x0, y0] = P(a0), [x1, y1] = P(a1)
    if (vis > 0.01) {
      svg('path', { d: `M${cx} ${cy}L${x0} ${y0}A${r} ${r} 0 ${vis > Math.PI ? 1 : 0} 1 ${x1} ${y1}Z`, fill: 'rgba(217,72,15,.22)' }, face)
      const [ax, ay] = P(a1 - 0.04, 0.55), [bx, by] = P(a0 + vis / 2, 0.62)
      svg('path', { d: `M${P(a0, 0.55)[0]} ${P(a0, 0.55)[1]}A${r * 0.55} ${r * 0.55} 0 0 1 ${ax} ${ay}`, fill: 'none', stroke: '#d9480f', 'stroke-width': 3 }, face)
      const t = P(a1, 0.55), u = [-Math.sin(a1), Math.cos(a1)]
      svg('polygon', { points: `${t[0] + u[0] * 4},${t[1] + u[1] * 4} ${t[0] - u[1] * 6 - u[0] * 2},${t[1] + u[0] * 6 - u[1] * 2} ${t[0] + u[1] * 6 - u[0] * 2},${t[1] - u[0] * 6 - u[1] * 2}`, fill: '#d9480f' }, face)
      svg('text', { x: bx + 4, y: by - 4, class: 'lbl', style: 'font-size:18px;font-weight:700;fill:#d9480f' }, face).textContent = 'α'
    }
    svg('line', { x1: cx, y1: cy, x2: x0, y2: y0, stroke: '#7b8794', 'stroke-width': 3, 'stroke-dasharray': '6 4' }, face)
    svg('line', { x1: cx, y1: cy, x2: x1, y2: y1, stroke: '#d9480f', 'stroke-width': 3.5 }, face)
    svg('circle', { cx, cy, r: 4, fill: '#1d2733' }, face)
    const T = (x, y, txt, st = '') => { svg('text', { x, y, class: 'lbl', style: st }, face).textContent = txt }
    T(cx + 8, 20, 'départ (avant torsion)', 'fill:#5a6676'); T(cx - 90, 222, 'vue de face, côté libre')
    T(320, 70, 'Que représente α ?', 'font-weight:700;font-size:15px')
    T(320, 98, 'Le rayon gris marque où était un point')
    T(320, 118, 'de la section avant la torsion.')
    T(320, 146, 'Le rayon rouge montre où il est après.', 'fill:#d9480f')
    T(320, 172, 'α = angle entre les deux rayons', 'font-weight:700')
    T(320, 194, `ici ${fmt(radToDeg(al), 3)}° (dessiné ×${fmt(vis / Math.max(al, 1e-9), 0)})`, 'fill:#5a6676;font-size:11px')
  }

  function draw() {
    const io = ioPlein(D)
    const th = theta(mt * 1000, G, io), al = alpha(th, len)
    const vis = (al / alpha(theta(MT_MAX * 1000, G, io), L_MAX)) * 2.4
    dyn.innerHTML = ''
    for (let k = 8; k >= 0; k--) {
      const a = A0 + (k * 2 * Math.PI) / 9
      let d = '', pen = false
      for (let i = 0; i <= N; i++) {
        const ang = a + (vis * i) / N
        if (Math.cos(ang) > 0) {
          d += `${pen ? 'L' : 'M'}${(X0 + ((X1 - X0) * i) / N).toFixed(1)} ${(CY + R * Math.sin(ang)).toFixed(1)}`
          pen = true
        } else pen = false
      }
      svg('path', { d, class: 'fiber' + (k === 0 ? ' m0' : '') }, dyn)
    }
    svg('ellipse', { cx: X1, cy: CY, rx: 10, ry: R, fill: '#dde4ec', 'fill-opacity': 0.7, stroke: '#7b8794' }, dyn)
    mark(X0, A0, '#7b8794')
    mark(X1, A0 + vis, '#d9480f')
    svg('text', { x: X1 + 16, y: CY + (R * Math.sin(A0 + vis)) / 2, class: 'lbl' }, dyn).textContent = 'α'
    svg('text', { x: X0 + 4, y: CY - R - 8, class: 'lbl2' }, dyn).textContent = 'M₀M : génératrice devenue hélice'
    svg('text', { x: X0 - 22, y: CY + R + 18, class: 'lbl2' }, dyn).textContent = 'section fixe'
    svg('text', { x: X1 - 40, y: CY + R + 18, class: 'lbl2' }, dyn).textContent = 'section libre'
    drawFace(vis, al)
    const w = 1.5 + (mt / MT_MAX) * 3.5
    couple(X0 - 20, true, w)
    couple(X1 + 20, false, w)
    info.innerHTML = `<table class="res">
      <tr><td>Couple Mt</td><td>${fmt(mt, 0)} N·m</td></tr>
      <tr><td>Longueur L</td><td>${fmt(len, 0)} mm</td></tr>
      <tr><td>Angle unitaire θ = α / L</td><td>${fmt(th * 1e5, 3)} ×10⁻⁵ rad/mm</td></tr>
      <tr><td>Angle de torsion α</td><td>${fmt(al, 5)} rad = ${fmt(radToDeg(al), 3)}°</td></tr></table>
      <p class="lbl2">Arbre plein d = ${D} mm, G = 80 000 MPa. Rotation dessinée très exagérée pour être visible.</p>`
  }

  const ctl = h('div', { class: 'card' }, right, '<h2>Essai de torsion</h2>')
  const mtS = slider(ctl, { label: 'Couple Mt', min: 0, max: MT_MAX, step: 1, value: mt, unit: 'N·m', digits: 0, onInput: (v) => { mt = v; draw() } })
  slider(ctl, { label: 'Longueur L', min: 200, max: L_MAX, step: 10, value: len, unit: 'mm', digits: 0, onInput: (v) => { len = v; draw() } })
  const btns = h('div', { class: 'btns' }, ctl)
  const play = h('button', { type: 'button' }, btns, '▶ Animer')
  const anim = loop((t) => mtS.set(MT_MAX * (0.5 - 0.5 * Math.cos(t * 1.3))))
  play.addEventListener('click', () => {
    anim.on ? anim.stop() : anim.start()
    play.classList.toggle('on', anim.on)
    play.textContent = anim.on ? '⏸ Pause' : '▶ Animer'
  })

  h('div', { class: 'card' }, right, `<h3>Définition</h3>
    <p>Une poutre est sollicitée à la <b>torsion simple</b> lorsqu'elle est soumise, à ses deux extrémités, à deux <b>couples égaux et opposés</b> dont les moments sont portés par la ligne moyenne.</p>`)
  h('div', { class: 'card' }, right, `<h3>Ce que l'on observe</h3>
    <ul><li>La génératrice <b>M₀M</b> se déforme en <b>hélice</b> quand Mt augmente.</li>
    <li>La section droite tourne d'un angle <b>α</b> autour de l'axe.</li>
    <li>α est proportionnel à la longueur : <b>α = θ · L</b> (θ = angle unitaire).</li>
    <li>Seule la fibre axiale reste droite : c'est la <b>fibre neutre</b>.</li></ul>
    <div class="formula">Mt = G · θ · Io</div>
    <p>Plus L est grand, plus α est grand. Plus Io est grand, moins l'arbre se tord.</p>`)
  draw()
  return () => anim.stop()
}
