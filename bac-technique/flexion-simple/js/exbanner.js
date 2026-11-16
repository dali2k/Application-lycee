// Bandeau « poutre de l'onglet 1 » affiché en tête des onglets 2, 3 et 5 : même poutre, mêmes forces partout.
import { h, fmt } from './svg.js'
import { getEx } from './state.js'
import { forceHtml } from './math.js'

export function exBanner(parent) {
  const ex = getEx()
  const items = ex.forces.map((f) => `<span class="exf">${forceHtml(f)} <small>(point ${f.id}, x = ${fmt(f.x, 0)} mm${
    f.kind === 'known' ? `, ${fmt(Math.abs(f.value), 2)} N ${f.value > 0 ? '↑' : '↓'}` : ''})</small></span>`).join(' · ')
  const c = h('div', { class: 'card exbanner' }, parent,
    `<p><b>Poutre de l'onglet 1</b> — ${ex.type === 'encastree' ? `encastrée ${ex.forces.find((f) => f.kind === 'unknown')?.x > 0 ? 'à droite' : 'à gauche'}` : 'sur 2 appuis'}, L = ${fmt(ex.L, 0)} mm : ${items}</p>`)
  h('button', { type: 'button', class: 'btn' }, c, "✎ Modifier l'exercice (onglet 1)")
    .addEventListener('click', () => document.querySelectorAll('#tabs button')[0]?.click())
  return c
}
