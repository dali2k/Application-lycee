// Flexion plane simple — N, mm, MPa. Convention du cours (Mf, T) :
//   à gauche de G : T = −ΣF , Mf = −ΣM_G      à droite de G : T = +ΣF , Mf = +ΣM_G
// F + = vers le haut ; M_G(F) = F·(x − xG), + = sens positif ↺. Mf > 0 : fibres inférieures tendues.
const PI = Math.PI

/** Coupure en xG. side = 'g' | 'd'. Renvoie les lignes (force, distance, rotation), ΣF, ΣM, T, Mf. */
export function coupe(loads, xG, side) {
  const keep = (x) => (side === 'g' ? x < xG : x > xG)
  const rows = loads.forces.filter((f) => keep(f.x) && f.value !== 0).map((f) => {
    const m = f.value * (f.x - xG)
    return { f, d: Math.abs(f.x - xG), m, rot: m > 0 ? 'ccw' : m < 0 ? 'cw' : null }
  })
  const couples = (loads.couples || []).filter((c) => keep(c.x) && c.m !== 0)
  const sF = rows.reduce((s, r) => s + r.f.value, 0)
  const sM = rows.reduce((s, r) => s + r.m, 0) + couples.reduce((s, c) => s + c.m, 0)
  const sgn = side === 'g' ? -1 : 1
  return { rows, couples, sF, sM, T: sgn * sF || 0, Mf: sgn * sM || 0 }
}

/** T(x) et Mf(x) : limite à gauche de x (after = limite à droite). */
export function efforts(loads, x, after = false) {
  const e = after ? 1e-6 : -1e-6
  const c = coupe(loads, x + e, 'g')
  return { T: c.T, Mf: c.Mf }
}

/** Points des diagrammes (sauts de T inclus) + extrêmes. */
export function diagrammes(loads) {
  const xs = [...new Set([0, loads.L, ...loads.forces.map((f) => f.x)])].filter((x) => x >= 0 && x <= loads.L).sort((a, b) => a - b)
  const T = [], Mf = []
  for (const x of xs) {
    T.push([x, efforts(loads, x, false).T], [x, efforts(loads, x, true).T])
    Mf.push([x, efforts(loads, x, x < loads.L).Mf]) // en x = L : limite à gauche (encastrement à droite : Mf ≠ 0)
  }
  const best = (pts) => pts.reduce((b, p) => (Math.abs(p[1]) > Math.abs(b[1]) ? p : b), pts[0])
  const [xm, mfMax] = best(Mf), [xt, tMax] = best(T)
  return { T, Mf, mfMax, xMf: xm, tMax, xT: xt }
}

// ---------- Moment quadratique par rapport à Gz (axe horizontal passant par G) ----------
export const iRect = (b, h) => (b * h ** 3) / 12
export const iCercle = (d) => (PI * d ** 4) / 64
export const iTube = (D, d) => (PI * (D ** 4 - d ** 4)) / 64
export const iRectCreux = (B, H, t) => iRect(B, H) - iRect(B - 2 * t, H - 2 * t)

/** Section composée de rectangles { b, h, yc } (yc = ordonnée du centre, vers le haut). Huygens : I = Σ(I₀ + S·d²). */
export function composite(parts) {
  const S = parts.reduce((s, p) => s + p.b * p.h, 0)
  const yG = parts.reduce((s, p) => s + p.b * p.h * p.yc, 0) / S
  const rows = parts.map((p) => ({ ...p, S: p.b * p.h, i0: iRect(p.b, p.h), d: p.yc - yG }))
  const I = rows.reduce((s, r) => s + r.i0 + r.S * r.d ** 2, 0)
  const top = Math.max(...parts.map((p) => p.yc + p.h / 2)) - yG
  const bot = yG - Math.min(...parts.map((p) => p.yc - p.h / 2))
  return { S, yG, rows, I, vTop: top, vBot: bot, v: Math.max(top, bot) }
}

/** Profilé en T : semelle b×tf en haut, âme tw×hw dessous. */
export const profilT = (b, tf, tw, hw) =>
  composite([{ b, h: tf, yc: hw + tf / 2 }, { b: tw, h: hw, yc: hw / 2 }])
/** Profilé en I symétrique : 2 semelles b×tf, âme tw×hw. */
export const profilI = (b, tf, tw, hw) =>
  composite([{ b, h: tf, yc: tf / 2 }, { b: tw, h: hw, yc: tf + hw / 2 }, { b, h: tf, yc: tf + hw + tf / 2 }])

/** Propriétés { S, I, v, W } selon la section. Dimensions en mm. */
export function section(id, p) {
  let S, I, v
  if (id === 'rect') { S = p.b * p.h; I = iRect(p.b, p.h); v = p.h / 2 }
  else if (id === 'carre') { S = p.a ** 2; I = iRect(p.a, p.a); v = p.a / 2 }
  else if (id === 'cercle') { S = (PI * p.d ** 2) / 4; I = iCercle(p.d); v = p.d / 2 }
  else if (id === 'tube') { S = (PI * (p.D ** 2 - p.d ** 2)) / 4; I = iTube(p.D, p.d); v = p.D / 2 }
  else if (id === 'creux') { S = p.B * p.H - (p.B - 2 * p.t) * (p.H - 2 * p.t); I = iRectCreux(p.B, p.H, p.t); v = p.H / 2 }
  else {
    const c = id === 'T' ? profilT(p.b, p.tf, p.tw, p.hw) : profilI(p.b, p.tf, p.tw, p.hw)
    S = c.S; I = c.I; v = c.v
  }
  return { S, I, v, W: I / v }
}

// ---------- Contraintes, résistance, flèche (valeurs absolues : pas de faux positifs) ----------
export const sigmaMax = (mf, I, v) => (Math.abs(mf) * v) / I
export const sigmaAt = (mf, I, y) => (mf * y) / I // y > 0 vers le haut : Mf > 0 → compression en haut
export const tauMoy = (t, S) => Math.abs(t) / S
export const rpe = (re, s) => re / s
export const wMini = (mf, rpeMPa) => Math.abs(mf) / rpeMPa
export const dMiniCercle = (mf, rpeMPa) => Math.cbrt((32 * Math.abs(mf)) / (PI * rpeMPa))
export const hMiniRect = (mf, b, rpeMPa) => Math.sqrt((6 * Math.abs(mf)) / (b * rpeMPa))
/** Flèche max : 'centre' = F·L³/(48·E·I) ; 'console' = F·L³/(3·E·I). */
export const fleche = (cas, F, L, E, I) => (Math.abs(F) * L ** 3) / ((cas === 'centre' ? 48 : 3) * E * I)
