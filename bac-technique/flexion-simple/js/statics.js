import { normalizeExercise, forceName, forceText, validateExercise, POINT_LETTERS, EXAMPLES, EXAMPLE_LIST, randomExercise, fixedAt } from './exercise.js'
export { normalizeExercise, forceName, forceText, validateExercise, POINT_LETTERS, EXAMPLES, EXAMPLE_LIST, randomExercise, fixedAt }

// Statique de la poutre (porté de l'app « Statique des solides » 3ème) — N, mm.
// Force : { id, x, kind: 'known'|'unknown', value? } ; value signée, + = vers le haut.
// Moment d'une force autour d'un point : F·(x − xp) ; + = sens positif ↺ (ccw), − = sens négatif ↻ (cw).

export const momentAbout = (f, xp) => (f.value ?? 0) * (f.x - xp)
export const known = (ex) => ex.forces.filter((f) => f.kind === 'known')
export const unknown = (ex) => ex.forces.filter((f) => f.kind === 'unknown')

const EPS = 1e-9
export const negligible = (v, scale) => Math.abs(v) < EPS * Math.max(scale, 1)

/** Moments des forces connues autour de xp, groupés par sens de rotation. */
export function momentGroups(ex, xp) {
  const ccw = { items: [], sum: 0 }, cw = { items: [], sum: 0 }, zero = []
  const ms = known(ex).map((force) => ({ force, moment: momentAbout(force, xp) }))
  const big = Math.max(1, ...ms.map((m) => Math.abs(m.moment)))
  for (const m of ms) {
    if (negligible(m.moment, big)) zero.push(m.force)
    else if (m.moment > 0) { ccw.items.push(m); ccw.sum += m.moment }
    else { cw.items.push(m); cw.sum -= m.moment }
  }
  const raw = ccw.sum - cw.sum
  return { ccw, cw, zero, net: negligible(raw, Math.max(ccw.sum, cw.sum)) ? 0 : raw }
}

/** Sens de la force cherchée `targetId`, pivot = point de l'autre inconnue `pivotId`. */
export function findSense(ex, pivotId, targetId) {
  const pivot = unknown(ex).find((f) => f.id === pivotId)
  const target = unknown(ex).find((f) => f.id === targetId)
  if (!pivot || !target || pivot.id === target.id) throw new Error('Pivot et force cherchée : deux inconnues différentes')
  const groups = momentGroups(ex, pivot.x)
  const net = groups.net
  const targetSign = net === 0 ? 0 : -Math.sign(net) * Math.sign(target.x - pivot.x)
  return { pivot, target, groups, net, rotation: net > 0 ? 'ccw' : net < 0 ? 'cw' : null, targetSign }
}

/** Deux appuis (R_A, R_D…) : ΣF = 0 et ΣM = 0 → { [idPoint]: valeur } signées. */
export function solveSupports(ex) {
  const [u1, u2] = unknown(ex)
  const k = known(ex)
  const S = k.reduce((s, f) => s + f.value, 0)
  const T = k.reduce((s, f) => s + f.value * f.x, 0)
  const v2 = (S * u1.x - T) / (u2.x - u1.x)
  const v1 = -S - v2
  const sc = Math.abs(S) + Math.abs(T) / Math.abs(u2.x - u1.x)
  const z = (v) => (negligible(v, sc) ? 0 : v)
  return { [u1.id]: z(v1), [u2.id]: z(v2) }
}

/** Encastrement en xe = 0 (gauche) ou L (droite) : réaction A (+ haut) et moment d'encastrement Me (+ = sens positif ↺), ΣM/xe = 0. */
export function solveFixed(ex) {
  const k = known(ex), xe = fixedAt(ex)
  const A = -k.reduce((s, f) => s + f.value, 0)
  const Me = -k.reduce((s, f) => s + f.value * (f.x - xe), 0)
  return { A: negligible(A, 1) ? 0 : A, Me: negligible(Me, 1) ? 0 : Me }
}

/**
 * Charges complètes pour la flexion : { L, forces:[{id,x,value,kind}], couples:[{id,name,x,m}] }.
 * ex.type = 'appuis' (2 inconnues) ou 'encastree' (réaction au point d'encastrement x = 0 ou L + moment M, id = nom du point).
 */
export function fullLoads(ex) {
  if (ex.type === 'encastree') {
    const { A, Me } = solveFixed(ex), p = unknown(ex)[0]
    const forces = ex.forces.map(({ id, x, kind, value }) => ({ id, x, kind, value: kind === 'unknown' ? A : value }))
    return { L: ex.L, forces, couples: [{ id: p.id, name: 'M_' + p.id, x: p.x, m: Me }] }
  }
  const sol = solveSupports(ex)
  const forces = ex.forces.map((f) => ({ id: f.id, x: f.x, kind: f.kind, value: f.kind === 'known' ? f.value : sol[f.id] }))
  return { L: ex.L, forces, couples: [] }
}
