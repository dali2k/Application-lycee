// Onglet 5 : contraintes normales en flexion, condition de résistance, dimensionnement, flèche (KaTeX normalisé).
// Citation : « respecte les normalisation des expression mathematique … l'affichage n'est pas adapter a tous les ecrant c'est pas dynamique ».
import { svg, h, slider } from './svg.js'
import { sigmaMax, sigmaAt, tauMoy, rpe, diagrammes } from './calc.js'
import { fullLoads, EXAMPLES } from './statics.js'
import { getEx } from './state.js'
import { exBanner } from './exbanner.js'
import { nm, renderTex } from './math.js'
import { SECS, defaults, geom } from './tab-io2.js'
import { drawIso } from './tab-sigma2.js'
import { flexAnimCard, playCtl } from './tab-flexanim.js'
import { numIn, dimPanel } from './tab-sigma3.js'
import { flechePanel } from './tab-sigma4.js'
import { fn, ks, eqs, devI, withTex, MM, MM3, MPA, NN } from './tex.js'

const MATS = [['E24 (S235)', 235], ['S275', 275], ['E295', 295], ['E335', 335], ['S355', 355], ['C35 (normalisé)', 320], ['Personnalisé', null]]

/** Mf max, Tmax et noms de forces normalisés (R_A, F_C…) de l'exercice courant. */
function fromEx(ex) {
  try {
    const l = fullLoads(ex), d = diagrammes(l)
    return { mf: d.mfMax, T: d.tMax, xMf: d.xMf, forces: l.forces }
  } catch { return { mf: 0, T: 0, xMf: 0, forces: [] } }
}

