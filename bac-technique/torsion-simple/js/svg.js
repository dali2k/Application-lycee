// Aides SVG / DOM communes aux onglets.
const NS = 'http://www.w3.org/2000/svg'
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

export function svg(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag)
  for (const k in attrs) e.setAttribute(k, attrs[k])
  if (parent) parent.appendChild(e)
  return e
}

export function h(tag, attrs = {}, parent, html) {
  const e = document.createElement(tag)
  for (const k in attrs) k === 'class' ? (e.className = attrs[k]) : e.setAttribute(k, attrs[k])
  if (html != null) e.innerHTML = html
  if (parent) parent.appendChild(e)
  return e
}

export const fmt = (v, n = 2) =>
  Number.isFinite(v) ? v.toLocaleString('fr-FR', { maximumFractionDigits: n }) : '—'

/** Curseur étiqueté. onInput(valeur) appelé à chaque changement. */
export function slider(parent, { label, min, max, step = 1, value, unit = '', digits = 3, onInput }) {
  const w = h('label', { class: 'sl' }, parent)
  const t = h('span', {}, w)
  const i = h('input', { type: 'range', min, max, step, value }, w)
  const upd = () => { t.innerHTML = `${label} = <b>${fmt(+i.value, digits)}</b> ${unit}` }
  i.addEventListener('input', () => { upd(); onInput(+i.value) })
  upd()
  return { get: () => +i.value, set(v) { i.value = v; upd(); onInput(+i.value) }, input: i }
}

/** Boucle requestAnimationFrame ; fn(secondes écoulées). */
export function loop(fn) {
  let id = 0, t0 = 0
  const f = (t) => { if (!t0) t0 = t; fn((t - t0) / 1000); id = requestAnimationFrame(f) }
  return {
    start() { if (!id) { t0 = 0; id = requestAnimationFrame(f) } },
    stop() { cancelAnimationFrame(id); id = 0 },
    get on() { return !!id },
  }
}

/** Flèche (ligne + tête) de (x1,y1) vers (x2,y2). */
export function arrow(parent, x1, y1, x2, y2, cls = 'arr') {
  const g = svg('g', { class: cls }, parent)
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy)
  if (L < 1) return g
  const ux = dx / L, uy = dy / L, hl = Math.min(8, L * 0.5), hw = hl * 0.45
  svg('line', { x1, y1, x2: x2 - ux * hl * 0.6, y2: y2 - uy * hl * 0.6 }, g)
  svg('polygon', {
    points: `${x2},${y2} ${x2 - ux * hl - uy * hw},${y2 - uy * hl + ux * hw} ${x2 - ux * hl + uy * hw},${y2 - uy * hl - ux * hw}`,
  }, g)
  return g
}
