// Onglet 2 : contrainte tangentielle τ dans la section droite, pour 4 types de sections.
import { svg, h, slider, arrow, fmt } from './svg.js'
import { SECTIONS, compute, norm } from './sections.js'

const C = 160, G = 80000
const NOTES = {
  plein: 'Cercle plein : τ = G·θ·ρ croît linéairement avec ρ. Nulle sur l’axe (fibre neutre), maximale au bord (ρ = R).',
  tube: 'Tube : même loi τ = G·θ·ρ mais seulement entre r et R. Le centre, où τ ≈ 0, est vide : on garde la matière là où elle sert.',
  rect: 'Rectangle : τ = G·θ·ρ n’est plus valable (la section se gauchit). τ est nulle au centre et aux 4 coins, maximale au milieu des grands côtés.',
  rectcreux: 'Rectangle creux (paroi mince) : τ est presque uniforme dans la paroi, τ = Mt / (2·Am·t), Am = aire limitée par la ligne moyenne.',
}

export function mount(root) {
  root.innerHTML = ''
  const grid = h('div', { class: 'grid2' }, root)
  const left = h('div', {}, grid), right = h('div', {}, grid)
  const face = svg('svg', { viewBox: '0 0 320 320', role: 'img', 'aria-label': 'Contrainte tangentielle dans la section' }, left)
  const gS = svg('g', {}, face)
  svg('text', { x: 10, y: 22, class: 'lbl' }, face).textContent = '↻ Mt'
  const plot = svg('svg', { viewBox: '0 0 320 190', style: 'margin-top:12px' }, left)

  let id = 'plein', mt = 150
  const p = {}
  Object.values(SECTIONS).forEach((s) => s.dims.forEach(([k, , , , def]) => { if (p[k] == null) p[k] = def }))

  const ctl = h('div', { class: 'card' }, right, '<h2>Choisir la section</h2>')
  const btns = h('div', { class: 'btns' }, ctl)
  slider(ctl, { label: 'Couple Mt', min: 10, max: 500, step: 10, value: mt, unit: 'N·m', digits: 0, onInput: (v) => { mt = v; refresh(false) } })
  const dimBox = h('div', {}, ctl)
  const replay = h('button', { type: 'button', class: 'btn' }, ctl, '↻ Rejouer l’animation')
  replay.addEventListener('click', () => refresh(true))
  const note = h('div', { class: 'warn' }, right)
  const read = h('div', { class: 'card', style: 'margin-top:14px' }, right)

  function draw(anim) {
    gS.innerHTML = ''
    const q = norm(id, p)
    const f = 0.4 + (0.6 * mt) / 500
    const cls = anim ? 'arr grow' : 'arr'
    const put = (x, y, vx, vy, len, delay) => {
      const m = Math.hypot(vx, vy) || 1
      const g = arrow(gS, x - (vx / m) * len / 2, y - (vy / m) * len / 2, x + (vx / m) * len / 2, y + (vy / m) * len / 2, cls)
      if (anim) { g.style.transformOrigin = `${x}px ${y}px`; g.style.animationDelay = delay + 's' }
    }
    const st = { fill: '#fde8dc', stroke: '#5a6676', 'stroke-width': 2 }
    if (id === 'plein' || id === 'tube') {
      const Dm = id === 'plein' ? q.d : q.D, sc = 260 / Dm, Rr = (Dm / 2) * sc, r = id === 'plein' ? 0 : (q.d / 2) * sc
      svg('circle', { cx: C, cy: C, r: Rr, ...st }, gS)
      if (r) svg('circle', { cx: C, cy: C, r, ...st, fill: '#fff' }, gS)
      for (let k = 0; k < 5; k++) {
        const rho = r ? r + ((Rr - r) * k) / 4 : (Rr * (k + 1)) / 5
        const n = Math.max(6, Math.round(rho / 5))
        for (let j = 0; j < n; j++) {
          const a = (2 * Math.PI * (j + (k % 2) / 2)) / n
          put(C + rho * Math.cos(a), C + rho * Math.sin(a), -Math.sin(a), Math.cos(a), 34 * f * (rho / Rr), k * 0.12)
        }
      }
      svg('circle', { cx: C, cy: C, r: 3, fill: '#1d2733' }, gS)
    } else {
      const sc = 260 / q.h, W = q.b * sc, H = q.h * sc
      svg('rect', { x: C - W / 2, y: C - H / 2, width: W, height: H, ...st }, gS)
      if (id === 'rect') {
        const nx = 5, ny = Math.min(11, Math.max(5, Math.round((4 * q.h) / q.b) + 1))
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const x = -q.b / 2 + (q.b * i) / (nx - 1), y = -q.h / 2 + (q.h * j) / (ny - 1)
          const vx = -(Math.PI / q.h) * Math.cos((Math.PI * x) / q.b) * Math.sin((Math.PI * y) / q.h)
          const vy = (Math.PI / q.b) * Math.sin((Math.PI * x) / q.b) * Math.cos((Math.PI * y) / q.h)
          const rel = Math.hypot(vx, vy) / (Math.PI / q.b)
          if (rel > 0.05) put(C + x * sc, C + y * sc, vx, vy, 34 * f * rel, (Math.hypot(x, y) / q.h) * 0.8)
        }
      } else {
        const t = q.t * sc
        svg('rect', { x: C - W / 2 + t, y: C - H / 2 + t, width: W - 2 * t, height: H - 2 * t, ...st, fill: '#fff' }, gS)
        const x0 = C - W / 2 + t / 2, x1 = C + W / 2 - t / 2, y0 = C - H / 2 + t / 2, y1 = C + H / 2 - t / 2
        ;[[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]].forEach(([ax, ay, bx, by], si) => {
          const n = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / 40))
          for (let i = 0; i < n; i++) {
            const u = (i + 0.5) / n
            put(ax + (bx - ax) * u, ay + (by - ay) * u, bx - ax, by - ay, 30 * f, si * 0.15)
          }
        })
      }
    }
  }

  function drawPlot(r) {
    plot.innerHTML = ''
    const q = norm(id, p)
    let pts, xmax, xl = 'ρ (mm)'
    if (id === 'plein') { xmax = q.d / 2; pts = [[0, 0], [xmax, r.tauMax]] }
    else if (id === 'tube') { xmax = q.D / 2; pts = [[0, 0], [q.d / 2, 0], [q.d / 2, r.tauMin], [xmax, r.tauMax]] }
    else if (id === 'rect') {
      xmax = q.b / 2; xl = 'x : du centre au milieu du grand côté (mm)'
      pts = Array.from({ length: 21 }, (_, i) => [(xmax * i) / 20, r.tauMax * Math.sin((Math.PI * ((xmax * i) / 20)) / q.b)])
    } else { xmax = q.b / 2; xl = 'x : du centre à l’extérieur (mm)'; pts = [[0, 0], [xmax - q.t, 0], [xmax - q.t, r.tauMax], [xmax, r.tauMax]] }
    const X = (x) => 40 + (x / xmax) * 255, Y = (t) => 150 - (t / r.tauMax) * 115
    svg('line', { x1: 40, y1: 150, x2: 300, y2: 150, stroke: '#5a6676' }, plot)
    svg('line', { x1: 40, y1: 150, x2: 40, y2: 25, stroke: '#5a6676' }, plot)
    svg('polyline', { points: pts.map(([x, t]) => `${X(x)},${Y(t)}`).join(' '), fill: 'none', stroke: '#d9480f', 'stroke-width': 3 }, plot)
    const T = (x, y, txt) => { svg('text', { x, y, class: 'lbl2' }, plot).textContent = txt }
    T(6, 16, 'τ (MPa)'); T(46, 22, `τmax = ${fmt(r.tauMax)} MPa`); T(36, 164, '0'); T(X(xmax) - 12, 164, fmt(xmax, 1)); T(40, 180, xl)
  }

  function refresh(anim) {
    const r = compute(id, p, mt * 1000, G)
    draw(anim); drawPlot(r)
    note.textContent = NOTES[id]
    read.innerHTML = `<table class="res">
      <tr><td>τ maximale</td><td>${fmt(r.tauMax)} MPa</td></tr>
      ${r.tauMin && id === 'tube' ? `<tr><td>τ minimale (bord intérieur)</td><td>${fmt(r.tauMin)} MPa</td></tr>` : ''}
      <tr><td>Angle unitaire θ</td><td>${fmt(r.theta * 1e5, 3)} ×10⁻⁵ rad/mm</td></tr>
      <tr><td>Aire de matière</td><td>${fmt(r.area, 0)} mm²</td></tr></table>
      <p class="lbl2">${SECTIONS[id].circ ? 'τ = Mt·ρ / Io' : 'Coefficients de tables de RDM (valeurs indicatives).'} · G = 80 000 MPa</p>`
  }

  function pick(key) {
    id = key
    btns.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === key))
    dimBox.innerHTML = ''
    SECTIONS[key].dims.forEach(([k, label, min, max]) =>
      slider(dimBox, { label, min, max, step: 1, value: p[k], unit: 'mm', digits: 0, onInput: (v) => { p[k] = v; refresh(false) } }))
    refresh(true)
  }

  Object.entries(SECTIONS).forEach(([key, s]) => {
    const b = h('button', { type: 'button', 'data-id': key }, btns, s.label)
    b.addEventListener('click', () => pick(key))
  })
  pick('plein')
}
