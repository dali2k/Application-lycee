// Outils mathématiques partagés : nombres LaTeX français, noms de forces, rendu KaTeX, textes SVG avec indices.
// Pur (sans DOM) sauf renderTex / subText, qui reçoivent un parent ou créent un élément.
const r2 = (n) => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? 0 : v }

/** Nombre LaTeX français : milliers « \, », décimale « {,} », signe « - » (rendu −). */
export function fmtNum(n) {
  const v = r2(n)
  const [ip, dp] = Math.abs(v).toString().split('.')
  const grouped = ip.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,')
  return (v < 0 ? '-' : '') + grouped + (dp ? `{,}${dp}` : '')
}

export function latexName(id) {
  if (/^[A-Za-z]$/.test(id)) return id
  const m = /^([A-Za-z])(\d+)$/.exec(id)
  if (m) return `${m[1]}_{${m[2]}}`
  return `\\mathrm{${String(id).replace(/[^A-Za-z0-9]/g, '') || '?'}}`
}

export const MM = '\\text{ mm}'
export const N = '\\text{ N}'
export const NMM = '\\text{ N·mm}'
export const sgn = (v) => (v < 0 ? '-' : '+')

const subOf = (f) => String(f.id).replace(/[^A-Za-z0-9]/g, '') || '?'
const baseOf = (f) => (f.kind === 'unknown' ? 'R' : 'F')
/** Nom LaTeX d'une force : R_{A} (inconnue), F_{C} (connue). */
export const nm = (f) => `${baseOf(f)}_{${subOf(f)}}`

/** Rend `latex` dans `parent` ; display → div.math-block (défilement horizontal). Repli texte si KaTeX absent. */
export function renderTex(parent, latex, { display = true } = {}) {
  const el = document.createElement(display ? 'div' : 'span')
  if (display) el.className = 'math-block'
  const k = globalThis.katex
  if (k) {
    try { k.render(latex, el, { displayMode: display, throwOnError: false, trust: false }) }
    catch { el.textContent = latex }
  } else el.textContent = latex.replace(/\\,/g, ' ').replace(/\{,\}/g, ',').replace(/[{}\\]/g, '')
  if (parent) parent.appendChild(el)
  return el
}

const SR = '<span class="sr-only"> indice </span>'
/** 'R<sub>A</sub>' : lettre + indice (HTML), indice annoncé « indice » aux lecteurs d'écran. */
export const forceHtml = (f) => `${baseOf(f)}<sub>${SR}${subOf(f)}</sub>`

/** Remplace chaque marqueur « F_C » / « R_A » du texte par lettre + indice (HTML). Le reste est échappé. */
export function richText(str) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc(String(str)).replace(/\b([FR])_([A-Za-z][A-Za-z0-9]{0,2})\b/g, (_, b, s) => `${b}<sub>${SR}${s}</sub>`)
}

const SVGNS = 'http://www.w3.org/2000/svg'
/** <text> SVG avec indice réel (tspan dy en em, taille via CSS .sub = .72em). */
export function subText(parent, { base, sub, suffix = '', x, y, anchor = 'middle', cls = '' }) {
  const t = document.createElementNS(SVGNS, 'text')
  t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('text-anchor', anchor)
  if (cls) t.setAttribute('class', cls)
  t.appendChild(document.createTextNode(base))
  const s = document.createElementNS(SVGNS, 'tspan')
  s.setAttribute('class', 'sub'); s.setAttribute('dy', '0.35em'); s.textContent = sub
  t.appendChild(s)
  if (suffix) {
    const u = document.createElementNS(SVGNS, 'tspan')
    u.setAttribute('dy', '-0.25em'); u.textContent = suffix
    t.appendChild(u)
  }
  if (parent) parent.appendChild(t)
  return t
}
