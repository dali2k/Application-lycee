// Panneau « dimensionnement » (cases à cocher) de l'onglet Contraintes : solutions détaillées en KaTeX.
// Importateur : tab-sigma.js. Citation : « respecte les normalisation des expression mathematique … ».
import { h } from './svg.js'
import { dMiniCercle, hMiniRect, igvMini } from './calc.js'
import { fn, eqs, withTex, MM, MM3 } from './tex.js'

const PI = Math.PI
export function numIn(parent, label, value, onChange, attrs = {}) {
  const w = h('label', { class: 'mini' }, parent, `<span>${label}</span>`)
  const i = h('input', { type: 'number', value, step: 'any', min: 0, ...attrs }, w)
  i.addEventListener('input', () => onChange(parseFloat(i.value)))
  return i
}

const bad = (x) => !(x.rp > 0) || !Number.isFinite(x.mf)
const note = (el, t) => h('p', {}, el, withTex(t))
const igvLine = (x) => `\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min} = \\dfrac{|M_{f}|}{R_{pe}} = \\dfrac{${fn(Math.abs(x.mf), 0)}}{${fn(x.rp)}} = ${fn(igvMini(x.mf, x.rp), 0)}${MM3}`

const FILL = {
  cercle(el, x) {
    const q = igvMini(x.mf, x.rp), d = dMiniCercle(x.mf, x.rp)
    eqs(el, [igvLine(x), '\\dfrac{\\pi\\,d^{3}}{32} \\ge \\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}\\;\\Rightarrow\\; d \\ge \\sqrt[3]{\\dfrac{32\\,\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}}{\\pi}}',
      `d \\ge \\sqrt[3]{\\dfrac{32\\times ${fn(q, 0)}}{\\pi}} = ${fn(d)}${MM}`, `d = ${Math.ceil(d)}${MM}`])
    note(el, 'On arrondit au millimètre <b>supérieur</b> pour garder $\\sigma_{\\max} \\le R_{pe}$.')
  },
  rect(el, x, st) {
    if (!(st.b > 0)) return note(el, 'Donne une largeur $b > 0$.')
    const q = igvMini(x.mf, x.rp), hh = hMiniRect(x.mf, st.b, x.rp)
    eqs(el, [igvLine(x), '\\dfrac{b\\,h^{2}}{6} \\ge \\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}\\;\\Rightarrow\\; h \\ge \\sqrt{\\dfrac{6\\,\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}}{b}}',
      `h \\ge \\sqrt{\\dfrac{6\\times ${fn(q, 0)}}{${fn(st.b)}}} = ${fn(hh)}${MM}`, `h = ${Math.ceil(hh)}${MM}`])
  },
  wmin(el, x) {
    const q = igvMini(x.mf, x.rp), b15 = Math.cbrt(1.5 * q)
    eqs(el, [igvLine(x), `\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min} = ${fn(q / 1e3)}\\text{ cm}^{3}`])
    note(el, 'Sections possibles (on cherche ensuite dans un catalogue un profilé dont $\\dfrac{I_{Gz}}{v} \\ge \\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}$) :')
    eqs(el, [`\\text{Carré : } \\dfrac{a^{3}}{6} \\ge \\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}\\;\\Rightarrow\\; a \\ge \\sqrt[3]{6\\,\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}} = ${fn(Math.cbrt(6 * q), 1)}${MM}`,
      `\\text{Cercle : } d \\ge \\sqrt[3]{\\dfrac{32\\,\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}}{\\pi}} = ${fn(Math.cbrt((32 * q) / PI), 1)}${MM}`,
      `\\text{Rectangle } h = 2b : \\dfrac{2\\,b^{3}}{3} \\ge \\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}\\;\\Rightarrow\\; b \\ge \\sqrt[3]{1{,}5\\,\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}} = ${fn(b15, 1)}${MM}\\;(h = ${fn(2 * b15, 1)}${MM})`])
  },
  tube(el, x, st) {
    const q = igvMini(x.mf, x.rp), K = (32 * st.D * q) / PI, r4 = st.D ** 4 - K
    eqs(el, [igvLine(x), '\\dfrac{\\pi\\,(D^{4}-d^{4})}{32\\,D} \\ge \\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}\\;\\Rightarrow\\; D^{4}-d^{4} \\ge \\dfrac{32\\,D\\,\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}}{\\pi}'])
    note(el, `<b>$D$ fixé</b> ($D = ${fn(st.D)}${MM}$) : $d \\le \\sqrt[4]{D^{4}-\\dfrac{32\\,D\\,\\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}}{\\pi}}$`)
    if (r4 > 0) eqs(el, [`d \\le \\sqrt[4]{${fn(st.D)}^{4}-\\dfrac{32\\times ${fn(st.D)}\\times ${fn(q, 0)}}{\\pi}} = ${fn(Math.pow(r4, 0.25))}${MM}`])
    else note(el, '<span class="bad">Impossible : $D$ trop petit.</span>')
    const f = (D) => (PI * (D ** 4 - st.d ** 4)) / (32 * D)
    let hi = st.d + 1
    for (let i = 0; i < 80 && f(hi) < q; i++) hi *= 1.5
    let lo = st.d
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; f(m) < q ? (lo = m) : (hi = m) }
    note(el, `<b>$d$ fixé</b> ($d = ${fn(st.d)}${MM}$) : on cherche $D$ tel que $\\dfrac{\\pi\\,(D^{4}-d^{4})}{32\\,D} = \\left(\\dfrac{I_{Gz}}{v}\\right)_{\\min}$ (résolution numérique).`)
    eqs(el, [`D \\ge ${fn(hi)}${MM}`])
  },
}

