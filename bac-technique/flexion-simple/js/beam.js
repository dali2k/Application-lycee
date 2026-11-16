// Dessin SVG partagé de la poutre : appuis, forces nommées (R_A, F_C), lettres des points, cotes, point G, arcs.
import { svg, arrow } from './svg.js'
import { subText } from './math.js'
import { labelOf, labelLanes, senseOf, pointRows, dimSegments } from './beam-layout.js'

const PITCH = 16 // pas vertical entre deux voies d'étiquettes
const DIM = { stroke: '#7b8794', 'stroke-width': 0.8, class: 'dim' }

/** Mur d'encastrement hachuré en x (px) ; right = encastrement à droite (mur à droite de la poutre). */
export function drawWall(s, x, y0, right = false) {
  const d = right ? 1 : -1
  svg('rect', { x: right ? x : x - 12, y: y0 - 28, width: 12, height: 56, fill: '#8a96a6' }, s)
  for (let k = -3; k <= 3; k++) svg('line', { x1: x + d * 12, y1: y0 + k * 8, x2: x + d * 20, y2: y0 + k * 8 + 8, stroke: '#5a6676' }, s)
}

/** Appui simple : triangle VIDE + sol hachuré (symbole normalisé), distinct d'une tête de flèche (triangle plein). */
function drawSupport(s, x, y0) {
  const g = svg('g', { class: 'support' }, s)
  svg('polygon', { points: `${x},${y0 + 5} ${x - 9},${y0 + 21} ${x + 9},${y0 + 21}` }, g)
  svg('line', { x1: x - 13, y1: y0 + 21, x2: x + 13, y2: y0 + 21 }, g)
  for (const t of [-11, -4, 3, 10]) svg('line', { x1: x + t, y1: y0 + 21, x2: x + t - 4, y2: y0 + 25 }, g)
}

/**
 * drawBeam(s, loads, o) — dessine dans le <svg> `s`.
 * loads : { L, forces:[{id,x,kind,value|undefined}], couples? } (value indéfinie = inconnue, flèche pointillée)
 * o : { type:'appuis'|'encastree', W=560, y0=110, mx=40, xG?, hl?: id, dirs?: {id:±1}, dims?: bool, couples?: bool }
 * Renvoie { sx(x_mm→px), y0, pxN, top (y min utilisé), bottom (y max utilisé) }.
 */
export function drawBeam(s, loads, o = {}) {
  const W = o.W ?? 560, y0 = o.y0 ?? 110, mx = o.mx ?? 40
  const sx = (x) => mx + (x / loads.L) * (W - 2 * mx)
  const vmax = Math.max(1, ...loads.forces.map((f) => Math.abs(f.value ?? 0)))
  const pxN = 55 / vmax
  const pos = labelLanes(loads.forces, sx, o.dirs)
  svg('rect', { x: sx(0), y: y0 - 5, width: sx(loads.L) - sx(0), height: 10, fill: '#c9d3df', stroke: '#5a6676' }, s)
  if (o.type === 'encastree') {
    const xe = loads.forces.find((f) => f.kind === 'unknown')?.x ?? 0 // encastrement à gauche (0) ou à droite (L)
    drawWall(s, sx(xe), y0, xe > 0)
  }
  let top = y0 - 28, below = y0 + 28
  for (const f of loads.forces) {
    const x = sx(f.x), v = f.value, react = f.kind === 'unknown'
    if (react && o.type !== 'encastree') {
      drawSupport(s, x, y0)
    }
    const dir = senseOf(f, o.dirs)
    const up = v === undefined ? dir !== -1 : v > 0
    const len = v === undefined ? 40 : Math.max(14, Math.abs(v) * pxN)
    const open = v === undefined && !dir // sens pas encore trouvé : trait sans pointe, le sens n'est pas soufflé
    const g = open ? svg('g', {}, s) : up ? arrow(s, x, y0 + 28 + len, x, y0 + 28, 'arr') : arrow(s, x, y0 - 28 - len, x, y0 - 8, 'arr')
    if (open) svg('line', { x1: x, y1: y0 + 28, x2: x, y2: y0 + 28 + len }, g)
    g.setAttribute('class', 'arr ' + (react ? 'f-react' : 'f-known') + (o.hl === f.id ? ' hl' : ''))
    if (open) g.setAttribute('stroke-dasharray', '4 3')
    const { base, sub, suffix } = labelOf(f, o.dirs)
    const lane = pos[f.id].lane, shift = lane * PITCH
    const ty = up ? y0 + 28 + len + 14 + shift : y0 - 28 - len - 6 - shift
    if (lane) svg('line', { x1: x, y1: up ? y0 + 28 + len : y0 - 28 - len, x2: x, y2: up ? ty - 11 : ty + 3, stroke: '#7b8794', 'stroke-width': 0.8 }, s)
    subText(s, { base, sub, suffix, x, y: ty, anchor: 'middle', cls: 'lbl2' })
    if (up) below = Math.max(below, ty + 4); else top = Math.min(top, ty - 12)
  }
  // lettres des points sous la poutre
  const { lane: rows, count } = pointRows(loads.forces, sx)
  const py = below + 20
  for (const f of loads.forces) {
    svg('text', { x: sx(f.x), y: py + rows[f.id] * 16, 'text-anchor': 'middle', class: 'lbl pt' }, s).textContent = f.id
  }
  let y = py + Math.max(count - 1, 0) * 16 + 14
  if (o.dims) y = drawDims(s, loads, sx, y)
  const yc = y + 4
  svg('line', { x1: sx(0), y1: yc, x2: sx(loads.L), y2: yc, stroke: '#7b8794', 'stroke-width': 0.8 }, s)
  svg('text', { x: (sx(0) + sx(loads.L)) / 2, y: yc + 14, 'text-anchor': 'middle', class: 'lbl2' }, s).textContent = `L = ${loads.L} mm`
  if (o.couples && loads.couples?.length) drawCouples(s, loads.couples, sx, y0)
  if (o.xG !== undefined) drawG(s, sx(o.xG), y0, o.xG)
  return { sx, y0, pxN, top: Math.min(top, y0 - 100), bottom: yc + 20 }
}

