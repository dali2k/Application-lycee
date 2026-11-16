// État partagé entre TOUS les onglets : l'exercice (poutre + forces) défini en onglet 1 et l'avancement du parcours guidé.
// Une seule poutre pour toute l'application ; sauvegardé dans localStorage pour survivre à un rechargement (si disponible).
import { EXAMPLES, validateExercise } from './statics.js'

const KEY = 'flexion-simple.v1'
const read = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (d && d.ex && !validateExercise(d.ex).length) return d
  } catch { /* stockage indisponible : on repart de l'exemple */ }
  return null
}
const saved = read()
let current = saved ? saved.ex : EXAMPLES.appuis
let session = saved ? saved.sess : null // avancement de l'onglet 1 (null = pas commencé)
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ ex: current, sess: session })) } catch { /* ignoré */ } }

export const getEx = () => current
/** Nouvel exercice : remplace la poutre pour tous les onglets et remet le parcours à zéro. */
export const setEx = (ex) => { current = ex; session = null; save() }
export const getSession = () => session
export const setSession = (sess) => { session = sess; save() }
