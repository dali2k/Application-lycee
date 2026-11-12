// Sections étudiées + calcul de τmax et θ pour chacune.
import { ioPlein, ioTube } from './calc.js'

// Coefficients de Saint-Venant, rectangle plein (h/b, α, β) — b = petit côté, h = grand côté.
// τmax = Mt/(α·h·b²) ; θ = Mt/(β·h·b³·G).  Valeurs indicatives de tables de RDM :
// à remplacer par celles du cours si elles diffèrent.
export const TABLE_RECT = [
  [1, 0.208, 0.141], [1.5, 0.231, 0.196], [2, 0.246, 0.229], [3, 0.267, 0.263],
  [4, 0.282, 0.281], [6, 0.299, 0.299], [10, 0.312, 0.312],
]

export function coefRect(ratio) {
  const r = Math.min(Math.max(ratio, 1), 10)
  for (let i = 1; i < TABLE_RECT.length; i++) {
    const [r1, a1, b1] = TABLE_RECT[i]
    if (r <= r1) {
      const [r0, a0, b0] = TABLE_RECT[i - 1]
      const k = (r - r0) / (r1 - r0)
      return { a: a0 + k * (a1 - a0), be: b0 + k * (b1 - b0) }
    }
  }
  return { a: 0.312, be: 0.312 }
}

// dims : [clé, libellé, min, max, défaut]
export const SECTIONS = {
  plein: { label: 'Cercle plein', circ: true, dims: [['d', 'd', 10, 80, 40]] },
  tube: { label: 'Tube (couronne)', circ: true, dims: [['D', 'D', 20, 100, 60], ['d', 'd', 5, 90, 40]] },
  rect: { label: 'Rectangle / carré plein', dims: [['b', 'b', 10, 60, 30], ['h', 'h', 10, 100, 60]] },
  rectcreux: { label: 'Rectangle / carré creux', dims: [['b', 'b', 20, 60, 40], ['h', 'h', 20, 100, 60], ['t', 'épaisseur t', 2, 10, 4]] },
}

/** Dimensions normalisées (d < D, b ≤ h, t < b/2). */
export function norm(id, p) {
  if (id === 'tube') return { D: p.D, d: Math.min(p.d, p.D - 2) }
  if (id === 'rect') return { b: Math.min(p.b, p.h), h: Math.max(p.b, p.h) }
  if (id === 'rectcreux') {
    const b = Math.min(p.b, p.h), h = Math.max(p.b, p.h)
    return { b, h, t: Math.min(p.t, b / 2 - 1) }
  }
  return { ...p }
}

/** Mt en N·mm, G en MPa. Renvoie { tauMax, tauMin, theta, area, io?, w? }. */
export function compute(id, p0, Mt, G) {
  const p = norm(id, p0)
  if (id === 'plein') {
    const io = ioPlein(p.d), w = io / (p.d / 2)
    return { io, w, tauMax: Mt / w, tauMin: 0, theta: Mt / (G * io), area: (Math.PI * p.d ** 2) / 4 }
  }
  if (id === 'tube') {
    const io = ioTube(p.D, p.d), w = io / (p.D / 2)
    return { io, w, tauMax: Mt / w, tauMin: (Mt * p.d) / 2 / io, theta: Mt / (G * io), area: (Math.PI * (p.D ** 2 - p.d ** 2)) / 4 }
  }
  if (id === 'rect') {
    const { a, be } = coefRect(p.h / p.b)
    return { tauMax: Mt / (a * p.h * p.b ** 2), tauMin: 0, theta: Mt / (be * p.h * p.b ** 3 * G), area: p.b * p.h }
  }
  // rectangle creux à paroi mince (formules de Bredt)
  const Am = (p.b - p.t) * (p.h - p.t), per = 2 * (p.b - p.t + p.h - p.t)
  return {
    tauMax: Mt / (2 * Am * p.t), tauMin: Mt / (2 * Am * p.t),
    theta: (Mt * per) / (4 * Am * Am * G * p.t), area: p.b * p.h - (p.b - 2 * p.t) * (p.h - 2 * p.t),
  }
}