/** Chaîne de cotes AB, BC… entre points consécutifs ; renvoie l'ordonnée libre en dessous. */
function drawDims(s, loads, sx, y) {
  const { segs, lanes } = dimSegments(loads.forces, sx)
  const yy = y + 6
  for (const g of segs) {
    svg('line', { x1: g.x1, y1: yy, x2: g.x2, y2: yy, ...DIM }, s)
    for (const x of [g.x1, g.x2]) {
      svg('line', { x1: x, y1: yy - 5, x2: x, y2: yy + 5, ...DIM }, s)
      svg('line', { x1: x - 3, y1: yy + 3, x2: x + 3, y2: yy - 3, ...DIM }, s)
    }
    svg('text', { x: (g.x1 + g.x2) / 2, y: yy + 16 + g.lane * 15, 'text-anchor': 'middle', class: 'lbl2 dimt' }, s).textContent = `${g.name} = ${g.value}`
  }
  return yy + 8 + Math.max(lanes, 1) * 15
}

/** Moment d'encastrement M_A : arc fléché + nom (signe de m → sens). */
function drawCouples(s, couples, sx, y0) {
  for (const c of couples) {
    const x = sx(c.x), right = x > sx(0) + 1 // à droite : nom placé à gauche de l'arc
    rotArc(s, x, y0, 18, c.m >= 0 ? 'ccw' : 'cw', 'rot couple')
    subText(s, { base: 'M', sub: c.id, x: right ? x - 24 : x + 24, y: y0 - 22, anchor: right ? 'end' : 'start', cls: 'lbl2' })
  }
}

/** Point G (curseur de coupure) : trait vertical + disque + étiquette. */
export function drawG(s, x, y0, xmm) {
  svg('line', { x1: x, y1: y0 - 95, x2: x, y2: y0 + 100, stroke: '#b32d00', 'stroke-width': 1.4, 'stroke-dasharray': '5 3' }, s)
  svg('circle', { cx: x, cy: y0, r: 6, fill: '#b32d00', stroke: '#fff', 'stroke-width': 1.5, class: 'gpoint' }, s)
  svg('text', { x, y: y0 - 100, 'text-anchor': 'middle', class: 'lbl', fill: '#b32d00' }, s).textContent =
    xmm === undefined ? 'G' : `G (x = ${Math.round(xmm)} mm)`
}

/** Arc fléché de rotation autour de (cx,cy), rayon r. dir : 'ccw' (anti-horaire à l'écran) | 'cw' (horaire). */
export function rotArc(parent, cx, cy, r, dir, cls = 'rot') {
  const cw = dir === 'cw'
  const a0 = cw ? -70 : 250, a1 = cw ? 200 : -20 // angles SVG (y vers le bas : angle croissant = horaire)
  const P = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)]
  const [x0, y0] = P(a0), [x1, y1] = P(a1)
  const g = svg('g', { class: cls }, parent)
  svg('path', { d: `M${x0} ${y0}A${r} ${r} 0 1 ${cw ? 1 : 0} ${x1} ${y1}`, fill: 'none', 'stroke-width': 2 }, g)
  const a = (a1 * Math.PI) / 180, k = cw ? 1 : -1
  const ux = -Math.sin(a) * k, uy = Math.cos(a) * k // tangente dans le sens du mouvement
  const nx = -uy, ny = ux
  svg('polygon', {
    points: `${x1 + ux * 7},${y1 + uy * 7} ${x1 - ux * 3 + nx * 5},${y1 - uy * 3 + ny * 5} ${x1 - ux * 3 - nx * 5},${y1 - uy * 3 - ny * 5}`,
    stroke: 'none',
  }, g)
  return g
}
