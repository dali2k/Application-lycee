// Onglet 5 : quiz de 8 QCM.
import { h } from './svg.js'

const Q = [
  ['Dans l’essai de torsion, la génératrice droite M₀M devient :', ['une droite', 'une hélice', 'un cercle'], 1, 'Les fibres s’enroulent en hélices autour de l’axe.'],
  ['Au centre d’un arbre plein, la contrainte tangentielle τ vaut :', ['0', 'τmax', 'τmax / 2'], 0, 'τ = G·θ·ρ : ρ = 0 donc τ = 0 (fibre neutre).'],
  ['Où τ est-elle maximale dans un arbre plein ?', ['sur l’axe', 'au bord (ρ = R)', 'à mi-rayon'], 1, 'τ croît linéairement avec ρ, donc maximale à ρ = R.'],
  ['Si on double le diamètre d’un arbre plein, Io est multiplié par :', ['2', '8', '16'], 2, 'Io = π·d⁴/32 : 2⁴ = 16.'],
  ['L’unité du moment quadratique polaire Io est :', ['mm⁴', 'mm³', 'mm²'], 0, 'Io = Σ ρ²·ΔS : mm² × mm² = mm⁴.'],
  ['Le module de torsion Io/ρmax s’exprime en :', ['mm⁴', 'mm³', 'N·mm'], 1, 'mm⁴ / mm = mm³.'],
  ['La condition de résistance en torsion s’écrit :', ['τmax ≤ Rpg = Reg / s', 'θ ≥ θlim', 'Mt ≥ Io'], 0, 'On compare la contrainte maximale à la résistance pratique au glissement.'],
  ['À même quantité de matière, un tube par rapport à un arbre plein résiste à la torsion :', ['moins bien', 'aussi bien', 'mieux'], 2, 'La matière est plus loin du centre : Io est plus grand.'],
]

export function mount(root) {
  root.innerHTML = ''
  const card = h('div', { class: 'card' }, root, '<h2>Quiz : torsion simple</h2>')
  const blocks = Q.map(([q, opts], i) => {
    const b = h('div', { style: 'margin:10px 0' }, card, `<p><b>${i + 1}.</b> ${q}</p>`)
    opts.forEach((o, j) => h('label', { style: 'display:block;margin:2px 0' }, b, `<input type="radio" name="q${i}" value="${j}"> ${o}`))
    return h('p', { class: 'lbl2' }, b)
  })
  const btn = h('button', { type: 'button', class: 'btn' }, card, 'Corriger')
  const score = h('p', {}, card)
  btn.addEventListener('click', () => {
    let ok = 0
    Q.forEach(([, , good, why], i) => {
      const sel = card.querySelector(`input[name=q${i}]:checked`)
      const right = sel && +sel.value === good
      if (right) ok++
      blocks[i].innerHTML = right ? `<span class="ok">✔ Bravo.</span> ${why}` : `<span class="bad">✘</span> ${why}`
    })
    score.innerHTML = `<b>Score : ${ok} / ${Q.length}</b>`
  })
}
