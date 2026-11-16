// Onglet 2 : coupure — point G glissant, distance et sens de rotation de chaque force par rapport à G.
import { svg, h, slider, loop, fmt, reduced } from './svg.js'
import { drawBeam, drawG, rotArc } from './beam.js'
import { fullLoads, forceName } from './statics.js'
import { diagrammes } from './calc.js'
import { subText, renderTex } from './math.js'
import { getEx } from './state.js'
import { report, study } from './tab-coupe2.js'
import { drawCurves } from './tab-coupe3.js'
import { origin, distExpr } from './tab-coupe4.js'
import { exBanner } from './exbanner.js'
import { spinner } from './tab-coupe5.js'

const W = 560, MX = 40, Y0 = 130, ROW = 24, AMP = 34

export function mount(root) {
  root.innerHTML = ''
  exBanner(root)
  const ex = getEx(), loads = fullLoads(ex), L = loads.L, dg = diagrammes(loads)
  const sx = (x) => MX + (x / L) * (W - 2 * MX)
  const geo = drawBeam(svg('svg'), loads, { type: ex.type, y0: Y0, W, mx: MX, dims: true })
  const cTop = geo.bottom + 12, cEnd = cTop + Math.max(loads.forces.length, 1) * ROW
  const tY = cEnd + 34 + AMP, mY = tY + 2 * AMP + 46, vb = [0, geo.top - 48, W, mY + AMP + 18 - (geo.top - 48)] // marge haute : étiquette du sens de rotation
  const org = origin(loads), xo = org.x // origine des distances : premier point à gauche
  let rt = 0, raf = 0 // minuterie des formules, image d'animation en attente
  let side = 'g', x =xo + Math.round((L - xo) / 10) * 5

  const intro = h('div', { class: 'card' }, root, `<h2>2 · Couper la poutre en G</h2>
    <p>On coupe la poutre en <b>G</b> et on étudie <b>un seul côté</b>. Chaque force fait tourner ce morceau autour de G : on mesure sa <b>distance d</b> à G et son <b>sens de rotation</b>.</p>`)
  renderTex(intro, 'T = -\\sum F \\ ;\\ M_f = -\\sum M_G \\ \\text{(à gauche)} \\qquad T = +\\sum F \\ ;\\ M_f = +\\sum M_G \\ \\text{(à droite)}')
  const ctl = h('div', { class: 'card' }, root)
  const sl = slider(ctl, { label: `Position de G : x (distance de ${org.id} à G)`, min: 0, max: L - xo, step: 5, value: x - xo, unit: 'mm', digits: 0, onInput: (v) => { x = xo + v; raf || (raf = requestAnimationFrame(() => { raf = 0; draw() })) } })
  const bar = h('div', { class: 'btns' }, ctl)
  const mk = (label, fn) => { const b = h('button', { type: 'button' }, bar, label); b.addEventListener('click', fn); return b }
  const lp = loop((t) => {
    const f = reduced ? Math.floor(t * 2) / 20 : t / 9
    sl.set(Math.min(L - xo, Math.round((f * (L - xo)) / 5) * 5))
    if (f >= 1) lp.stop()
  })
  mk('▶ Lecture', () => { lp.stop(); sl.set(0); lp.start() })
  mk('⏸ Pause', () => lp.stop())
  const bs = { g: mk('Étudier à GAUCHE de G', () => pick('g')), d: mk('Étudier à DROITE de G', () => pick('d')) }
  const pick = (v) => { side = v; draw() }
  h('p', { class: 'note' }, ctl, '👆 Clique sur une force (même de l\'autre côté de G) : son morceau tourne autour de <b>G</b> dans son sens (↺ <b>sens positif (+)</b>, ↻ <b>sens négatif (−)</b>).')
  const spin = spinner(h('p', { class: 'spinmsg', 'aria-live': 'polite' }, ctl))

  const grid = h('div', { class: 'grid2' }, root)
  const s = svg('svg', { viewBox: vb.join(' '), class: 'flexsvg', role: 'img', 'aria-label': 'Poutre coupée en G, cotes et courbes T et Mf' }, h('div', {}, grid))
  const out = h('div', { class: 'card' }, grid)

  // ----- glisser G directement sur le dessin (souris, doigt) ; flèches ←/→ au clavier -----
  const toMm = (e) => {
    const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(s.getScreenCTM().inverse())
    return Math.min(L - xo, Math.max(0, Math.round((((p.x - MX) / (W - 2 * MX)) * L - xo) / 5) * 5))
  }
  let drag = false
  s.setAttribute('tabindex', '0')
  s.addEventListener('pointerdown', (e) => {
    const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(s.getScreenCTM().inverse())
    const nearG = Math.abs(p.x - sx(x)) < 26, onBeam = Math.abs(p.y - Y0) < 34 // poignée de G ou poutre : on saisit G
    if ((!nearG && !onBeam) || e.target.classList.contains('fhit')) return // clic sur une force : rotation (tab-coupe5)
    drag = true; lp.stop(); s.setPointerCapture(e.pointerId); s.classList.add('dragging')
    sl.set(toMm(e)); e.preventDefault()
  })
  s.addEventListener('pointermove', (e) => { if (drag) sl.set(toMm(e)) })
  const end = () => { drag = false; s.classList.remove('dragging') }
  s.addEventListener('pointerup', end); s.addEventListener('pointercancel', end)
  s.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: -1, ArrowRight: 1, Home: -1e9, End: 1e9 }[e.key]
    if (k === undefined) return
    lp.stop(); sl.set(Math.min(L - xo, Math.max(0, x - xo + k * (e.shiftKey ? 50 : 5)))); e.preventDefault()
  })

  function draw() {
    const hit = loads.forces.some((f) => f.x === x), xe = hit ? (x >= L ? x - 0.01 : x + 0.01) : x, gx = sx(xe)
    const st = study(loads, x, xe, side) // calcul léger : le dessin suit à chaque image
    s.innerHTML = ''
    const defs = svg('defs', {}, s)
    const clip = (id, [a, b]) => svg('rect', { x: a, y: vb[1], width: b - a, height: vb[3] }, svg('clipPath', { id }, defs))
    clip('cl-in', side === 'g' ? [0, gx] : [gx, W]); clip('cl-out', side === 'g' ? [gx, W] : [0, gx])
    // deux morceaux : chacun tourne autour de G au clic sur une de ses forces (tab-coupe5) ; le morceau étudié au-dessus
    const other = svg('g', { class: 'piece' }, s), piece = svg('g', { class: 'piece' }, s)
    for (const [id, cls, p] of [['cl-out', 'dim', other], ['cl-in', 'in', piece]]) {
      drawBeam(svg('g', { class: cls, 'clip-path': `url(#${id})` }, p), loads, { type: ex.type, y0: Y0, W, mx: MX, dims: true })
    }
    for (const cp of loads.couples) {
      const on = side === 'g' ? cp.x < xe : cp.x > xe, right = cp.x > L / 2, cx = sx(cp.x) + (right ? -30 : 30) // encastrement à droite : arc et nom vers l'intérieur
      rotArc(s, cx, Y0 - 40, 14, cp.m > 0 ? 'ccw' : 'cw', `rot ${cp.m > 0 ? 'ccw' : 'cw'}${on ? '' : ' dim'}`)
      subText(s, { base: 'M', sub: cp.id, suffix: ` = ${fmt(cp.m, 0)} N·mm`, x: cx + (right ? -20 : 20), y: Y0 - 36, anchor: right ? 'end' : 'start', cls: 'lbl2' })
    }
    st.rows.forEach((r, i) => {
      const xf = sx(r.f.x), y = cTop + i * ROW + 12, dir = gx > xf ? 1 : -1, cl = 'cote ' + (r.rot || '')
      svg('line', { x1: xf, y1: Y0 + 8, x2: xf, y2: y, class: 'cote-ext' }, s)
      svg('line', { x1: xf, y1: y, x2: gx, y2: y, class: cl }, s)
      svg('line', { x1: gx, y1: y - 4, x2: gx, y2: y + 4, class: cl }, s)
      const { base, sub } = forceName(r.f)
      const gap = Math.abs(gx - xf), fits = gap > 150, tx = fits ? (xf + gx) / 2 : xf + dir * 24
      subText(s, { base, sub, suffix: ` : d = ${distExpr(r, side === 'g', org).plain} = ${fmt(r.d, 0)} mm`, x: tx, y: y - 5, anchor: fits ? 'middle' : dir > 0 ? 'start' : 'end', cls: 'lbl2' })
      if (r.rot) rotArc(s, xf + dir * 13, y, 7, r.rot, 'rot ' + r.rot)
    })
    drawCurves(s, loads, dg, { sx, xe, side, T: st.T, Mf: st.Mf, tY, mY, amp: AMP, g0: Y0 + 100 })
    const items = loads.forces.map((f) => { // toutes les forces, même hors du côté étudié : M_G = F·(x_F − x_G)
      const m = f.value * (f.x - x)
      return { f, rot: m > 0 ? 'ccw' : m < 0 ? 'cw' : null, inside: st.rows.some((r) => r.f.id === f.id) }
    })
    spin.attach({ s, piece, other, otherName: side === 'g' ? 'droite' : 'gauche', gx, y0: Y0, top: geo.top, bottom: cEnd, W, sx, items, redraw: draw })
    drawG(s, gx, Y0, x - xo) // G et sa poignée au-dessus des zones cliquables des forces
    svg('circle', { cx: gx, cy: Y0, r: 17, class: 'ghandle' }, s)
    svg('text', { x: gx, y: Y0 + 31, 'text-anchor': 'middle', class: 'ghint' }, s).textContent = '◀ glisse G ▶'
    for (const k in bs) bs[k].classList.toggle('on', k === side)
    // formules KaTeX (lourdes) : recalculées 90 ms après le dernier mouvement, jamais pendant le glisser
    out.classList.add('stale'); clearTimeout(rt)
    rt = setTimeout(() => { report(out, loads, x, xe, side); out.classList.remove('stale') }, 90)
  }
  draw()
  return () => { lp.stop(); spin.stop(); clearTimeout(rt); cancelAnimationFrame(raf) }
}
