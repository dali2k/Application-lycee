// Onglet 1 : phase « intensités » (saisie signée, ±0,02 N) et boîte « Solution détaillée » (dialog natif, KaTeX).
// Importé par tab-reac3.js. API : intensCard(card, S, u) ; u = { btn, go, done }.
import { h } from './svg.js'
import { unknown, solveSupports, solveFixed } from './statics.js'
import { forceHtml, richText, renderTex, fmtNum } from './math.js'
import { parseNum } from './fx.js'
import { buildSolution } from './tab-reac5.js'

const TOL = 0.02
const sense = (s) => (s === 0 ? '<span class="nul">(nulle)</span>' : `<span aria-hidden="true">${s === 1 ? '↑' : '↓'}</span><span class="sr-only">${s === 1 ? 'vers le haut' : 'vers le bas'}</span>`)

/** Réponses attendues : [{ id, html (étiquette), unit, value }]. */
export function targets(S) {
  const ex = S.ex
  if (ex.type === 'encastree') {
    const u = unknown(ex)[0], { A, Me } = solveFixed(ex)
    return [{ id: u.id, html: `${forceHtml(u)} (N)`, hint: 'positif vers le haut', value: A },
      { id: 'M', html: `M<sub><span class="sr-only"> indice </span>${u.id}</sub> (N·mm)`, hint: 'positif : sens positif ↺, négatif : sens négatif ↻', value: Me }]
  }
  const sol = solveSupports(ex)
  return unknown(ex).map((f) => ({ id: f.id, html: `${forceHtml(f)} (N) ${sense(S.found[f.id])}`, hint: 'positif vers le haut, négatif vers le bas', value: sol[f.id] }))
}

export function intensCard(c, S, u) {
  const fix = S.ex.type === 'encastree', T = targets(S)
  h('p', {}, c, fix
    ? "L'encastrement donne une réaction et un moment d'encastrement. Entre chaque valeur signée : <b>R</b> positive vers le haut, <b>M</b> positif dans le sens positif ↺, négatif dans le sens négatif ↻."
    : 'Entre la valeur (en N) de chaque force : positive si elle est vers le haut, négative si elle est vers le bas (tolérance ±0,02 N, virgule acceptée).')
  const ins = T.map((t) => {
    const lab = h('label', { class: 'f' }, c, `<span>${t.html}<small class="hint"> — ${t.hint}</small></span>`)
    return h('input', { type: 'text', inputmode: 'text', autocomplete: 'off', 'aria-label': t.hint, placeholder: 'valeur signée', value: S.in[t.id] ?? '' }, lab)
  })
  if (S.res) S.res.forEach((r, i) => h('p', { class: r ? 'fb ok' : 'fb bad', role: 'status' }, c, `${T[i].html} : ${r ? '✔ correct' : '✘ vérifie le signe et la valeur'}`))
  const bar = h('div', { class: 'btns' }, c)
  u.btn(bar, 'Vérifier', () => {
    T.forEach((t, i) => { S.in[t.id] = ins[i].value })
    S.res = T.map((t, i) => Math.abs(parseNum(ins[i].value) - t.value) <= TOL + 1e-9)
    S.done = S.res.every(Boolean)
    u.say(S.done ? 'ok' : 'bad', S.done ? 'Correct !' : "Pas tout à fait. Reprends ΣM autour d'un appui, puis ΣF.")
  })
  u.btn(bar, 'Voir la solution', (e) => { S.reveal = true; solutionDialog(S.ex, e.currentTarget) })
  if (S.done || S.reveal) {
    const sol = T.map((t) => `${t.html} = <b>${fmtNum(t.value).replace(/\\,/g, ' ').replace(/\{,\}/g, ',')}</b>`)
    h('p', { class: 'fb ok' }, c, `Réponse : ${sol.join(' ; ')}`)
    u.btn(bar, 'Passer à la coupure →', u.done)
  }
}

/** Boîte accessible : Échap ferme, focus rendu au bouton d'ouverture. */
export function solutionDialog(ex, opener) {
  const d = h('dialog', { class: 'solution', 'aria-labelledby': 'sol-title' }, document.body)
  const head = h('div', { class: 'sol-head' }, d, '<h2 id="sol-title">Solution détaillée</h2>')
  h('button', { type: 'button' }, head, 'Fermer').addEventListener('click', () => d.close())
  const body = h('div', { class: 'sol-body' }, d)
  buildSolution(ex).forEach((st, i) => {
    const sec = h('section', { class: 'sol-step' }, body, `<h3>Étape ${i + 1}. ${richText(st.title)}</h3>`)
    st.lines.forEach((l) => renderTex(sec, l))
  })
  d.addEventListener('click', (e) => { if (e.target === d) d.close() })
  d.addEventListener('close', () => { d.remove(); opener?.focus() })
  d.showModal()
}
