// Onglet 4 : moment quadratique IGz. Bandes ∥ Gz ajoutées une à une, teinte = (y/ymax)², Σ y²ΔS vs formule.
// Citation : « une partie du cours pour expliquer le moment d'inertie dans plusieurs section ».
import { svg, h, fmt, slider, loop, reduced, arrow } from './svg.js'
import { shade, legend } from './shade.js'
import { SECS, defaults, geom, huygens, compare } from './tab-io2.js'
import { subText } from './math.js'
import { fn, ks, eqs, devI, withTex, MM, MM2, MM3, MM4 } from './tex.js'

const tr = (a, b) => `<tr><td>${a}</td><td>${b}</td></tr>`
const tbl = (rows) => `<div class="tw"><table class="res">${rows.join('')}</table></div>`

export function mount(root) {
  let id = 'rect', p = defaults(id), couche = false, n = 12, shown = 12
  const lp = loop((t) => { shown = Math.min(n, Math.floor((t * n) / 4)); paint(); if (shown >= n) lp.stop() })
  const eff = () => (id === 'rect' && couche ? { b: p.h, h: p.b } : p)

  const intro = h('div', { class: 'card' }, root, withTex(`<h2>Moment quadratique $I_{Gz}$</h2>
    <p>En flexion, la poutre se plie autour de l'axe <b>$G_{z}$ horizontal</b> (passant par $G$). Une fibre à la distance <b>$y$</b> de $G_{z}$ s'allonge ou se raccourcit
    proportionnellement à $y$ : ce sont donc les fibres <b>éloignées de $G_{z}$</b> qui résistent le plus. Chaque petite surface $\\Delta S$ apporte $y^{2}\\,\\Delta S$ :</p>`))
  eqs(intro, [`I_{Gz} = \\sum y^{2}\\,\\Delta S \\qquad (\\text{mm}^{4})`])
  h('p', {}, intro, withTex('Découpe la section en <b>bandes horizontales</b> (parallèles à $G_{z}$) : plus la bande est foncée, plus elle compte.'))
  const grid = h('div', { class: 'grid2' }, root), L = h('div', {}, grid), R = h('div', {}, grid)
  const c1 = h('div', { class: 'card' }, L)
  const sel = h('div', { class: 'btns secsel' }, c1)
  const ctl = h('div', {}, c1)
  const s = svg('svg', { viewBox: '0 0 560 370', role: 'img', 'aria-label': 'Section découpée en bandes' }, c1)
  const act = h('div', { class: 'btns' }, c1)
  const out = h('div', {}, c1)
  const info = h('div', { class: 'card' }, R), more = h('div', {}, R)
  compare(more)

  const bPlay = h('button', { type: 'button' }, act, '▶ Lancer')
  const bRe = h('button', { type: 'button' }, act, '↻ Rejouer')
  bPlay.onclick = () => { if (lp.on) { lp.stop(); bPlay.textContent = '▶ Reprendre' } else { shown = Math.min(shown, n - 1); lp.start() } }
  bRe.onclick = () => { shown = 0; lp.stop(); lp.start(); paint() }
  slider(act.parentNode.insertBefore(h('div', {}), out), { label: 'Nombre de bandes', min: 2, max: 60, value: n, digits: 0, onInput: (v) => { n = v; shown = v; lp.stop(); paint() } })

  SECS.forEach((sc) => {
    const b = h('button', { type: 'button', 'data-id': sc.id }, sel, sc.label)
    b.onclick = () => { id = sc.id; p = defaults(id); shown = n; lp.stop(); build() }
  })

  function build() {
    sel.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id))
    ctl.innerHTML = ''
    if (id === 'rect') {
      const t = h('div', { class: 'btns' }, ctl)
      ;['debout', 'couché'].forEach((l, i) => {
        const b = h('button', { type: 'button', class: couche === !!i ? 'on' : '' }, t, l)
        b.onclick = () => { couche = !!i; build() }
      })
    }
    SECS.find((x) => x.id === id).par.forEach(([k, label, min, max, v]) => {
      slider(ctl, { label, min, max, value: p[k], unit: 'mm', digits: 0, onInput: (x) => { p[k] = x; shown = n; lp.stop(); paint() } })
    })
    paint()
  }

  function paint() {
    const g = geom(id, eff()), H = g.top + g.bot, ymax = Math.max(g.top, g.bot)
    let wmax = 0
    for (let i = 0; i <= 100; i++) wmax = Math.max(wmax, g.w(g.top - (H * i) / 100))
    const sc = Math.min(200 / wmax, 280 / H), cx = 140, Y = (y) => 24 + (g.top - y) * sc
    s.innerHTML = ''
    const dy = H / n
    const bands = Array.from({ length: n }, (_, k) => { const y = g.top - (k + 0.5) * dy; return { y, segs: g.segs(y), c: y * y * g.w(y) * dy } })
    const vis = new Set([...bands].sort((a, b) => Math.abs(a.y) - Math.abs(b.y)).slice(0, shown))
    const cmax = Math.max(...bands.map((b) => b.c), 1e-9)
    let sum = 0
    svg('text', { x: 552, y: 16, class: 'lbl', 'text-anchor': 'end' }, s).textContent = 'contribution y²·ΔS de chaque bande'
    for (const b of bands) {
      const top = Y(b.y + dy / 2), hh = dy * sc
      if (vis.has(b)) {
        sum += b.c
        const col = shade((b.y / ymax) ** 2)
        b.segs.forEach(([a, z]) => svg('rect', { x: cx + a * sc, y: top, width: (z - a) * sc, height: hh + 0.4, fill: col, stroke: col, 'stroke-width': 0.4 }, s))
        svg('rect', { x: 300, y: top + 0.5, width: Math.max(1, (240 * b.c) / cmax), height: Math.max(1, hh - 1), fill: col, stroke: '#b32d00', 'stroke-width': 0.4 }, s)
      } else {
        b.segs.forEach(([a, z]) => svg('rect', { x: cx + a * sc, y: top, width: (z - a) * sc, height: hh, fill: 'none', stroke: '#cbd2d9', 'stroke-dasharray': '2 2' }, s))
      }
    }
    svg('line', { x1: 8, x2: 548, y1: Y(0), y2: Y(0), class: 'axis' }, s)
    subText(s, { base: 'G', sub: 'z', x: 548, y: Y(0) - 5, anchor: 'end', cls: 'lbl' })
    svg('circle', { cx, cy: Y(0), r: 3.5, fill: '#1d2733' }, s)
    arrow(s, 22, Y(0), 22, Y(g.top), 'arr blue'); svg('text', { x: 28, y: (Y(0) + Y(g.top)) / 2, class: 'lbl2' }, s).textContent = 'v'
    if (g.parts) g.parts.forEach((r, i) => {
      if (Math.abs(r.d) < 0.5) return
      const ax = 44 + 12 * i
      arrow(s, ax, Y(0), ax, Y(r.d), 'arr'); subText(s, { base: 'd', sub: String(i + 1), x: ax + 3, y: (Y(0) + Y(r.d)) / 2, anchor: 'start', cls: 'lbl2' })
    })
    legend(s, 150, 338, 150)
    subText(s, { base: 'teinte = (y / y', sub: 'max', suffix: ')²', x: 150, y: 366, anchor: 'start', cls: 'lbl2' })
    const done = shown >= n, ec = ((sum - g.I) / g.I) * 100
    out.innerHTML = tbl([tr(ks(`\\sum y^{2}\\Delta S\\;(${shown}/${n}\\text{ bandes})`), ks(fn(sum, 0) + MM4)),
      tr(ks('I_{Gz}\\text{ (formule exacte)}'), ks(fn(g.I, 0) + MM4)), tr('écart', done ? ks(fn(ec, 2) + '\\,\\%') : '—')])
    describe(g)
  }

  function describe(g) {
    const e = eff(), rect = id === 'rect'
    info.innerHTML = `<h3>${SECS.find((x) => x.id === id).label}</h3>`
    eqs(info, [...devI(id, g, rect && couche), `v = ${fn(g.v)}${MM}`, `W = \\dfrac{I_{Gz}}{v} = \\dfrac{${fn(g.I, 0)}}{${fn(g.v)}} = ${fn(g.W, 0)}${MM3}`, `S = ${fn(g.S, 0)}${MM2}`])
    h('p', { class: 'lbl2' }, info, withTex('$v$ : distance de $G$ à la fibre la plus éloignée ; $W$ : module de flexion.'))
    if (rect) {
      const dbl = (e.b * (2 * e.h) ** 3) / 12 / ((e.b * e.h ** 3) / 12), deb = (p.b * p.h ** 3) / 12, cou = (p.h * p.b ** 3) / 12
      h('p', {}, info, withTex(`<b>Pourquoi $h^{3}$ ?</b> La hauteur $h$ intervient deux fois : plus de matière en haut et en bas ($\\times 2$) et des fibres deux fois plus loin, donc $y^{2}$ ×4 par fibre : doubler $h$ multiplie $I_{Gz}$ par <b>${dbl}</b>.`))
      eqs(info, [`\\dfrac{I_{\\text{debout}}}{I_{\\text{couché}}} = \\left(\\dfrac{h}{b}\\right)^{2} = \\dfrac{${fn(deb, 0)}}{${fn(cou, 0)}} = ${fn(deb / cou, 2)}`])
      h('p', {}, info, `La même poutre est ${fn(deb / cou, 1).replace('{,}', ',')} fois plus rigide debout.`)
    }
    if (g.parts) { h('h3', {}, info, 'Théorème de Huygens'); huygens(info, id, g) }
  }
  build()
  return () => lp.stop()
}
