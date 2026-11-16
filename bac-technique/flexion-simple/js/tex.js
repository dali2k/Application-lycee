// Aides LaTeX des onglets 4-6 : nombres français à n décimales, unités, KaTeX en chaîne HTML, développements de IGz.
// Importateurs : tab-io.js, tab-io2.js, tab-sigma.js, tab-sigma3.js, tab-sigma4.js, tab-quiz.js.
// Citation utilisateur : « respecte les normalisation des expression mathematique … l'affichage n'est pas adapter a tous les ecrant c'est pas dynamique ».
import { fmtNum, MM, renderTex } from './math.js'

export const MM2 = '\\text{ mm}^{2}', MM3 = '\\text{ mm}^{3}', MM4 = '\\text{ mm}^{4}'
export const MPA = '\\text{ MPa}', NMM = '\\text{ N·mm}', NN = '\\text{ N}'
export { fmtNum, MM }

/** Nombre LaTeX français à `d` décimales max (sans zéros inutiles) ; d = 0 → entier. */
export function fn(v, d = 2) {
  if (!Number.isFinite(v)) return '\\text{—}'
  const s = Math.abs(v).toFixed(d), neg = Number(s) !== 0 && v < 0
  const [ip, dp] = (d > 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s).split('.')
  return (neg ? '-' : '') + ip.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') + (dp ? `{,}${dp}` : '')
}

/** KaTeX en ligne sous forme de chaîne HTML (repli texte si KaTeX absent). */
export function ks(latex) {
  const k = globalThis.katex
  if (!k) return latex.replace(/\\,/g, ' ').replace(/\{,\}/g, ',').replace(/[{}\\]/g, '')
  try { return k.renderToString(latex, { throwOnError: false, displayMode: false }) } catch { return latex }
}

/** Remplace chaque $…$ d'un texte HTML par du KaTeX en ligne. */
export const withTex = (html) => html.replace(/\$([^$]+)\$/g, (_, t) => ks(t))

/** Développements LaTeX de IGz pour la section de géométrie g (p = dimensions ; couche = rectangle couché). */
export function devI(id, g, couche = false) {
  const p = g.p, I = `${fn(g.I, 0)}${MM4}`, a = (k) => fn(p[k], 2)
  if (id === 'rect') return couche
    ? [`I_{Gz} = \\dfrac{h\\,b^{3}}{12} = \\dfrac{${a('h')}\\times ${a('b')}^{3}}{12} = ${I}`]
    : [`I_{Gz} = \\dfrac{b\\,h^{3}}{12} = \\dfrac{${a('b')}\\times ${a('h')}^{3}}{12} = ${I}`]
  if (id === 'carre') return [`I_{Gz} = \\dfrac{a^{4}}{12} = \\dfrac{${a('a')}^{4}}{12} = ${I}`]
  if (id === 'cercle') return [`I_{Gz} = \\dfrac{\\pi\\,d^{4}}{64} = \\dfrac{\\pi\\times ${a('d')}^{4}}{64} = ${I}`]
  if (id === 'tube') return [`I_{Gz} = \\dfrac{\\pi\\,(D^{4}-d^{4})}{64} = \\dfrac{\\pi\\times (${a('D')}^{4}-${a('d')}^{4})}{64} = ${I}`]
  if (id === 'creux') {
    const bi = p.B - 2 * p.t, hi = p.H - 2 * p.t
    return [`I_{Gz} = \\dfrac{B\\,H^{3}-(B-2t)(H-2t)^{3}}{12} = \\dfrac{${a('B')}\\times ${a('H')}^{3}-${fn(bi)}\\times ${fn(hi)}^{3}}{12} = ${I}`]
  }
  return huygensTex(g, I)
}

/** Profilés I et T : yG puis IGz = Σ(I₀ + S·d²), chaque terme développé. */
function huygensTex(g, I) {
  const rows = g.parts, sum = (f) => rows.map(f).join('+')
  const yg = [`y_{G} = \\dfrac{\\sum S_{i}\\,y_{c,i}}{\\sum S_{i}} = \\dfrac{${sum((r) => `${fn(r.S, 0)}\\times ${fn(r.yc, 1)}`)}}{${sum((r) => fn(r.S, 0))}} = ${fn(g.yG)}${MM}`]
  const terms = rows.map((r, i) => `\\left(I_{0${i + 1}}+S_{${i + 1}}\\,d_{${i + 1}}^{2}\\right)`).join('+')
  const nums = rows.map((r) => `\\left(${fn(r.i0, 0)}+${fn(r.S, 0)}\\times ${fn(r.d)}^{2}\\right)`).join('+')
  return [...yg, 'I_{Gz} = \\sum\\left(I_{0i}+S_{i}\\,d_{i}^{2}\\right) = ' + terms,
    `\\phantom{I_{Gz}} = ${nums} = ${I}`]
}

/** Affiche une liste de lignes LaTeX : un bloc d'équations par ligne. */
export function eqs(parent, lines) {
  const box = document.createElement('div')
  box.className = 'eqs'
  lines.forEach((l) => renderTex(box, l))
  parent.appendChild(box)
  return box
}
