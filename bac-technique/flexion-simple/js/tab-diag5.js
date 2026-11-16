// Onglet 3 : commandes de l'animation (▶ ⏸ ↻, progression, exagération, repère mobile) et texte pédagogique.
import { h, slider, loop, reduced, fmt } from './svg.js'
import { renderTex } from './math.js'
import { efforts } from './calc.js'
import { sample, maxDeflection } from './deform.js'
import { sg } from './fx.js'

const DUR = 2.6, ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const num = (v, n = 1) => fmt(Math.abs(v) < 5e-5 ? 0 : v, n)

/** controls(parent, panel, loads, st) → { stop, refresh } ; st = { E (MPa), I (mm⁴) } partagé avec le texte. */
export function controls(parent, panel, loads, st) {
  const card = h('div', { class: 'card' }, parent)
  h('h2', {}, card, 'Comment la poutre se déforme')
  h('p', {}, card, 'La poutre part droite puis se déforme <b>selon les résultats</b> (forme exacte, <b>très exagérée</b>). Les appuis restent fixes ; les forces suivent la poutre.')
  const btns = h('div', { class: 'btns' }, card)
  const mk = (t, l) => { const b = h('button', { type: 'button', 'aria-label': l }, btns, t); return b }
  const bGo = mk('▶ Lancer', 'Lancer la déformation'), bPause = mk('⏸ Pause', 'Mettre en pause'), bRe = mk('↻ Rejouer', 'Rejouer depuis la poutre droite')
  let prog = 1, mult = 1, base = 0
  const apply = () => { panel.set(ease(prog) * mult); readout() }
  const row = h('div', { class: 'two' }, card)
  const sP = slider(row, { label: 'Progression', min: 0, max: 100, step: 1, value: 100, unit: '%', digits: 0, onInput: (v) => { prog = v / 100; apply() } })
  const sM = slider(row, { label: 'Exagération', min: 1, max: 3, step: 0.1, value: 1, unit: '× l\'échelle auto', digits: 1, onInput: (v) => { mult = v; apply() } })
  const chk = h('label', { class: 'chk' }, card, '<input type="checkbox"><span>repère mobile : lire T, M<sub>f</sub> et la pente en un point</span>')
  const sX = slider(card, { label: 'Position x', min: 0, max: loads.L, step: loads.L / 200, value: loads.L / 2, unit: 'mm', digits: 0, onInput: () => { readout() } })
  sX.input.disabled = true
  const out = h('p', { class: 'readout', hidden: '' }, card)
  function readout() {
    const on = chk.querySelector('input').checked
    panel.cursor(on ? sX.get() : null)
    out.hidden = !on
    if (!on) return
    const x = sX.get(), p = sample(panel.pts, x), e = efforts(loads, x, x < loads.L), EI = st.E * st.I
    const th = Math.abs(p.theta) < 1e-9 * Math.max(1, Math.abs(panel.pts.at(-1).theta)) ? 0 : p.theta
    const slope = th === 0 ? 'horizontale (pente nulle)' : th > 0 ? 'qui monte ↗' : 'qui descend ↘'
    out.innerHTML = `x = <b>${fmt(x, 0)} mm</b> · T = <b>${sg(e.T, 1)} N</b> · M<sub>f</sub> = <b>${sg(e.Mf, 0)} N·mm</b> · tangente ${slope} · flèche réelle y = <b>${num(p.y / EI, 4)} mm</b>`
  }
  chk.querySelector('input').addEventListener('change', (e) => { sX.input.disabled = !e.target.checked; readout() })
  const lp = loop((sec) => {
    const t = Math.min(1, base + sec / DUR)
    sP.set(Math.round(t * 100))
    prog = t; apply()
    if (t >= 1) { queueMicrotask(lp.stop); sP.set(100) } // stop() direct serait écrasé par la boucle
  })
  const go = (from0) => {
    if (reduced) { sP.set(100); return }
    if (from0 || prog >= 1) { prog = 0; sP.set(0) }
    base = prog; lp.stop(); lp.start()
  }
  bGo.addEventListener('click', () => go(false))
  bPause.addEventListener('click', () => lp.stop())
  bRe.addEventListener('click', () => go(true))
  apply()
  return { stop: () => lp.stop(), refresh: apply }
}

/** lesson(parent, loads, panel, st, ctl) : équation, règles de lecture, flèche réelle (E, I modifiables). */
export function lesson(parent, loads, panel, st, ctl) {
  const card = h('div', { class: 'card' }, parent, '<h3>Lire la déformée</h3>')
  renderTex(card, String.raw`E\,I\;y''(x)=M_f(x)`)
  const infl = panel.zonesInfl
  h('ul', {}, card, `<li>Là où M<sub>f</sub> &gt; 0 : la poutre <b class="pos-t">sourit</b> (fibres du bas tendues).</li>
    <li>Là où M<sub>f</sub> &lt; 0 : la poutre <b class="bad">pleure</b> (fibres du haut tendues).</li>
    <li>Quand M<sub>f</sub> change de signe : <b>point d'inflexion</b>${infl.length ? ' (ici en x ≈ ' + infl.map((x) => fmt(x, 0)).join(' ; ') + ' mm)' : ' (aucun ici : M<sub>f</sub> garde le même signe)'}.</li>
    <li>La flèche est <b>maximale là où la pente est nulle</b>${panel.zeroSlope.length ? ' (ici en x ≈ ' + panel.zeroSlope.map((x) => fmt(x, 0)).join(' ; ') + ' mm)' : ''}.</li>
    <li>${loads.couples?.length ? 'À l\'encastrement : flèche <b>et</b> pente nulles.' : 'Aux appuis : la flèche est nulle (la poutre ne descend pas).'}</li>`)
  const f = h('div', { class: 'two' }, card, `<label class="f">E (MPa)<input type="number" min="1" step="1000" value="${st.E}"></label>
    <label class="f">I (mm⁴)<input type="number" min="1" step="1000" value="${st.I}"></label>`)
  const res = h('p', { class: 'note' }, card)
  const upd = () => {
    const m = maxDeflection(panel.pts), y = Math.abs(m.y) / (st.E * st.I)
    res.innerHTML = `Flèche maximale réelle : |y|<sub>max</sub> = <b>${num(y, y < 0.1 ? 4 : 2)} mm</b> en x = ${fmt(m.x, 0)} mm. <small>(E = ${fmt(st.E, 0)} MPa, I = ${fmt(st.I, 0)} mm⁴ ; par défaut, acier et section rectangle 20×60.)</small>`
    panel.EI = st.E * st.I
    ctl.refresh()
  }
  const [iE, iI] = f.querySelectorAll('input')
  for (const [el, k] of [[iE, 'E'], [iI, 'I']]) el.addEventListener('input', () => { const v = parseFloat(el.value); if (v > 0) { st[k] = v; upd() } })
  upd()
}
