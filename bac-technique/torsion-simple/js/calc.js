// Formules de torsion simple — unités : N, mm, MPa (N/mm²), rad.
const PI = Math.PI

/** Moment quadratique polaire d'un cercle plein (mm⁴). */
export const ioPlein = (d) => (PI * d ** 4) / 32

/** Moment quadratique polaire d'un tube D/d (mm⁴). */
export const ioTube = (D, d) => (PI * (D ** 4 - d ** 4)) / 32

/** Module de torsion W = Io / ρmax (mm³). */
export const moduleTorsion = (io, rhoMax) => io / rhoMax

/** Contrainte tangentielle à la distance ρ : τ = Mt·ρ / Io (MPa). */
export const tau = (mt, io, rho) => (mt * rho) / io

/** Angle unitaire θ = Mt / (G·Io) (rad/mm). */
export const theta = (mt, g, io) => mt / (g * io)

/** Angle de torsion α = θ·L (rad). */
export const alpha = (th, L) => th * L

export const radToDeg = (r) => (r * 180) / PI
export const degToRad = (d) => (d * PI) / 180

/** daN/mm² → MPa (G = 8000 daN/mm² = 80 000 MPa). */
export const daNmm2ToMPa = (v) => v * 10

/** Vitesse angulaire ω (rad/s) depuis N (tr/min). */
export const omega = (nTrMin) => (2 * PI * nTrMin) / 60

/** Couple Mt (N·mm) depuis P (W) et N (tr/min). */
export const coupleDepuisPuissance = (pW, nTrMin) => (pW / omega(nTrMin)) * 1000

/** Résistance pratique au glissement Rpg = Reg / s (MPa). */
export const rpg = (reg, s) => reg / s

/** Diamètre mini (arbre plein) par résistance : τmax = 16·Mt/(π·d³) ≤ Rpg. */
export const dMiniResistance = (mt, rpgMPa) => Math.cbrt((16 * mt) / (PI * rpgMPa))

/** Diamètre mini (arbre plein) par rigidité : θ ≤ θlim. */
export const dMiniRigidite = (mt, g, thetaLim) => Math.pow((32 * mt) / (PI * g * thetaLim), 0.25)

/** Conversion θlim : degrés par mètre → rad/mm. */
export const thetaLimDegParM = (degM) => degToRad(degM) / 1000

/** Moment quadratique d'un rectangle b×h par rapport à l'axe parallèle à b : b·h³/12. */
export const iRect = (b, h) => (b * h ** 3) / 12

// --- Tube D/d : conditions D⁴ − d⁴ ≥ c·D (résistance) et D⁴ − d⁴ ≥ K (rigidité) ---
export const tubeConsts = (mt, rpgMPa, G, thetaLim) => {
  const m = Math.abs(mt)
  return { c: (16 * m) / (PI * rpgMPa), K: (32 * m) / (PI * G * thetaLim) }
}

/** D fixé → d maximal. res/rig = null si aucun d ne convient ; retenu = le plus petit des deux. */
export function dMaxTube(D, mt, rpgMPa, G, thetaLim) {
  const { c, K } = tubeConsts(mt, rpgMPa, G, thetaLim)
  const root = (x) => (x > 0 ? Math.pow(x, 0.25) : null)
  const res = root(D ** 4 - c * D), rig = root(D ** 4 - K)
  return { res, rig, retenu: res !== null && rig !== null ? Math.min(res, rig) : null }
}

/** d fixé → D minimal. res par bissection (quartique), rig en forme fermée ; retenu = le plus grand. */
export function DMinTube(d, mt, rpgMPa, G, thetaLim) {
  const { c, K } = tubeConsts(mt, rpgMPa, G, thetaLim)
  const rig = Math.pow(d ** 4 + K, 0.25)
  const f = (D) => D ** 4 - c * D - d ** 4 // convexe, f(d) ≤ 0 : une seule racine au-dessus de d
  let lo = d, hi = Math.max(d, 1) * 2
  while (f(hi) < 0 && hi < 1e7) hi *= 2
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid }
  return { res: hi, rig, retenu: Math.max(hi, rig) }
}
