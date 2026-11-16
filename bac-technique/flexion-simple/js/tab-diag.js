// Onglet 3 : diagrammes complets T et Mf alignés sous la poutre (viewBox calculé, SVG fluide).
import { svg, h } from './svg.js'
import { drawBeam } from './beam.js'
import { fullLoads } from './statics.js'
import { diagrammes } from './calc.js'
import { renderTex } from './math.js'
import { getEx } from './state.js'
import { exBanner } from './exbanner.js'
import { charts } from './tab-diag2.js'
import { recap, extremaTex, handCalc } from './tab-diag3.js'
import { drawDeform } from './tab-diag4.js'
import { controls, lesson } from './tab-diag5.js'

const W = 560, MX = 40, AMP = 48

export function mount(root) {
  root.innerHTML = ''
  exBanner(root)
  const ex = getEx(), loads = fullLoads(ex), dg = diagrammes(loads)
  h('div', { class: 'card' }, root, `<h2>3 · Diagrammes de l'effort tranchant T et du moment fléchissant M<sub>f</sub></h2>
    <p>Les diagrammes sont tracés <b>avec la même échelle de x</b> que la poutre. Aires <span class="pos-t">bleues</span> : valeurs positives ; aires <span class="neg-t">orange</span> : négatives. Chaque force fait <b>sauter</b> T de sa valeur.</p>`)
  const st = { E: 200000, I: 360000 }
  const ctlHost = h('div', {}, root)
  const grid = h('div', { class: 'grid2' }, root)
  const s = svg('svg', { class: 'flexsvg', role: 'img', 'aria-label': 'Poutre, diagramme de T et diagramme de Mf' }, h('div', {}, grid))
  const sx = (x) => MX + (x / loads.L) * (W - 2 * MX)
  const panel = drawDeform(s, loads, ex.type, { sx, W })
  const Y0 = panel.H + 112, T0 = panel.H + 12
  const geo = drawBeam(s, loads, { type: ex.type, y0: Y0, W, mx: MX, dims: true })
  svg('text', { x: MX, y: T0 + 6, class: 'lbl2' }, s).textContent = 'Poutre non déformée, diagrammes T et Mf :'
  const tY = geo.bottom + 40 + AMP, mY = tY + 2 * AMP + 60, H = mY + AMP + 34
  charts(s, loads, dg, { sx, W, tY, mY, amp: AMP, top: Y0 + 8 })
  s.setAttribute('viewBox', `0 0 ${W} ${H}`)
  const side = h('div', {}, grid)
  const ctl = controls(ctlHost, panel, loads, st)
  lesson(side, loads, panel, st, ctl)
  const card = h('div', { class: 'card' }, side, '<h3>Valeurs aux points</h3>')
  card.insertAdjacentHTML('beforeend', recap(loads, dg))
  for (const t of extremaTex(dg)) renderTex(card, t)
  const hand = h('div', { class: 'card' }, side)
  const lab = h('label', { class: 'chk' }, hand, '<input type="checkbox"> afficher le calcul à la main des tronçons')
  const body = h('div', { hidden: '' }, hand)
  handCalc(body, loads, dg)
  lab.querySelector('input').addEventListener('change', (e) => { body.hidden = !e.target.checked })
  return ctl.stop
}
