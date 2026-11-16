// Disposition dynamique du dessin de poutre (portée de beamLayout.ts / DimChain.tsx de la 3ème). Fonctions pures.

/** Placement glouton en voies : chaque intervalle va dans la 1re voie dont le dernier bord droit ne le touche pas. */
export function assignLanes(spans) {
  const ends = [], lane = {}
  for (const s of [...spans].sort((a, b) => a.lo - b.lo)) {
    let k = ends.findIndex((e) => e <= s.lo)
    if (k < 0) k = ends.length
    ends[k] = s.hi
    lane[s.id] = k
  }
  return { lane, count: ends.length }
}

export const CHAR_W = 6.6 // largeur moyenne d'un caractère (police 12 px)
export const textW = (n) => n * CHAR_W + 8

/** Sens d'une force : 1 = haut, −1 = bas, 0 = inconnue sans sens trouvé. */
export function senseOf(f, dirs = {}) {
  if (f.kind === 'unknown' && f.value === undefined) return dirs[f.id] ?? 0
  return Math.sign(f.value)
}

/** Étiquette d'une force : { base, sub, suffix, chars }. « R_A ? », « R_A ↑ », « F_C = 220 N ». */
export function labelOf(f, dirs = {}) {
  const base = f.kind === 'unknown' ? 'R' : 'F'
  const s = senseOf(f, dirs)
  let suffix
  if (f.kind === 'known') suffix = ` = ${Math.abs(f.value).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} N`
  else suffix = s === 0 ? ' ?' : s > 0 ? ' ↑' : ' ↓'
  return { base, sub: f.id, suffix, chars: 2 + suffix.length }
}

/** Voies d'étiquettes par côté (flèche vers le haut = étiquette en bas), sans chevauchement. */
export function labelLanes(forces, sx, dirs) {
  const pos = {}
  for (const side of ['top', 'bottom']) {
    const grp = forces.filter((f) => (senseOf(f, dirs) >= 0) === (side === 'bottom'))
    const { lane } = assignLanes(grp.map((f) => {
      const w = textW(labelOf(f, dirs).chars), x = sx(f.x)
      return { id: f.id, lo: x - w / 2, hi: x + w / 2 }
    }))
    grp.forEach((f) => { pos[f.id] = { side, lane: lane[f.id] } })
  }
  return pos
}

/** Lettres des points sous la poutre : rangées (si deux lettres se touchent). */
export function pointRows(forces, sx) {
  return assignLanes(forces.map((f) => ({ id: f.id, lo: sx(f.x) - 10, hi: sx(f.x) + 10 })))
}

/** Cotes entre points consécutifs : { segs:[{ name:'AB', value:'300 mm', x1, x2, lane }], lanes }. */
export function dimSegments(forces, sx) {
  const pts = [...forces].sort((a, b) => a.x - b.x), ends = [], segs = []
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    if (b.x === a.x) continue
    const x1 = sx(a.x), x2 = sx(b.x), mid = (x1 + x2) / 2
    const name = `${a.id}${b.id}`, value = `${b.x - a.x} mm`
    const w = textW(`${name} = ${value}`.length)
    let lane = 0
    while (lane < ends.length && ends[lane] > mid - w / 2) lane++
    ends[lane] = mid + w / 2
    segs.push({ name, value, x1, x2, lane })
  }
  return { segs, lanes: ends.length }
}
