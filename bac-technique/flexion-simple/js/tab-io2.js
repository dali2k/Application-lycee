// Définitions des sections, géométrie par bandes, tableau de Huygens et comparaison « même aire ».
// Citation utilisateur : « une partie du cours pour expliquer le moment d'inertie dans plusieurs section ».
import { section, profilI, profilT } from './calc.js'
import { h } from './svg.js'
import { fn, ks, eqs, devI, withTex, MM, MM4, MM2 } from './tex.js'

const P = (k, l, min, max, v) => [k, l, min, max, v]
export const SECS = [
  { id: 'rect', label: 'Rectangle', par: [P('b', 'b (largeur)', 5, 80, 20), P('h', 'h (hauteur)', 10, 120, 60)] },
  { id: 'carre', label: 'Carré', par: [P('a', 'a (côté)', 10, 100, 40)] },
  { id: 'cercle', label: 'Cercle', par: [P('d', 'd (diamètre)', 10, 100, 50)] },
  { id: 'tube', label: 'Tube', par: [P('D', 'D (extérieur)', 20, 100, 60), P('d', 'd (intérieur)', 5, 90, 44)] },
  { id: 'creux', label: 'Rect. creux', par: [P('B', 'B (largeur)', 20, 100, 60), P('H', 'H (hauteur)', 20, 120, 80), P('t', 't (épaisseur)', 2, 15, 6)] },
  { id: 'I', label: 'Profilé I', par: [P('b', 'b (semelle)', 20, 100, 60), P('tf', 't<sub>f</sub> (semelle)', 3, 20, 8), P('tw', 't<sub>w</sub> (âme)', 3, 20, 6), P('hw', 'h<sub>w</sub> (âme)', 20, 120, 80)] },
  { id: 'T', label: 'Profilé T', par: [P('b', 'b (semelle)', 20, 100, 60), P('tf', 't<sub>f</sub> (semelle)', 3, 20, 10), P('tw', 't<sub>w</sub> (âme)', 3, 20, 10), P('hw', 'h<sub>w</sub> (âme)', 20, 120, 60)] },
]
export const defaults = (id) => Object.fromEntries(SECS.find((s) => s.id === id).par.map((r) => [r[0], r[4]]))

const NAMES = { I: ['semelle basse', 'âme', 'semelle haute'], T: ['semelle', 'âme'] }

/** Garde des dimensions cohérentes (d < D, t < moitié du côté). */
export function fix(id, p) {
  const q = { ...p }
  if (id === 'tube') q.d = Math.min(q.d, q.D - 2)
  if (id === 'creux') q.t = Math.min(q.t, Math.min(q.B, q.H) / 2 - 1)
  return q
}

/**
 * Géométrie : propriétés { S, I, v, W } + top/bot (distances de G aux fibres extrêmes, mm),
 * segs(y) = intervalles [x0,x1] de matière à l'altitude y (relative à G, vers le haut), w(y) = largeur de matière.
 */
export function geom(id, p0) {
  const p = fix(id, p0), sp = section(id, p)
  let top, bot, segs, parts = null, yG = 0, comp = null
  if (id === 'rect' || id === 'carre') {
    const b = id === 'rect' ? p.b : p.a, hh = id === 'rect' ? p.h : p.a
    top = bot = hh / 2; segs = (y) => (Math.abs(y) <= hh / 2 ? [[-b / 2, b / 2]] : [])
  } else if (id === 'cercle') {
    top = bot = p.d / 2; segs = (y) => { const k = p.d * p.d / 4 - y * y; return k > 0 ? [[-Math.sqrt(k), Math.sqrt(k)]] : [] }
  } else if (id === 'tube') {
    top = bot = p.D / 2
    segs = (y) => {
      const o = p.D * p.D / 4 - y * y, i = p.d * p.d / 4 - y * y
      if (o <= 0) return []
      const ho = Math.sqrt(o)
      return i > 0 ? [[-ho, -Math.sqrt(i)], [Math.sqrt(i), ho]] : [[-ho, ho]]
    }
  } else if (id === 'creux') {
    top = bot = p.H / 2
    segs = (y) => (Math.abs(y) > p.H / 2 ? [] : Math.abs(y) < p.H / 2 - p.t ? [[-p.B / 2, -p.B / 2 + p.t], [p.B / 2 - p.t, p.B / 2]] : [[-p.B / 2, p.B / 2]])
  } else {
    comp = id === 'T' ? profilT(p.b, p.tf, p.tw, p.hw) : profilI(p.b, p.tf, p.tw, p.hw)
    parts = comp.rows; yG = comp.yG; top = comp.vTop; bot = comp.vBot
    segs = (y) => { const r = parts.find((q) => Math.abs(q.yc - yG - y) <= q.h / 2); return r ? [[-r.b / 2, r.b / 2]] : [] }
  }
  const w = (y) => segs(y).reduce((s, [a, b]) => s + b - a, 0)
  const breaks = parts ? parts.flatMap((r) => [r.yc - yG - r.h / 2, r.yc - yG + r.h / 2]) : []
  return { ...sp, p, top, bot, segs, w, parts, yG, breaks, comp }
}