/** ctx() → { mf (N·mm), rp (MPa) }. Renvoie update(). */
export function dimPanel(parent, ctx) {
  const c = h('div', { class: 'card' }, parent, '<h3>Dimensionnement</h3>')
  eqs(c, ['\\sigma_{\\max} = \\dfrac{|M_{f}|}{I_{Gz}/v} \\le R_{pe}\\;\\Rightarrow\\; \\dfrac{I_{Gz}}{v} \\ge \\dfrac{|M_{f}|}{R_{pe}}'])
  h('p', {}, c, 'Coche la méthode voulue.')
  const st = { b: 20, D: 60, d: 40 }, ups = []
  const add = (key, label, ins) => {
    const lab = h('label', { class: 'chk' }, c, `<input type="checkbox" data-k="${key}"> <span>${label}</span>`)
    const box = h('div', { class: 'dim' }, c), out = h('div', {}, box)
    box.hidden = true
    ins && ins(box)
    lab.firstChild.addEventListener('change', (e) => { box.hidden = !e.target.checked; update() })
    ups.push(() => {
      if (box.hidden) return
      out.innerHTML = ''
      const x = ctx()
      if (bad(x)) note(out, 'Données invalides : $M_{f}$ ou $R_{pe}$.'); else FILL[key](out, x, st)
    })
  }
  add('cercle', 'Chercher <i>d</i> minimal (cercle)')
  add('rect', 'Chercher <i>h</i> pour <i>b</i> fixé (rectangle)', (box) => numIn(box, 'b (mm)', st.b, (v) => { st.b = v; update() }))
  add('wmin', 'I<sub>Gz</sub>/v mini (proposer une section)')
  add('tube', 'Tube : <i>D</i> fixé → <i>d</i> maximal, ou <i>d</i> fixé → <i>D</i> minimal',
    (box) => { numIn(box, 'D (mm)', st.D, (v) => { st.D = v; update() }); numIn(box, 'd (mm)', st.d, (v) => { st.d = v; update() }) })
  const update = () => ups.forEach((f) => f())
  return update
}
