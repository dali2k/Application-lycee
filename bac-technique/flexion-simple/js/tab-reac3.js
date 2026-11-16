// Onglet 1 : panneau des étapes guidées (équivalent de StepPanel.tsx + MomentTable.tsx de la 3ème).
// API : panel(box, S, A) ; S = état de session, A = actions (tab-reac.js). Importé par tab-reac.js.
import { h, fmt } from './svg.js'
import { unknown } from './statics.js'
import { forceHtml, richText } from './math.js'
import { forceText as ft } from './exercise.js'
import { intensCard } from './tab-reac4.js'

/** Texte parlé d'une force : « F indice B ». */
export const spoken = (t) => t.replace(/\b([FR])_([A-Za-z][A-Za-z0-9]{0,2})\b/g, '$1 indice $2')
const arrow = (v) => `<span aria-hidden="true">${v > 0 ? '↑' : '↓'}</span><span class="sr-only">${v > 0 ? 'vers le haut' : 'vers le bas'}</span>`
const opt = (f) => (f.kind === 'known' ? `${spoken(ft(f))} = ${fmt(Math.abs(f.value), 2)} N ${f.value > 0 ? '↑' : '↓'}` : `${spoken(ft(f))} (inconnue)`)

function block(parent, title, group, pivot, ccw) {
  const rows = group.items.map(({ force: f, moment }) => `<tr><th scope="row">${forceHtml(f)}</th><td>${arrow(f.value)} ${fmt(Math.abs(f.value))} N</td>
    <td>${pivot.id}${f.id} = ${fmt(Math.abs(f.x - pivot.x))} mm</td><td>${ccw ? '+' : '−'}${fmt(Math.abs(moment))}<span class="sr-only">${ccw ? ', sens positif' : ', sens négatif'}</span></td></tr>`).join('')
  const w = h('div', { class: 'tw' }, parent)
  h('table', { class: 'moments ' + (ccw ? 'ccw' : 'cw') }, w, `<caption>${ccw ? '↺ ' : '↻ '}${title}</caption>
    <thead><tr><th scope="col">Force</th><th scope="col">Intensité</th><th scope="col">Distance</th><th scope="col">M (N·mm)</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">Aucune force</td></tr>'}</tbody>
    <tfoot><tr><th scope="row" colspan="3">Σ ${ccw ? 'sens positif' : 'sens négatif'}</th><td>${fmt(group.sum)}<span class="sr-only"> N·mm</span></td></tr></tfoot>`)
}

export function momentTable(parent, S) {
  const g = S.sense.groups, P = S.sense.pivot
  const box = h('div', { class: 'moment-blocks' }, parent)
  block(box, 'Sens positif (+)', g.ccw, P, true)
  block(box, 'Sens négatif (−)', g.cw, P, false)
  if (g.zero.length) {
    const w = h('div', { class: 'tw' }, box)
    h('table', { class: 'moments zero' }, w, `<caption>Moment nul</caption><tbody>${g.zero.map((f) => `<tr><th scope="row">${forceHtml(f)}</th><td>Force située au centre de rotation</td></tr>`).join('')}</tbody>`)
  }
}

export function panel(box, S, A) {
  box.innerHTML = ''
  const ex = S.ex
  const c = h('section', { class: 'card', 'aria-label': 'Étapes guidées', 'aria-busy': String(S.phase === 'busy') }, box)
  const btn = (p, label, fn) => { const b = h('button', { type: 'button', class: 'btn' }, p, label); b.addEventListener('click', fn); return b }
  const q = (html, id) => h('p', { class: 'q', id: id || '', tabindex: '-1', 'data-focus': '' }, c, html)
  const fb = () => S.msg && h('p', { class: 'fb ' + (S.kind || 'info'), role: 'status' }, c, richText(S.msg))
  const left = unknown(ex).filter((f) => !(f.id in S.found))

  if (S.phase === 'choose') {
    h('h3', {}, c, `Étape ${Object.keys(S.found).length + 1} · Centre de rotation et force cherchée`)
    q('Choisis le centre de rotation (un point de la poutre) et la force dont tu cherches le sens.')
    // Boutons radio (pas de <select>) : un <option> ne peut pas afficher l'indice de R_O / F_B.
    let tv = left[0].id, pv = null
    const radios = (fs, name, items, cur, on) => {
      fs.querySelectorAll('label').forEach((l) => l.remove())
      for (const [v, html] of items) {
        const l = h('label', { class: 'rchip' }, fs, `<input type="radio" name="${name}" value="${v}"${v === cur ? ' checked' : ''}><span>${html}</span>`)
        l.firstChild.addEventListener('change', () => on(v))
      }
    }
    const fsT = h('fieldset', { class: 'chips' }, c, '<legend>Force cherchée</legend>')
    const fsP = h('fieldset', { class: 'chips' }, c, '<legend>Centre de rotation</legend>')
    const fillP = () => {
      const pts = ex.forces.filter((f) => f.id !== tv)
      if (!pts.some((f) => f.id === pv)) pv = pts[0].id
      radios(fsP, 'piv', pts.map((f) => [f.id, `Point <b>${f.id}</b> <small>(${forceHtml(f)})</small>`]), pv, (v) => { pv = v })
    }
    radios(fsT, 'tgt', left.map((f) => [f.id, `${forceHtml(f)} <small>(inconnue)</small>`]), tv, (v) => { tv = v; fillP() })
    fillP()
    btn(c, 'Valider le choix', () => A.choose(pv, tv))
    return fb()
  }
  if (S.phase === 'intens') {
    h('h3', {}, c, ex.type === 'encastree' ? "Équilibre de l'encastrement" : 'Calculer les intensités')
    fb()
    return intensCard(c, S, { btn, say: A.say, done: A.done })
  }
  const P = S.sense.pivot, T = S.sense.target
  h('h3', {}, c, `Moments autour du point ${P.id} — on cherche ${forceHtml(T)}`)
  h('p', {}, c, `Centre de rotation : point <b>${P.id}</b> (x = ${fmt(P.x)} mm). Moment = F × distance ; ↺ sens positif (+), ↻ sens négatif (−).`)
  momentTable(c, S)
  if (S.phase === 'groups') {
    q('Quelle somme est la plus grande ?', 'q-groups')
    const bar = h('div', { class: 'btns', role: 'group', 'aria-labelledby': 'q-groups' }, c)
    btn(bar, '<span aria-hidden="true">↺</span> sens positif plus grande', () => A.guessRot('ccw'))
    btn(bar, '<span aria-hidden="true">↻</span> sens négatif plus grande', () => A.guessRot('cw'))
    btn(bar, '= sommes égales', () => A.guessRot('equal'))
  }
  if (S.phase === 'sense') {
    q(`Pour ramener la poutre à l'horizontale, la force ${forceHtml(T)} doit être dirigée…`, 'q-sense')
    const bar = h('div', { class: 'btns', role: 'group', 'aria-labelledby': 'q-sense' }, c)
    btn(bar, '↑ vers le haut', () => A.guessSense(1))
    btn(bar, '↓ vers le bas', () => A.guessSense(-1))
  }
  if (S.phase === 'busy') h('h3', { class: 'sr-only', tabindex: '-1', 'data-focus': '' }, c, 'Vérification en cours')
  if (S.phase === 'result') btn(c, 'Suite', A.next).setAttribute('data-focus', '')
  fb()
}
