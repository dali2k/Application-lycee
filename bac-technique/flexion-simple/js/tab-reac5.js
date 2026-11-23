// Onglet 1 : solution détaillée en lignes LaTeX (port de core/solution.ts + solutionFormat.ts de la 3ème). Pur, sans DOM.
// Importé par tab-reac4.js (boîte « Solution détaillée »). API : buildSolution(ex) → [{ title, lines }].
import { fmtNum, latexName, nm, MM, N, NMM } from './math.js'
import { forceText, validateExercise } from './exercise.js'
import { solveSupports, solveFixed, unknown } from './statics.js'

const sg = (s) => (s < 0 ? '-' : '+')
const unique = (xs) => [...new Set(xs)]
const sayUp = (s) => (s > 0 ? 'vers le haut' : 'vers le bas')
const sayTerm = (t) => (t.mod === 0 ? 'force nulle' : sayUp(t.sense))
const ptOf = (f) => ({ n: latexName(f.id), x: f.x, id: f.id })

const visLen = (l) => l.replace(/\\[,;]/g, '').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}&]/g, '').length
/** Ligne longue avec « = » : 2 rangées alignées, coupure au dernier « = ». */
export function wrapEq(l, max = 60) {
  const i = l.lastIndexOf('=')
  if (l.startsWith('\\begin') || i < 1 || visLen(l) <= max) return l
  return `\\begin{aligned}&${l.slice(0, i).trim()}\\\\ &${l.slice(i).trim()}\\end{aligned}`
}

/** Distance entre deux points, composée par les points intermédiaires : AD = AB + BC + CD = … mm. */
export function dist(c, p, all) {
  const d = Math.abs(p.x - c.x)
  let mids = all.filter((q) => q.x > Math.min(c.x, p.x) && q.x < Math.max(c.x, p.x))
  if (p.x < c.x) mids = mids.reverse()
  const sym = c.n + p.n
  if (!mids.length) return { sym, d }
  const chain = [c, ...mids, p], segs = chain.slice(1).map((q, i) => [chain[i], q])
  const syms = segs.map(([a, b]) => a.n + b.n).join(' + ')
  const nums = `${segs.map(([a, b]) => fmtNum(Math.abs(b.x - a.x))).join(' + ')} = ${fmtNum(d)}${MM}`
  const comp = segs.length >= 3 ? `\\begin{aligned}${sym} &= ${syms}\\\\ &= ${nums}\\end{aligned}` : `${sym} = ${syms} = ${nums}`
  return { sym, d, comp }
}

/** Termes : module, sens réel (+1 haut / −1 bas), inconnue ou non. */
function termsOf(ex) {
  const sol = ex.type === 'encastree' ? { [unknown(ex)[0].id]: solveFixed(ex).A } : solveSupports(ex)
  return ex.forces.map((f) => {
    const v = f.kind === 'unknown' ? sol[f.id] : f.value
    return { f, name: nm(f), mod: Math.abs(v), sense: v < 0 ? -1 : 1, unknown: f.kind === 'unknown' }
  })
}

function momentItems(T, c, all) {
  return T.filter((t) => t.f.x !== c.x).sort((a, b) => Number(b.unknown) - Number(a.unknown) || a.f.x - b.f.x)
    .map((t) => ({ t, s: t.sense * (t.f.x > c.x ? 1 : -1), d: dist(c, all.find((q) => q.x === t.f.x), all) }))
}
const symEq = (it) => `${it.map((i) => `${sg(i.s)} ${i.t.name} \\cdot ${i.d.sym}`).join(' ')} = 0`
/** Somme signée : parts = [{ neg, b }] → « -a + b - c » (0 si vide). */
const lin = (parts) => (parts.length ? parts.map((p, i) => (i === 0 ? (p.neg ? '-' : '') : ` ${p.neg ? '-' : '+'} `) + p.b).join('') : '0')
const numTerm = (i) => `${sg(i.s)} ${fmtNum(i.t.mod)} \\cdot ${fmtNum(i.d.d)}`
const comps = (items) => unique(items.flatMap((i) => (i.d.comp ? [i.d.comp] : [])))
const AN = '\\text{Application numérique :}'

function dataStep(ex, T, all) {
  const lines = [`L = ${fmtNum(ex.L)}${MM}`]
  lines.push(...all.slice(1).map((q, i) => `${all[i].n}${q.n} = ${fmtNum(q.x - all[i].x)}${MM}`))
  for (const t of T.filter((q) => !q.unknown)) lines.push(`${t.name} = ${fmtNum(t.mod)}${N},\\ \\text{${sayUp(t.sense)}}`)
  for (const t of T.filter((q) => q.unknown)) lines.push(`${t.name}\\ \\text{${sayTerm(t)}}`)
  lines.push('\\text{Somme des forces : vers le haut } (+), \\text{ vers le bas } (-)',
    '\\text{Somme des moments : sens positif } (+), \\text{ sens négatif } (-)',
    "\\text{Moment d'une force autour d'un centre } C \\text{ :}",
    '(+)\\ \\text{si vers le haut et à droite de } C', '(+)\\ \\text{ou vers le bas et à gauche de } C', '(-)\\ \\text{sinon}')
  return { title: 'Données', lines }
}

