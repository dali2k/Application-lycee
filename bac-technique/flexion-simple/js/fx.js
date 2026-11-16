// Formatage commun : nombres signés, sens de rotation, lecture de saisie.
import { fmt } from './svg.js'

export const sg = (v, n = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), n)
// Nomenclature unique du programme : sens positif (+) ↺ et sens négatif (−) ↻.
export const ROT = { ccw: '↺ sens positif', cw: '↻ sens négatif' }
export const parseNum = (s) => parseFloat(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-'))