/** Huygens (I, T) : tableau défilant (valeurs KaTeX) puis développement de yG et de IGz. */
export function huygens(parent, id, g) {
  const nm = NAMES[id], td = (v) => `<td>${v}</td>`
  const head = [['Partie', ''], ['S', MM2], ['y_{c}', MM], ['d', MM], ['I_{0}=\\dfrac{b\\,h^{3}}{12}', MM4], ['S\\,d^{2}', MM4], ['I_{0}+S\\,d^{2}', MM4]]
  const th = head.map(([x, u], k) => `<th>${k ? ks(x) : x}${u ? '<br><small>' + ks(u) + '</small>' : ''}</th>`).join('')
  const dec = [0, 2, 2, 0, 0, 0]
  const rows = g.parts.map((r, i) => '<tr>' + [nm[i], ...[r.S, r.yc, r.d, r.i0, r.S * r.d ** 2, r.i0 + r.S * r.d ** 2].map((v, k) => ks(fn(v, dec[k])))].map(td).join('') + '</tr>')
  const tot = td('<b>Total</b>') + td(ks(fn(g.S, 0))) + td('') + td('') + td('') + td('') + td('<b>' + ks(fn(g.I, 0)) + '</b>')
  const w = h('div', { class: 'tblw' }, parent, `<table class="hy"><tr>${th}</tr>${rows.join('')}<tr class="tot">${tot}</tr></table>`)
  h('p', {}, parent, withTex('Chaque partie est décalée de $d_{i}=y_{c,i}-y_{G}$ par rapport à $G_{z}$.'))
  eqs(parent, devI(id, g))
  return w
}

const SAME = 3600
export const SAME_SHAPES = () => {
  const D = 100, dd = Math.sqrt(D * D - (4 * SAME) / Math.PI)
  return [
    ['Carré 60×60', 'carre', { a: 60 }], ['Rectangle debout 30×120', 'rect', { b: 30, h: 120 }],
    ['Rectangle couché 120×30', 'rect', { b: 120, h: 30 }], ['Cercle plein ⌀' + fn(Math.sqrt((4 * SAME) / Math.PI), 1).replace('{,}', ','), 'cercle', { d: Math.sqrt((4 * SAME) / Math.PI) }],
    [`Tube ⌀${D}/${fn(dd, 1).replace('{,}', ',')}`, 'tube', { D, d: dd }], ['Profilé I 80, âme 200', 'I', { b: 80, tf: 10, tw: 10, hw: 200 }],
  ]
}

/** Même aire (3600 mm²) : quelle forme est la plus rigide ? Barres proportionnelles à IGz. */
export function compare(parent) {
  const list = SAME_SHAPES().map(([n, id, p]) => ({ n, I: section(id, p).I }))
  const max = Math.max(...list.map((x) => x.I)), ref = list[0].I
  const c = h('div', { class: 'card' }, parent, '<h3>Même aire, quelle forme est la plus rigide ?</h3>' + withTex('<p>Toutes ces sections ont la même aire $S = 3\\,600\\text{ mm}^{2}$ (donc la même masse). Plus $I_{Gz}$ est grand, moins la poutre fléchit.</p>'))
  for (const x of list) {
    const r = h('div', { class: 'cmp' }, c)
    h('span', {}, r, x.n)
    const bar = h('div', { class: 'bar' }, r); h('i', { style: `width:${(100 * x.I) / max}%` }, bar)
    h('b', {}, r, ks(`${fn(x.I / 1e4, 0)}\\text{ cm}^{4}\\;(\\times ${fn(x.I / ref, 1)})`))
  }
  h('p', {}, c, withTex('Conclusion : on place la matière <b>loin de $G_{z}$</b>, dans le sens de la flexion (poutre debout, profilé I, tube). Un rectangle couché est le pire.'))
}