function momentsStep(T, u1, u2, all) {
  const c = ptOf(u1.f), items = momentItems(T, c, all)
  const tgt = items.find((i) => i.t === u2), others = items.filter((i) => i !== tgt)
  const K = others.reduce((s, i) => s + i.s * i.t.mod * i.d.d, 0), rhs = -tgt.s * K, val = rhs / tgt.d.d
  const neg = (i) => -tgt.s * i.s < 0
  const zero = T.filter((t) => t !== u1 && t.f.x === c.x).map((t) => `${t.name}\ \\text{passe par } ${c.id} : \\text{moment nul}`)
  const symSol = others.length ? `${u2.name} = \\dfrac{${lin(others.map((i) => ({ neg: neg(i), b: `${i.t.name} \\cdot ${i.d.sym}` })))}}{${tgt.d.sym}}` : `${u2.name} = 0`
  const numSol = others.length
    ? `${u2.name} = \\dfrac{${lin(others.map((i) => ({ neg: neg(i), b: `${fmtNum(i.t.mod)} \\cdot ${fmtNum(i.d.d)}` })))}}{${fmtNum(tgt.d.d)}} = \\dfrac{${fmtNum(rhs)}}{${fmtNum(tgt.d.d)}} = ${fmtNum(val)}${N}`
    : `${u2.name} = 0${N}`
  return { title: `Somme des moments : calcul de ${forceText(u2.f)}`, lines: [
    ...zero, `\\sum M_{${c.n}} = 0`, symEq(items), symSol, AN, ...comps(items), numSol] }
}

function forcesStep(order, u1) {
  const terms = order.filter((t) => t !== u1).map((t) => ({ t, c: -u1.sense * t.sense, v: -u1.sense * t.sense * t.mod }))
  terms.sort((a, b) => Number(b.c > 0) - Number(a.c > 0))
  const val = terms.reduce((s, q) => s + q.v, 0)
  const sym = lin(terms.map((q) => ({ neg: q.c < 0, b: q.t.name })))
  const num = lin(terms.map((q) => ({ neg: q.c < 0, b: fmtNum(q.t.mod) })))
  return { title: `Somme des forces : calcul de ${forceText(u1.f)}`, lines: ['\\sum F = 0',
    `${order.map((t) => `${sg(t.sense)} ${t.name}`).join(' ')} = 0`,
    `${u1.name} = ${sym}`, AN, `${u1.name} = ${num} = ${fmtNum(val)}${N}`] }
}

function checkStep(T, u2, all) {
  const c = ptOf(u2.f), items = momentItems(T, c, all)
  const sum = items.reduce((s, i) => s + i.s * i.t.mod * i.d.d, 0), z = Math.abs(sum) < 1e-6 ? 0 : sum
  return { title: 'Vérification', lines: [`\\sum M_{${c.n}} = 0 \\quad \\text{(autour de } ${c.n}\\text{)}`,
    `${items.map((i) => numTerm(i)).join(' ')} = ${fmtNum(z)}${z === 0 ? ' \\;\\checkmark' : ''}`] }
}

/** Encastrement : ΣF = 0 → R_A ; ΣM/A = 0 → M_A (sens positif +). */
function fixedSteps(ex, T, all) {
  const u = T.find((t) => t.unknown), c = ptOf(u.f), { Me } = solveFixed(ex)
  const items = momentItems(T, c, all), K = items.reduce((s, i) => s + i.s * i.t.mod * i.d.d, 0)
  const MA = `M_{${c.n}}`, sense = Me === 0 ? 'moment nul' : Me > 0 ? 'sens positif' : 'sens négatif'
  return [forcesStep([u, ...T.filter((t) => !t.unknown)], u),
    { title: `Somme des moments : calcul de M_${c.id}`, lines: [
      `\\sum M_{${c.n}} = 0 \\quad \\text{(sens positif } (+))`, `${MA} ${items.map((i) => `${sg(i.s)} ${i.t.name} \\cdot ${i.d.sym}`).join(' ')} = 0`,
      `${MA} = ${lin(items.map((i) => ({ neg: i.s > 0, b: `${i.t.name} \\cdot ${i.d.sym}` })))}`, AN, ...comps(items),
      `${MA} = ${lin(items.map((i) => ({ neg: i.s > 0, b: `${fmtNum(i.t.mod)} \\cdot ${fmtNum(i.d.d)}` })))} = ${fmtNum(-K)}${NMM}\\ (\\text{${sense}})`] },
    { title: 'Résultat', lines: [`${u.name} = ${fmtNum(u.mod)}${N}\\ (\\text{${sayTerm(u)}})`, `${MA} = ${fmtNum(Math.abs(Me))}${NMM}\\ (\\text{${sense}})`] }]
}

export function buildSolution(ex) {
  if (validateExercise(ex).length) return []
  const T = termsOf(ex), all = ex.forces.map(ptOf)
  let steps
  if (ex.type === 'encastree') steps = [dataStep(ex, T, all), ...fixedSteps(ex, T, all)]
  else {
    const [u1, u2] = unknown(ex).map((f) => T.find((t) => t.f === f))
    steps = [dataStep(ex, T, all), momentsStep(T, u1, u2, all), forcesStep([u1, u2, ...T.filter((t) => !t.unknown)], u1),
      { title: 'Résultat', lines: [u1, u2].map((t) => `${t.name} = ${fmtNum(t.mod)}${N}\\ (\\text{${sayTerm(t)}})`) },
      checkStep(T, u2, all)]
  }
  return steps.map((st) => ({ ...st, lines: st.lines.map((l) => wrapEq(l)) }))
}
