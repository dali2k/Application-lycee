// Panneau « flèche » de l'onglet Contraintes : formule et application numérique en KaTeX.
// Importateur : tab-sigma.js. Citation : « respecte les normalisation des expression mathematique … ».
import { h } from './svg.js'
import { fleche } from './calc.js'
import { numIn } from './tab-sigma3.js'
import { fn, eqs, withTex, MM } from './tex.js'

/** ctx() → { I (mm⁴) }. Renvoie update(). */
export function flechePanel(parent, ctx) {
  const c = h('div', { class: 'card' }, parent, '<h3>Flèche</h3>')
  const st = { cas: 'centre', F: 1000, L: 1000, E: 200000 }
  const sel = h('select', { 'aria-label': 'Cas de charge' }, h('label', { class: 'mini' }, c, '<span>Cas</span>'))
  sel.innerHTML = '<option value="centre">Poutre sur 2 appuis, charge au milieu</option><option value="console">Console, charge à l\'extrémité</option>'
  sel.onchange = () => { st.cas = sel.value; update() }
  numIn(c, 'F (N)', st.F, (v) => { st.F = v; update() })
  numIn(c, 'L (mm)', st.L, (v) => { st.L = v; update() })
  numIn(c, 'E (MPa)', st.E, (v) => { st.E = v; update() }, { step: 1000 })
  const out = h('div', {}, c)
  function update() {
    const { I } = ctx(), den = st.cas === 'centre' ? 48 : 3
    const f = fleche(st.cas, st.F, st.L, st.E, I)
    out.innerHTML = ''
    eqs(out, [`f_{\\max} = \\dfrac{F\\,L^{3}}{${den}\\,E\\,I_{Gz}}`,
      `f_{\\max} = \\dfrac{${fn(Math.abs(st.F), 0)}\\times ${fn(st.L, 0)}^{3}}{${den}\\times ${fn(st.E, 0)}\\times ${fn(I, 0)}} = ${fn(f, 3)}${MM}`,
      `\\dfrac{f_{\\max}}{L} = \\dfrac{1}{${fn(st.L / f, 0)}}`])
    h('p', { class: 'lbl2' }, out, withTex('$E_{\\text{acier}} = 200\\,000\\text{ MPa}$ ; $I_{Gz}$ est celui de la section choisie ci-dessus.'))
  }
  return update
}
