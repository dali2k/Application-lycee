// Exercice de statique : normalisation (tri par x, lettres de points), noms, validation, exemples, tirage.
// Porté de l'app « Statique des solides » 3ème (labels.ts, validate.ts, examples.ts, generate.ts). N, mm.
// Force : { id, x, kind: 'known'|'unknown', value? } ; value signée, + = vers le haut.

export const POINT_LETTERS = ['A', 'B', 'C', 'D', 'E']

/** Lettre par défaut du i-ème point (tri par x). */
export const defaultLetter = (i) => POINT_LETTERS[i] ?? `P${i + 1}`
/** Nom de point valide : une lettre puis lettres/chiffres, 3 caractères max (sûr en HTML et LaTeX). */
export const NAME_RE = /^[A-Za-z][A-Za-z0-9]{0,2}$/

/** Trie les forces par x croissant (stable, NaN en dernier) ; id = nom choisi (f.name) sinon lettre par défaut. */
export function normalizeExercise(ex) {
  const nan = (v) => (Number.isNaN(v) ? 1 : 0)
  const forces = [...ex.forces]
    .sort((a, b) => nan(a.x) - nan(b.x) || (a.x < b.x ? -1 : a.x > b.x ? 1 : 0))
    .map(({ name, ...f }, i) => ({ ...f, id: String(name ?? '').trim() || defaultLetter(i) }))
  return { ...ex, forces }
}

/** R pour une réaction (inconnue), F pour une force connue ; indice = lettre du point. */
export const forceName = (f) => ({ base: f.kind === 'unknown' ? 'R' : 'F', sub: f.id })

/** Texte brut avec marqueur d'indice : 'F_C', 'R_A'. */
export function forceText(f) {
  const { base, sub } = forceName(f)
  return `${base}_${sub}`
}

/** Liste des erreurs (français) ; vide = exercice valide. */
export function validateExercise(ex) {
  const errors = []
  const fixed = ex.type === 'encastree'
  const nUnknown = fixed ? 1 : 2
  const [lo, hi] = fixed ? [2, 5] : [3, 5]
  if (!(ex.L > 0)) errors.push('La longueur de la poutre doit être > 0 mm.')
  if (ex.forces.length < lo || ex.forces.length > hi) errors.push(`Il faut ${lo} à ${hi} forces.`)
  if (new Set(ex.forces.map((f) => f.id)).size !== ex.forces.length) errors.push('Deux points ne peuvent pas avoir le même nom.')
  for (const f of ex.forces) {
    if (typeof f.id !== 'string' || !NAME_RE.test(f.id)) { errors.push('Nom de point invalide : une lettre puis lettres ou chiffres (3 caractères max).'); continue }
    if (!Number.isFinite(f.x) || f.x < 0 || f.x > ex.L) errors.push(`${f.id} : x doit être entre 0 et ${ex.L} mm.`)
  }
  for (const f of ex.forces.filter((g) => g.kind === 'known')) {
    if (!Number.isFinite(f.value) || f.value === 0) errors.push(`${f.id} : intensité connue non nulle requise.`)
  }
  const seen = new Set(), dup = new Set()
  for (const f of ex.forces) {
    if (Number.isFinite(f.x) && seen.has(f.x)) dup.add(f.x)
    seen.add(f.x)
  }
  for (const x of dup) errors.push(`Deux forces ne peuvent pas être au même point (x = ${x}).`)
  const unk = ex.forces.filter((f) => f.kind === 'unknown')
  if (unk.length !== nUnknown) errors.push(`Il faut exactement ${nUnknown} force${nUnknown > 1 ? 's' : ''} inconnue${nUnknown > 1 ? 's' : ''}.`)
  if (fixed && unk.some((f) => f.x !== 0 && f.x !== ex.L)) errors.push(`L'encastrement (force inconnue) doit être à une extrémité : x = 0 mm (à gauche) ou x = ${ex.L} mm (à droite).`)
  return errors
}

/** Abscisse de l'encastrement (poutre encastrée) : position de la force inconnue, 0 (gauche) ou L (droite). Marche aussi pour loads. */
export const fixedAt = (ex) => ex.forces.find((f) => f.kind === 'unknown')?.x ?? 0

const A = (x) => ({ x, kind: 'unknown' })
const F = (x, value) => ({ x, kind: 'known', value })
const RAW = {
  appuis: { title: 'Deux appuis, 2 charges', type: 'appuis', L: 1000, forces: [A(0), A(1000), F(300, -220), F(700, -1120)] },
  encastree: { title: 'Poutre encastrée, 2 charges', type: 'encastree', L: 1000, forces: [A(0), F(400, -300), F(1000, -200)] },
  surplomb: { title: 'Porte-à-faux', type: 'appuis', L: 1500, forces: [A(300), A(1200), F(0, -600), F(750, -200)] },
  mixte: { title: 'Cinq points, charges mixtes', type: 'appuis', L: 2000, forces: [A(200), A(1600), F(800, -300), F(1200, 150), F(1900, -400)] },
  libre: { title: 'Appuis aux extrémités, 3 charges', type: 'appuis', L: 1000, forces: [A(0), A(1000), F(400, -300), F(500, 200), F(700, 150)] },
  nulle: { title: 'Réaction nulle', type: 'appuis', L: 1000, forces: [A(0), F(200, -100), F(500, 40), A(900)] },
  console4: { title: 'Encastrée, 4 points', type: 'encastree', L: 1500, forces: [A(0), F(500, -250), F(900, 120), F(1500, -180)] },
  droite: { title: 'Encastrée à droite, 2 charges', type: 'encastree', L: 1000, forces: [F(0, -200), F(600, -300), A(1000)] },
}

/** Exemples précalculés : forces triées par x, nommées par lettres de points. */
export const EXAMPLES = Object.fromEntries(Object.entries(RAW).map(([k, e]) => [k, normalizeExercise(e)]))
export const EXAMPLE_LIST = Object.values(EXAMPLES)

const rng = (seed) => {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** Moment net (+ ccw) des forces connues autour de xp. */
const netAbout = (ex, xp) => ex.forces.filter((f) => f.kind === 'known').reduce((s, f) => s + f.value * (f.x - xp), 0)

/** Exercice aléatoire valide, normalisé (graine entière). type : 'appuis' (défaut) | 'encastree'. */
export function randomExercise(seed, type = 'appuis') {
  const r = rng(seed), pick = (n) => Math.floor(r() * n), STEP = 50
  for (let n = 0; n < 1000; n++) {
    const L = (2 + pick(5)) * 500, slots = L / STEP, used = new Set()
    const slot = () => { let s = pick(slots + 1); while (used.has(s)) s = pick(slots + 1); used.add(s); return s * STEP }
    const forces = [], xe = r() < 0.5 ? 0 : L // encastrement à gauche ou à droite
    if (type === 'encastree') { used.add(xe / STEP); forces.push(A(xe)) } else forces.push(A(slot()), A(slot()))
    const nk = type === 'encastree' ? 1 + pick(4) : 1 + pick(3)
    for (let i = 0; i < nk; i++) {
      const mag = (1 + pick(50)) * 10
      forces.push(F(slot(), r() < 0.5 ? -mag : mag))
    }
    const ex = normalizeExercise({ type, L, forces })
    const ok = type === 'encastree' ? netAbout(ex, xe) !== 0 : ex.forces.filter((f) => f.kind === 'unknown').every((p) => netAbout(ex, p.x) !== 0)
    if (ok && validateExercise(ex).length === 0) return ex
  }
  return EXAMPLES[type]
}
