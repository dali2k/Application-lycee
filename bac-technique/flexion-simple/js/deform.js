// Déformée de la poutre (forme seule, EI = 1) : EI·y'' = Mf(x), Mf > 0 = fibres inférieures tendues = poutre qui « sourit ».
// Pur (sans DOM). N, mm. y + vers le haut. Pour une flèche réelle en mm : y / (E·I).
import { efforts } from './calc.js'

const mfAt = (loads, x) => efforts(loads, x, x < loads.L).Mf

/**
 * deformee(loads, type, { n = 200 }) → [{ x, y, theta, M }] (EI = 1).
 * type : 'appuis' (y = 0 aux 2 appuis) | 'encastree' (y = y' = 0 à l'encastrement, x = 0 ou L).
 * Intégration exacte pour Mf linéaire par morceaux (les abscisses des forces sont dans la grille).
 */
export function deformee(loads, type, { n = 200 } = {}) {
  const L = loads.L
  const xs = [...new Set([...Array.from({ length: n + 1 }, (_, i) => (i * L) / n), ...loads.forces.map((f) => f.x)])]
    .filter((x) => x >= 0 && x <= L).sort((a, b) => a - b)
  const M = xs.map((x) => mfAt(loads, x))
  const th = [0], y = [0]
  for (let i = 1; i < xs.length; i++) {
    const d = xs[i] - xs[i - 1]
    th.push(th[i - 1] + ((M[i - 1] + M[i]) * d) / 2)
    y.push(y[i - 1] + th[i - 1] * d + ((2 * M[i - 1] + M[i]) * d * d) / 6)
  }
  let a = 0, b = 0 // y' (pente) et y retranchés : y_c = y − (y_a + p·(x − x_a))
  if (type === 'encastree') { // y = y' = 0 à l'encastrement (x = 0 ou x = L)
    const xe = loads.forces.find((f) => f.kind === 'unknown')?.x ?? 0, ie = xs.indexOf(xe)
    b = th[ie]
    a = y[ie] - b * xs[ie]
  } else {
    const sup = loads.forces.filter((f) => f.kind === 'unknown').map((f) => f.x).sort((p, q) => p - q)
    const ia = xs.indexOf(sup[0]), ib = xs.indexOf(sup[sup.length - 1])
    b = (y[ib] - y[ia]) / (xs[ib] - xs[ia])
    a = y[ia] - b * xs[ia]
  }
  return xs.map((x, i) => ({ x, y: y[i] - (a + b * x), theta: th[i] - b, M: M[i] }))
}

/** Flèche de plus grande valeur absolue : { x, y }. */
export function maxDeflection(pts) {
  return pts.reduce((m, p) => (Math.abs(p.y) > Math.abs(m.y) ? { x: p.x, y: p.y } : m), { x: 0, y: 0 })
}

/** Zones de signe de Mf : [{ x0, x1, sign: +1 (sourit) | −1 (pleure) }] et abscisses d'inflexion (Mf change de signe). */
export function zonesFlexion(pts) {
  const eps = 1e-9 * Math.max(1, ...pts.map((p) => Math.abs(p.M)))
  const sg = (v) => (Math.abs(v) < eps ? 0 : Math.sign(v))
  const zones = [], inflex = []
  const push = (x0, x1, s) => {
    if (!s || x1 - x0 < 1e-9) return
    const z = zones[zones.length - 1]
    if (z && z.sign === s && Math.abs(z.x1 - x0) < 1e-9) z.x1 = x1
    else zones.push({ x0, x1, sign: s })
  }
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i], sp = sg(p.M), sq = sg(q.M)
    if (sp * sq < 0) {
      const xc = p.x + ((q.x - p.x) * p.M) / (p.M - q.M)
      push(p.x, xc, sp); push(xc, q.x, sq); inflex.push(xc)
    } else push(p.x, q.x, sp || sq)
  }
  const inner = zones.slice(1).filter((z, i) => z.sign !== zones[i].sign && Math.abs(z.x0 - zones[i].x1) < 1e-6)
  const extra = inner.map((z) => z.x0).filter((x) => !inflex.some((u) => Math.abs(u - x) < 1e-6))
  return { zones, inflex: [...inflex, ...extra].sort((u, v) => u - v) }
}

/** Facteur px par unité de y pour que la flèche max dessinée = frac × zoneH (≈ 30 %). */
export function autoScale(pts, zoneH, frac = 0.3) {
  const m = Math.abs(maxDeflection(pts).y)
  return m < 1e-12 ? 0 : (frac * zoneH) / m
}

/** Abscisses où la pente s'annule (extrema locaux de la flèche), hors extrémités. */
export function penteNulle(pts) {
  const out = []
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i]
    if (p.theta * q.theta < 0) out.push(p.x + ((q.x - p.x) * p.theta) / (p.theta - q.theta))
  }
  return out
}

/** Interpolation linéaire de la déformée en x. */
export function sample(pts, x) {
  let i = pts.findIndex((p) => p.x >= x)
  if (i <= 0) return pts[Math.max(i, 0)]
  const p = pts[i - 1], q = pts[i], t = (x - p.x) / (q.x - p.x || 1)
  return { x, y: p.y + t * (q.y - p.y), theta: p.theta + t * (q.theta - p.theta), M: p.M + t * (q.M - p.M) }
}