export function mount(root) {
  exBanner(root)
  let id = 'rect', p = defaults(id)
  let { mf, T, xMf, forces } = fromEx(getEx() || EXAMPLES.appuis)
  const st = { Re: 235, s: 2, k: 1 }

  const intro = h('div', { class: 'card' }, root, withTex(`<h2>Contraintes normales et calculs</h2>
    <p>La flexion crée dans la section une contrainte normale <b>$\\sigma$</b> qui varie <b>linéairement</b> avec la distance $y$ à la fibre neutre :</p>`))
  eqs(intro, ['\\sigma(y) = \\dfrac{M_{f}\\,y}{I_{Gz}}', '\\sigma_{\\max} = \\dfrac{|M_{f}|\\,v}{I_{Gz}} = \\dfrac{|M_{f}|}{I_{Gz}/v}'])
  h('p', {}, intro, withTex('Pour $M_{f} > 0$ : fibres du bas <span class="chip t">tendues</span>, fibres du haut <span class="chip c">comprimées</span>. Sur la fibre neutre (passant par $G$), $\\sigma = 0$.'))
  let upAnim = () => {}
  const grid = h('div', { class: 'grid2' }, root), L = h('div', {}, grid), R = h('div', {}, grid)
  const c1 = h('div', { class: 'card' }, L)
  const sel = h('div', { class: 'btns secsel' }, c1), ctl = h('div', {}, c1)
  const s = svg('svg', { viewBox: '0 0 610 320', role: 'img', 'aria-label': 'Poutre fléchie en 3D' }, c1)
  const bend = playCtl(c1, (k) => { st.k = k; refresh(true) }, { dur: 3, label: 'Plier', start: 1 })
  const note = h('p', { class: 'lbl2' }, c1)
  const dat = h('div', { class: 'card' }, R, '<h3>Données</h3>')
  const src = h('div', {}, dat)
  numIn(dat, 'M<sub>f</sub> max (N·mm)', Math.round(mf), (v) => { mf = v; refresh() }, { min: -1e12 })
  numIn(dat, 'T<sub>max</sub> (N)', Math.round(T), (v) => { T = v; refresh() }, { min: -1e12 })
  const mat = h('select', { 'aria-label': 'Matériau' }, h('label', { class: 'mini' }, dat, '<span>Matériau</span>'))
  mat.innerHTML = MATS.map(([n, r], i) => `<option value="${i}">${n}${r ? ' — Re = ' + r : ''}</option>`).join('')
  let reSl
  mat.onchange = () => { const r = MATS[+mat.value][1]; if (r) reSl.set(r) }
  reSl = slider(dat, { label: 'R<sub>e</sub>', min: 100, max: 700, step: 5, value: st.Re, unit: 'MPa', digits: 0, onInput: (v) => { st.Re = v; refresh() } })
  slider(dat, { label: 's (coefficient de sécurité)', min: 1, max: 6, step: 0.1, value: st.s, digits: 1, onInput: (v) => { st.s = v; refresh() } })
  const res = h('div', { class: 'card' }, R)
  upAnim = flexAnimCard(root, () => ({ g: geom(id, p), mf }))
  const below = h('div', {}, root)
  const upDim = dimPanel(below, () => ({ mf, rp: rpe(st.Re, st.s) }))
  const upFl = flechePanel(below, () => ({ I: geom(id, p).I }))

  function showSource() {
    src.innerHTML = ''
    if (!forces.length) return
    const val = (f) => `${nm(f)} = ${fn(f.value, 0)}${NN}`
    h('p', { class: 'lbl2' }, src, withTex('Efforts issus de l\'exercice (onglets 1 à 3) : $M_{f}$ max en $x = ' + fn(xMf, 0) + MM + '$.'))
    const row = h('div', { class: 'frow' }, src)
    forces.forEach((f) => renderTex(h('span', {}, row), val(f), { display: false }))
  }
  SECS.forEach((sc) => {
    const b = h('button', { type: 'button', 'data-id': sc.id }, sel, sc.label)
    b.onclick = () => { id = sc.id; p = defaults(id); build() }
  })
  function build() {
    sel.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id))
    ctl.innerHTML = ''
    SECS.find((x) => x.id === id).par.forEach(([k, label, min, max]) =>
      slider(ctl, { label, min, max, value: p[k], unit: 'mm', digits: 0, onInput: (x) => { p[k] = x; refresh() } }))
    refresh()
  }

  function refresh(light) {
    const g = geom(id, p), rp = rpe(st.Re, st.s), sm = sigmaMax(mf, g.I, g.v), ok = Math.abs(sm) <= rp
    drawIso(s, { g, mf, ratio: sm / rp, k: st.k })
    if (light === true) return
    note.innerHTML = withTex(mf > 0 ? '$M_{f} > 0$ : la poutre « sourit » ; bas tendu (bleu), haut comprimé (rouge).' : mf < 0 ? '$M_{f} < 0$ : la poutre « boude » ; haut tendu (bleu), bas comprimé (rouge).' : '$M_{f} = 0$ : pas de contrainte normale.')
    const nat = (v) => (v > 0 ? '<span class="chip c">compression</span>' : v < 0 ? '<span class="chip t">traction</span>' : '')
    const top = sigmaAt(mf, g.I, g.top), bot = sigmaAt(mf, g.I, -g.bot), tau = tauMoy(T, g.S)
    res.innerHTML = '<h3>Résultats</h3>'
    eqs(res, [...devI(id, g), `v = ${fn(g.v)}${MM}`, `\\dfrac{I_{Gz}}{v} = \\dfrac{${fn(g.I, 0)}}{${fn(g.v)}} = ${fn(g.I / g.v, 0)}${MM3}`])
    h('p', {}, res, `${nat(top)} fibre haute : ${ks(`\\sigma = ${fn(Math.abs(top))}${MPA}`)}`)
    h('p', {}, res, `${nat(bot)} fibre basse : ${ks(`\\sigma = ${fn(Math.abs(bot))}${MPA}`)}`)
    eqs(res, [`\\sigma_{\\max} = \\dfrac{|M_{f}|\\,v}{I_{Gz}} = \\dfrac{|${fn(mf, 0)}|\\times ${fn(g.v)}}{${fn(g.I, 0)}} = ${fn(sm)}${MPA}`,
      `R_{pe} = \\dfrac{R_{e}}{s} = \\dfrac{${fn(st.Re, 0)}}{${fn(st.s, 1)}} = ${fn(rp)}${MPA}`,
      `\\tau_{moy} = \\dfrac{|T_{\\max}|}{S} = \\dfrac{|${fn(T, 0)}|}{${fn(g.S, 0)}} = ${fn(tau)}${MPA}`])
    const v = h('div', { class: 'verdict ' + (ok ? 'ok' : 'bad') }, res)
    eqs(v, [`|\\sigma_{\\max}| = ${fn(sm)}${MPA}\\;${ok ? '\\le' : '>'}\\;R_{pe} = ${fn(rp)}${MPA}`])
    h('p', {}, v, ok ? '✔ la poutre résiste' : '✘ la poutre ne résiste pas')
    if (sm > 0) h('p', {}, res, withTex(`$\\tau_{moy}$ représente ${fn(100 * tau / sm, 1).replace('{,}', ',')} % de $\\sigma_{\\max}$ : en flexion, <b>$\\tau$ est négligée devant $\\sigma$</b>.`))
    upDim(); upFl(); upAnim()
  }
  showSource()
  build()
}
