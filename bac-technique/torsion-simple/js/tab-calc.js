// Onglet 4 : calculateur de torsion (résistance, rigidité) avec solution rédigée.
import { h, fmt, svg } from './svg.js'
import { drawBeam } from './iso.js'
import * as c from './calc.js'
import { SECTIONS, compute, norm } from './sections.js'

const DEF = { sec: 'plein', fix: 'D', d: 40, D: 60, b: 30, h: 60, t: 4, mode: 'mt', Mt: 150, P: 20, N: 1500, L: 600, G: 8000, Reg: 240, s: 3, thl: 0.1 }
const ACT2 = { ...DEF, sec: 'plein', d: 56, mode: 'p', P: 20, N: 1500, L: 2000, G: 8000, Reg: 240, s: 3, thl: 0.1 }

export function mount(root) {
  root.innerHTML = ''
  const grid = h('div', { class: 'grid2' }, root)
  const form = h('div', { class: 'card' }, grid, '<h2>Données</h2>')
  const out = h('div', {}, grid)
  const view = h('div', { class: 'card' }, out, '<h3>La poutre étudiée (vue isométrique)</h3>')
  const iso = svg('svg', { viewBox: '0 0 560 340', role: 'img', 'aria-label': 'Poutre en vue isométrique' }, view)
  const isoNote = h('p', { class: 'lbl2' }, view)
  const res = h('div', {}, out)
  const v = { ...DEF }
  const inputs = {}

  const field = (parent, label, key, unit) => {
    const l = h('label', { class: 'f' }, parent, `<span>${label}${unit ? ' (' + unit + ')' : ''}</span>`)
    const i = h('input', { type: 'number', step: 'any', value: v[key] }, l)
    i.addEventListener('input', () => { v[key] = parseFloat(i.value); update() })
    inputs[key] = i
  }

  const btns = h('div', { class: 'btns' }, form)
  h('button', { type: 'button' }, btns, 'Activité 2 (arbre 20 kW)').addEventListener('click', () => load(ACT2))
  h('button', { type: 'button' }, btns, 'Réinitialiser').addEventListener('click', () => load(DEF))

  const secL = h('label', { class: 'f' }, form, '<span>Section</span>')
  const sel = h('select', {}, secL)
  Object.entries(SECTIONS).forEach(([k, s]) => h('option', { value: k }, sel, s.label))
  const dimBox = h('div', {}, form)
  // tube : choix de la valeur fixée pour le calcul inverse (d max ou D min)
  const fixRadios = []
  const fixBox = h('div', { style: 'background:var(--accent-soft);border-left:4px solid var(--accent);padding:6px 10px;border-radius:6px;margin:8px 0' }, form, '<b>Calcul inverse du tube : quelle valeur fixer ?</b>')
  ;[['D', 'D fixé → chercher d maximal'], ['d', 'd fixé → chercher D minimal']].forEach(([val, label]) => {
    const l = h('label', { style: 'display:block;margin:4px 0;cursor:pointer' }, fixBox, `<input type="radio" name="fix" value="${val}"> ${label}`)
    const i = l.querySelector('input')
    i.checked = v.fix === val
    i.addEventListener('change', () => { v.fix = val; update() })
    fixRadios.push(i)
  })
  sel.addEventListener('change', () => { v.sec = sel.value; buildDims(); update() })

  const modeL = h('label', { class: 'f' }, form, '<span>Couple donné par</span>')
  const mode = h('select', {}, modeL)
  h('option', { value: 'mt' }, mode, 'Mt (N·m)')
  h('option', { value: 'p' }, mode, 'P et N (moteur)')
  mode.addEventListener('change', () => { v.mode = mode.value; showMode(); update() })
  const mtBox = h('div', {}, form), pBox = h('div', {}, form)
  field(mtBox, 'Couple Mt', 'Mt', 'N·m')
  field(pBox, 'Puissance P', 'P', 'kW'); field(pBox, 'Vitesse N', 'N', 'tr/min')
  field(form, 'Longueur L', 'L', 'mm'); field(form, 'Module G', 'G', 'daN/mm²')
  field(form, 'Limite élastique Reg', 'Reg', 'MPa'); field(form, 'Coef. de sécurité s', 's', '')
  field(form, 'Limite θlim', 'thl', '°/m')

  function buildDims() {
    dimBox.innerHTML = ''
    SECTIONS[v.sec].dims.forEach(([k, label]) => field(dimBox, label, k, 'mm'))
    fixBox.style.display = v.sec === 'tube' ? '' : 'none'
  }
  function showMode() { mtBox.style.display = v.mode === 'mt' ? '' : 'none'; pBox.style.display = v.mode === 'p' ? '' : 'none' }
  function load(src) {
    Object.assign(v, src)
    sel.value = v.sec; mode.value = v.mode
    fixRadios.forEach((i) => { i.checked = i.value === v.fix })
    buildDims(); showMode()
    Object.keys(inputs).forEach((k) => { if (v[k] != null) inputs[k].value = v[k] })
    update()
  }

  function update() {
    const Mt = v.mode === 'p' ? c.coupleDepuisPuissance(v.P * 1000, v.N) : v.Mt * 1000
    const G = c.daNmm2ToMPa(v.G), r = compute(v.sec, v, Mt, G), q = norm(v.sec, v)
    const rp = c.rpg(v.Reg, v.s), thLim = c.thetaLimDegParM(v.thl)
    // Un couple négatif donne τ et θ négatifs : on compare les valeurs absolues (sinon faux « vérifiée »).
    const tauA = Math.abs(r.tauMax), thA = Math.abs(r.theta)
    const thDegM = c.radToDeg(thA) * 1000, al = c.radToDeg(r.theta * v.L)
    const okR = tauA <= rp, okT = thA <= thLim
    const tag = (ok) => `<span class="${ok ? 'ok' : 'bad'}">${ok ? '✔ vérifiée' : '✘ non vérifiée'}</span>`
    let dmin = ''
    if (v.sec === 'plein') {
      const a = c.dMiniResistance(Math.abs(Mt), rp), b = c.dMiniRigidite(Math.abs(Mt), G, thLim)
      dmin = `<tr><td>d mini (résistance)</td><td>${fmt(a, 2)} mm</td></tr>
        <tr><td>d mini (rigidité)</td><td>${fmt(b, 2)} mm</td></tr>
        <tr><td><b>d à retenir (le plus grand)</b></td><td><b>${fmt(Math.max(a, b), 2)} mm</b></td></tr>`
    }
    // tube : d max (D fixé) ou D min (d fixé)
    let inv = '', apply = null
    const stepsInv = []
    if (v.sec === 'tube') {
      const m = Math.abs(Mt), { c: cc, K: KK } = c.tubeConsts(m, rp, G, thLim)
      const val = (x) => (x === null ? '<span class="bad">impossible</span>' : `${fmt(x, 2)} mm`)
      const row = (lab, x, bold) => `<tr><td>${bold ? `<b>${lab}</b>` : lab}</td><td>${bold ? `<b>${val(x)}</b>` : val(x)}</td></tr>`
      if (v.fix === 'D') {
        const t = c.dMaxTube(q.D, m, rp, G, thLim)
        inv = row('d max (résistance)', t.res) + row('d max (rigidité)', t.rig) +
          (t.retenu === null ? '<tr><td colspan="2" class="bad">Aucun d ne convient : augmenter D.</td></tr>' : row('d à retenir (le plus petit)', t.retenu, true))
        if (t.retenu !== null) apply = { key: 'd', val: Math.floor(t.retenu * 10) / 10 }
        stepsInv.push(`Calcul de d max (D = ${fmt(q.D, 1)} mm fixé) : résistance D⁴ − d⁴ ≥ 16·Mt·D / (π·Rpg) = ${fmt(cc * q.D, 0)} mm⁴ → d ≤ <b>${val(t.res)}</b>`,
          `Rigidité : D⁴ − d⁴ ≥ 32·Mt / (π·G·θlim) = ${fmt(KK, 0)} mm⁴ → d ≤ <b>${val(t.rig)}</b> ; on retient le plus petit : <b>${t.retenu === null ? 'aucun d ne convient' : `d max = ${fmt(t.retenu, 2)} mm`}</b>`)
      } else {
        const t = c.DMinTube(q.d, m, rp, G, thLim)
        inv = row('D min (résistance)', t.res) + row('D min (rigidité)', t.rig) + row('D à retenir (le plus grand)', t.retenu, true)
        if (Number.isFinite(t.retenu)) apply = { key: 'D', val: Math.ceil(t.retenu * 10) / 10 }
        stepsInv.push(`Calcul de D min (d = ${fmt(q.d, 1)} mm fixé) : rigidité D⁴ ≥ d⁴ + 32·Mt / (π·G·θlim) = ${fmt(q.d ** 4 + KK, 0)} mm⁴ → D ≥ <b>${val(t.rig)}</b>`,
          `Résistance : D⁴ − d⁴ ≥ 16·Mt·D / (π·Rpg), équation en D résolue par approches successives → D ≥ <b>${val(t.res)}</b> ; on retient le plus grand : <b>D min = ${fmt(t.retenu, 2)} mm</b>`)
      }
    }
    const circ = SECTIONS[v.sec].circ
    const steps = []
    if (v.mode === 'p') steps.push(`Couple : Mt = P / ω = ${fmt(v.P * 1000, 0)} / (2π·${fmt(v.N, 0)}/60) = <b>${fmt(Mt / 1000, 2)} N·m</b>`)
    steps.push(`Résistance pratique : Rpg = Reg / s = ${fmt(v.Reg, 0)} / ${fmt(v.s, 2)} = <b>${fmt(rp, 1)} MPa</b>`)
    if (circ) steps.push(`Io = ${v.sec === 'plein' ? `π·d⁴/32 = π·${fmt(q.d, 1)}⁴/32` : `π(D⁴ − d⁴)/32`} = <b>${fmt(r.io, 0)} mm⁴</b> ; Io/ρmax = <b>${fmt(r.w, 0)} mm³</b>`)
    else steps.push(`Section ${SECTIONS[v.sec].label.toLowerCase()} : formules de tables (coefficients de Saint-Venant / Bredt).`)
    steps.push(`Contrainte : |τmax| = |${circ ? 'Mt / (Io/ρmax)' : 'formule de la section'}| = <b>${fmt(tauA, 2)} MPa</b> ${tauA <= rp ? '≤' : '>'} Rpg → ${tag(okR)}`)
    steps.push(`Rigidité : |θ| = |${circ ? 'Mt / (G·Io)' : 'formule de la section'}| = ${fmt(thA, 9)} rad/mm = <b>${fmt(thDegM, 4)} °/m</b> ${okT ? '≤' : '>'} ${fmt(v.thl, 3)} °/m → ${tag(okT)}`)
    steps.push(...stepsInv)
    steps.push(`Angle de torsion : α = θ·L = <b>${fmt(al, 3)} °</b> sur ${fmt(v.L, 0)} mm`)
    const alRad = r.theta * v.L, vis = Math.sign(alRad) * 2.6 * (1 - Math.exp(-(Math.abs(alRad) * 300) / 2.6))
    const dimTxt = { plein: `d = ${fmt(q.d, 0)} mm`, tube: `D = ${fmt(q.D, 0)} mm, d = ${fmt(q.d, 0)} mm`, rect: `b × h = ${fmt(q.b, 0)} × ${fmt(q.h, 0)} mm`, rectcreux: `b × h = ${fmt(q.b, 0)} × ${fmt(q.h, 0)} mm, épaisseur t = ${fmt(q.t, 0)} mm` }[v.sec]
    if (Number.isFinite(alRad) && v.L > 0 && SECTIONS[v.sec].dims.every(([k]) => Number.isFinite(q[k]) && q[k] > 0)) {
      const { compressed } = drawBeam(iso, { sec: v.sec, q, L: v.L, vis, lines: [`${SECTIONS[v.sec].label} · ${dimTxt} · L = ${fmt(v.L, 0)} mm`, `Mt = ${fmt(Mt / 1000, 1)} N·m → α = ${fmt(al, 3)} °`] })
      isoNote.textContent = `Sens de Mt : ${vis < 0 ? 'horaire (Mt négatif)' : 'anti-horaire'} vu du bout libre. Rayon gris pointillé : position avant torsion ; rayon rouge : après torsion. Angle dessiné ×${fmt(Math.abs(vis) / Math.max(Math.abs(alRad), 1e-12), 0)} pour être visible${compressed ? ' ; longueur raccourcie (non à l’échelle)' : ''}.`
    }
    res.innerHTML = `<div class="card"><h2>Résultats</h2><table class="res">
      <tr><td>Couple Mt</td><td>${fmt(Mt / 1000, 2)} N·m</td></tr>
      <tr><td>|τmax|</td><td>${fmt(tauA, 2)} MPa</td></tr><tr><td>Rpg = Reg / s</td><td>${fmt(rp, 1)} MPa</td></tr>
      <tr><td>Condition de résistance</td><td>${tag(okR)}</td></tr>
      <tr><td>|θ|</td><td>${fmt(thDegM, 4)} °/m</td></tr><tr><td>Condition de rigidité</td><td>${tag(okT)}</td></tr>
      <tr><td>Angle α</td><td>${fmt(al, 3)} °</td></tr>${dmin}${inv}</table>
      ${apply ? `<p><button type="button" class="btn" id="applyInv">Appliquer ${apply.key} = ${fmt(apply.val, 1)} mm au tube</button></p>` : ''}</div>
      <div class="card"><h3>Solution rédigée</h3><ol class="steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>`
    const ab = res.querySelector('#applyInv')
    if (ab) ab.addEventListener('click', () => { v[apply.key] = apply.val; inputs[apply.key].value = apply.val; update() })
  }
  load(DEF)
}
