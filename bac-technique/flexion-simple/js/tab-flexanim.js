// Animation 2D « Comment se fabrique la flexion ? » : tronçon de poutre, fibres, sections planes, σ(y) qui grandit avec t∈[0,1].
// Importateurs : tab-sigma.js (carte), tab-sigma2.js (réutilise playCtl). Citation : « dans la contrainte et calcule je veux une
// animation sur la flexion generer pour que l'eleve comme c'est fait la flexion ».
import { svg, h, loop, reduced } from './svg.js'
import { drawBeam } from './tab-flexanim2.js'
import { flexFormulas } from './tab-flexanim3.js'
import { ks } from './tex.js'

/** Contrôles ▶/⏸/↻ + curseur de progression. onT(t) ; renvoie { set, get, stop }. dur en secondes. */
export function playCtl(parent, onT, { dur = 4, label = 'Lancer', start = 1 } = {}) {
  const w = h('div', { class: 'fa-ctl' }, parent)
  const bp = h('button', { type: 'button', class: 'fa-play' }, w)
  const br = h('button', { type: 'button' }, w, '↻ Rejouer')
  const lab = h('label', { class: 'fa-prog' }, w, '<span>Progression</span>')
  const inp = h('input', { type: 'range', min: 0, max: 1, step: 0.005, value: start, 'aria-label': 'Progression de la flexion' }, lab)
  let t = start, from = 0
  const lp = loop((s) => { set(Math.min(1, from + s / dur)); if (t >= 1) stop() })
  function show() { bp.textContent = lp.on ? '⏸ Pause' : '▶ ' + (t >= 1 ? 'Relancer' : t > 0 ? 'Reprendre' : label); bp.setAttribute('aria-pressed', lp.on) }
  function set(v) { t = v; inp.value = v; onT(v) }
  function stop() { lp.stop(); show() }
  function play() { if (reduced) { set(1); show(); return } if (t >= 1) set(0); from = t; lp.start(); show() }
  bp.onclick = () => (lp.on ? stop() : play())
  br.onclick = () => { lp.stop(); set(0); play() }
  inp.oninput = () => { lp.stop(); set(+inp.value); show() }
  show()
  return { set, get: () => t, stop }
}

const STEPS = ['On applique le moment fléchissant $M_{f}$ aux extrémités.', 'Les sections droites restent <b>planes</b> et tournent : leurs prolongements se coupent au centre de courbure.',
  'Les fibres du côté comprimé se <b>raccourcissent</b>, celles du côté tendu s\'<b>allongent</b> ; la fibre neutre garde sa longueur.', 'L\'allongement croît avec $y$ : la contrainte $\\sigma$ est <b>proportionnelle à $y$</b> (loi de Hooke).']
const AT = [0.02, 0.18, 0.4, 0.65]
const tex = (x) => x.replace(/\$([^$]+)\$/g, (_, q) => ks(q))

/** Carte complète. get() → { g (geom), mf }. Renvoie update(). */
export function flexAnimCard(parent, get) {
  const c = h('div', { class: 'card fa-card' }, parent, '<h3>Comment se fabrique la flexion ?</h3>')
  const mode = h('div', { class: 'btns fa-mode' }, c)
  let sg = 1, t = reduced ? 1 : 0, last = '', first = true
  const bt = [['M<sub>f</sub> &gt; 0 : la poutre « sourit »', 1], ['M<sub>f</sub> &lt; 0 : la poutre « boude »', -1]].map(([txt, s]) => {
    const b = h('button', { type: 'button', 'aria-pressed': s === 1 }, mode, txt)
    b.onclick = () => { sg = s; bt.forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b) }); update() }
    return b
  })
  bt[0].classList.add('on')
  const s = svg('svg', { viewBox: '0 0 640 380', role: 'img', class: 'fa-svg', 'aria-label': 'Animation : tronçon de poutre qui se courbe, sections planes, fibres raccourcies d\'un côté et allongées de l\'autre, diagramme de contrainte triangulaire' }, c)
  h('p', { class: 'lbl2' }, c, 'Déformation volontairement exagérée pour qu\'on la voie.')
  const ol = h('ol', { class: 'fa-steps' }, c, STEPS.map((x, i) => `<li>${tex(x)}</li>`).join(''))
  playCtl(c, (v) => { t = v; draw() }, { start: t })
  const fm = h('div', { class: 'fa-eq' }, c)
  function draw() {
    drawBeam(s, { g: get().g, t, sg })
    ol.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', t >= AT[i]))
  }
  function update() {
    const o = get()
    if (first) { first = false; if (o.mf < 0) { sg = -1; bt[0].classList.remove('on'); bt[1].classList.add('on'); bt[0].setAttribute('aria-pressed', false); bt[1].setAttribute('aria-pressed', true) } }
    const key = JSON.stringify([o.g.I, o.g.v, o.mf, sg])
    draw()
    if (key !== last) { last = key; flexFormulas(fm, o, sg) }
  }
  return update
}
