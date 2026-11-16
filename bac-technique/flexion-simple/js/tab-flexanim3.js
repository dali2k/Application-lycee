// Formules KaTeX sous l'animation de flexion (ε, loi de Hooke, σ = Mf·y/IGz avec valeurs numériques) et sens des signes.
// Importateur : tab-flexanim.js. Citation : « dans la contrainte et calcule je veux une animation sur la flexion generer pour que l'eleve comme c'est fait la flexion ».
import { h } from './svg.js'
import { eqs, fn, ks, MPA } from './tex.js'

/** el : conteneur ; o = { g (I, v), mf (N·mm) } ; sg = +1 (Mf > 0) ou −1 (Mf < 0). */
export function flexFormulas(el, o, sg) {
  el.innerHTML = ''
  const { I, v } = o.g, m = sg * Math.abs(o.mf), has = Math.abs(o.mf) > 0
  h('p', { class: 'lbl2' }, el, 'Loi de la déformation puis de la contrainte :')
  eqs(el, ['\\varepsilon = \\dfrac{\\Delta L}{L} = \\dfrac{y}{\\rho}', '\\sigma = E\\cdot\\varepsilon = \\dfrac{E\\,y}{\\rho}', '\\sigma = \\dfrac{M_{f}\\,y}{I_{Gz}}\\qquad\\text{car}\\qquad \\dfrac{1}{\\rho} = \\dfrac{M_{f}}{E\\,I_{Gz}}'])
  if (has) {
    eqs(el, [`\\sigma(y) = \\dfrac{${fn(m, 0)}}{${fn(I, 0)}}\\,y = ${fn(m / I, 4)}\\,y\\;\\text{(MPa, } y \\text{ en mm)}`,
      `\\sigma(\\pm v) = \\pm\\dfrac{M_{f}\\,v}{I_{Gz}} = \\pm\\dfrac{${fn(Math.abs(m), 0)}\\times ${fn(v)}}{${fn(I, 0)}} = \\pm ${fn((Math.abs(m) * v) / I)}${MPA}`])
  }
  const q = (x) => x.replace(/\$([^$]+)\$/g, (_, t) => ks(t))
  h('p', { class: 'lbl2' }, el, q('$y$ est mesuré depuis la fibre neutre, positif vers le haut ; $\\sigma > 0$ = compression, $\\sigma < 0$ = traction. ')
    + (sg > 0 ? q('Ici $M_{f} > 0$ : haut raccourci (compression), bas allongé (traction).') : q('Ici $M_{f} < 0$ : haut allongé (traction), bas raccourci (compression).')))
}
