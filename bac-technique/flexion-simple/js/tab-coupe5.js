// Onglet 2 : clic sur une force → le morceau qui porte cette force tourne autour de G dans le sens de son moment,
// marque une pause, puis revient. Le schéma affiche le sens : ↺ sens positif (+), ↻ sens négatif (−).
// Toutes les forces sont cliquables, même celles du côté non étudié : l'élève voit que le sens dépend de la position de G
// (l'étiquette se met à jour en direct quand on glisse G de l'autre côté de la force).
// API : spinner(msgEl) → { attach(ctx), stop() }. Importé par tab-coupe.js (attach appelé à chaque redessin).
import { svg, reduced } from './svg.js'
import { rotArc } from './beam.js'
import { forceHtml, subText } from './math.js'
import { forceName } from './statics.js'

const ANG = 12, T_IN = 750, T_HOLD = 900, T_OUT = 750, TOTAL = T_IN + T_HOLD + T_OUT
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2)
const SENS = {
  ccw: { arrow: '↺', txt: 'sens positif (+)', html: '<b>sens positif ↺</b> : moment <b>positif (+)</b>' },
  cw: { arrow: '↻', txt: 'sens négatif (−)', html: '<b>sens négatif ↻</b> : moment <b>négatif (−)</b>' },
}

export function spinner(msg) {
  let raf = 0, cur = null, ctx = null // cur = { id, t0 } ; ctx = dernier dessin

  const k = (t) => (t < T_IN ? ease(t / T_IN) : t < T_IN + T_HOLD ? 1 : t < TOTAL ? 1 - ease((t - T_IN - T_HOLD) / T_OUT) : 0)
  const item = () => cur && ctx && ctx.items.find((q) => q.f.id === cur.id && q.rot)
  /** Applique l'angle courant au morceau qui porte la force ; renvoie true tant que l'animation continue. */
  function apply(now) {
    const it = item()
    if (!it || reduced) return false
    const t = now - cur.t0, a = (it.rot === 'ccw' ? -1 : 1) * ANG * k(t) // SVG : angle + = horaire à l'écran (y vers le bas)
    const g = it.inside ? ctx.piece : ctx.other, run = t < TOTAL
    g.setAttribute('transform', `rotate(${a.toFixed(2)} ${ctx.gx} ${ctx.y0})`)
    g.classList.toggle('spinning', run)
    return run
  }
  function frame(now) { raf = apply(now) ? requestAnimationFrame(frame) : 0 }
  const where = (it) => (it.inside ? 'le morceau étudié' : `le morceau de ${ctx.otherName} (non étudié : force non comptée)`)
  function say(it) {
    msg.innerHTML = it ? `${forceHtml(it.f)} fait tourner ${where(it)} autour de G dans le ${SENS[it.rot].html}.`
      : `${forceHtml(ctx.items.find((q) => q.f.id === cur.id).f)} passe par G : moment nul, pas de rotation.`
  }
  function label() {
    const it = item()
    say(it)
    if (!it) return
    const S = SENS[it.rot], { base, sub } = forceName(it.f), g = svg('g', { class: 'spinlbl rot ' + it.rot }, ctx.s)
    rotArc(g, ctx.gx, ctx.y0, 26, it.rot, 'rot ' + it.rot + ' spinarc')
    subText(g, { base: `${S.arrow} ${base}`, sub, suffix: ` fait tourner autour de G : ${S.txt}${it.inside ? '' : ' — hors du côté étudié'}`, x: ctx.W / 2, y: ctx.top - 26, cls: 'spintxt' })
  }
  function play(it) {
    cur = { id: it.f.id, t0: performance.now() }
    ctx.redraw() // redessine avec l'étiquette ; frame() anime ensuite le morceau
    cancelAnimationFrame(raf); raf = reduced ? 0 : requestAnimationFrame(frame)
  }

  return {
    /** ctx = { s, piece (morceau étudié), other (morceau non étudié), otherName, gx, y0, top, bottom, W, sx, items:[{f,rot,inside}], redraw }. */
    attach(c) {
      ctx = c
      for (const it of c.items) {
        if (!it.rot) continue // force en G : pas de rotation
        const xf = c.sx(it.f.x), { base, sub } = forceName(it.f)
        const hit = svg('rect', { x: xf - 13, y: c.top, width: 26, height: c.bottom - c.top, rx: 6, class: 'fhit' + (it.inside ? '' : ' out'), tabindex: 0, role: 'button',
          'aria-label': `Faire tourner autour de G : ${base} indice ${sub}${it.inside ? '' : ' (côté non étudié)'}` }, c.s)
        svg('title', {}, hit).textContent = 'Clique : rotation autour de G'
        hit.addEventListener('click', () => play(it))
        hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); play(it) } })
      }
      if (cur) { label(); if (raf) apply(performance.now()) }
    },
    stop() { cancelAnimationFrame(raf); raf = 0 },
  }
}
