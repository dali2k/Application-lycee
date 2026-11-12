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
