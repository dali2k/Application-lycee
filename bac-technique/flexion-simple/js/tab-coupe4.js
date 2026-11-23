// Onglet 2 : formules LaTeX (KaTeX) de la coupure, façon solution.ts de la 3ème. Pur : renvoie des chaînes LaTeX.
import { fmtNum, nm, MM, N, NMM, latexName } from './math.js'

const par = (n, u = '') => (n < 0 ? `\\left(${fmtNum(n)}${u}\\right)` : `${fmtNum(n)}${u}`)
/** Nombre signé : « +270 », « -490 », « 0 ». */
export const sv = (v) => (v > 0 ? '+' : '') + fmtNum(v)
const aligned = (lines) => `\\begin{aligned}${lines.join('\\\\')}\\end{aligned}`

export const headTex = (left) => (left ? 'T = -\\sum F \\qquad M_f = -\\sum M_G' : 'T = +\\sum F \\qquad M_f = +\\sum M_G')

/** Origine des distances : premier point à gauche (A). x = distance de l'origine à G. */
export const origin = (loads) => loads.forces[0]

/** Expression de la distance d d'une force à G, l'origine restant en A : x, x − AB (à gauche de G), AD − x (à droite). */
export function distExpr(r, left, org) {
  if (r.f.x === org.x) return { plain: 'x', tex: 'x' }
  const ab = org.id + r.f.id, abTex = latexName(org.id) + latexName(r.f.id)
  return left ? { plain: `x − ${ab}`, tex: `x - ${abTex}` } : { plain: `${ab} − x`, tex: `${abTex} - x` }
}

/** Distances entre l'origine et chaque point utilisé : AB = 300 mm, AC = AB + BC = 300 + 400 = 700 mm. */
export function distsTex(st, org, pts) {
  const seen = new Set(), lines = []
  for (const r of st.rows) {
    if (r.f.x === org.x || seen.has(r.f.id)) continue
    seen.add(r.f.id)
    const chain = [org, ...pts.filter((p) => p.x > org.x && p.x < r.f.x), r.f]
    const segs = chain.slice(1).map((q, i) => [chain[i], q])
    const sym = latexName(org.id) + latexName(r.f.id), tot = `${fmtNum(r.f.x - org.x)}${MM}`
    lines.push(segs.length === 1 ? `${sym} &= ${tot}`
      : `${sym} &= ${segs.map(([a, b]) => latexName(a.id) + latexName(b.id)).join(' + ')} = ${segs.map(([a, b]) => fmtNum(b.x - a.x)).join(' + ')} = ${tot}`)
  }
  return lines.length ? aligned(lines) : ''
}

/** Étape littérale : d et M_G de chaque force, sans aucune valeur numérique. */
export function momentsSym(st, org) {
  const sign = st.left ? '-' : '+', lines = []
  for (const r of st.rows) {
    const e = distExpr(r, st.left, org)
    lines.push(`d_{${nm(r.f)}} &= ${e.tex}`)
    lines.push(`M_{G}(${nm(r.f)}) &= ${sign}${nm(r.f)} \\times d_{${nm(r.f)}} \\\\[2pt]`)
  }
  for (const c of st.couples) lines.push(`M_{${c.id}} &= ${sv(c.m)}${NMM}`)
  return aligned(lines)
}

/** ΣF, ΣM_G, T et M_f littéraux. */
export function sumsSym(st) {
  const op = st.left ? '-' : '+'
  const fn = st.rows.map((r) => nm(r.f)).join(' + ')
  const mn = [...st.rows.map((r) => `M_{G}(${nm(r.f)})`), ...st.couples.map((c) => `M_{${c.id}}`)].join(' + ')
  return aligned([`\\sum F &= ${fn} \\\\[2pt]`, `\\sum M_G &= ${mn} \\\\[2pt]`, `T &= ${op}\\sum F \\qquad M_f = ${op}\\sum M_G`])
}

/** Application numérique : d puis M_G = ∓F × d, valeurs seulement ici. */
export function momentsTex(st, x, org) {
  const X = x - org.x, sign = st.left ? '-' : '+', lines = []
  for (const r of st.rows) {
    const e = distExpr(r, st.left, org), a = r.f.x - org.x
    const num = a === 0 ? fmtNum(X) : st.left ? `${fmtNum(X)} - ${fmtNum(a)}` : `${fmtNum(a)} - ${fmtNum(X)}`
    lines.push(`d_{${nm(r.f)}} &= ${e.tex} = ${num} = ${fmtNum(r.d)}${MM}`)
    lines.push(`M_{G}(${nm(r.f)}) &= ${sign}${par(r.f.value, N)} \\times ${fmtNum(r.d)}${MM} = ${sv(r.m)}${NMM} \\\\[2pt]`)
  }
  for (const c of st.couples) lines.push(`M_{${c.id}} &= ${sv(c.m)}${NMM}`)
  return aligned(lines)
}

/** ΣF et ΣM_G numériques. */
export function sumsTex(st) {
  const fv = st.rows.map((r) => par(r.f.value, N)).join(' + ')
  const mv = [...st.rows.map((r) => par(r.m, NMM)), ...st.couples.map((c) => par(c.m, NMM))].join(' + ')
  return aligned([
    `\\sum F &= ${fv} = ${sv(st.sF)}${N} \\\\[4pt]`,
    `\\sum M_G &= ${mv} = ${sv(st.sM)}${NMM}`,
  ])
}

/** T et Mf, conversion en N·m. */
export function resultTex(st) {
  const op = st.left ? '-' : '+'
  return aligned([
    `T &= ${op}\\sum F = ${op}\\left(${sv(st.sF)}${N}\\right) = ${sv(st.T)}${N}`,
    `M_f &= ${op}\\sum M_G = ${op}\\left(${sv(st.sM)}${NMM}\\right) \\\\ &= ${sv(st.Mf)}${NMM} = ${sv(st.Mf / 1000)}\\text{ N·m}`,
  ])
}

/** Vérification gauche = droite. */
export const checkTex = (a, b) =>
  aligned([`\\text{gauche : } &T = ${sv(a.T)}${N},\\ M_f = ${sv(a.Mf)}${NMM}`, `\\text{droite : } &T = ${sv(b.T)}${N},\\ M_f = ${sv(b.Mf)}${NMM}`])
