// Onglet 1 : chercher les forces inconnues — même parcours guidé que l'app 3ème « Statique des solides » (useSession.ts) :
// setup (formulaire) → choose → groups → busy → sense → result → … → intens. Voir tab-reac2/3/4/5.js.
import { svg, h, reduced } from './svg.js'
import { drawBeam, rotArc } from './beam.js'
import { findSense, unknown, fullLoads } from './statics.js'
import { forceText } from './exercise.js'
import { getEx, setEx, getSession, setSession } from './state.js'
import { exerciseForm } from './tab-reac2.js'
import { panel } from './tab-reac3.js'

const Y0 = 110, TILT = 7, W = 560

export function mount(root) {
  root.innerHTML = ''
  const S = { tok: 0, angle: 0, phase: 'setup', ex: null, found: {}, in: {}, msg: '', kind: 'info' }
  h('div', { class: 'card' }, root, `<h2>1 · Chercher les forces inconnues</h2>
    <p>Une poutre est en équilibre : les <b>réactions</b> des appuis (flèches en pointillé) sont inconnues. On cherche d'abord leur <b>sens</b>, une force à la fois : on prend comme <b>pivot</b> le point de l'autre inconnue (son moment est nul), on compare les moments des forces connues, et la force cherchée doit s'y <b>opposer</b>. Les <b>calculs</b> viennent ensuite.</p>
    <div class="formula">M = F·d &nbsp;(↺ positif, ↻ négatif) &nbsp;→&nbsp; ΣM = 0 et ΣF = 0</div>`)
  const form = exerciseForm(root, { onStart: (ex) => start(ex), onPreview: (ex) => { S.pre = ex; if (S.phase === 'setup' && S.ready) draw() } })
  const top = h('div', { class: 'btns', hidden: '' }, root)
  h('button', { type: 'button' }, top, '← Nouvel exercice').addEventListener('click', newEx)
  const grid = h('div', { class: 'grid2 solo' }, root)
  const col = h('div', { class: 'svgcol' }, grid)
  const s = svg('svg', { viewBox: `0 0 ${W} 270`, class: 'flexsvg', role: 'img', 'aria-label': 'Poutre et forces' }, col)
  const box = h('div', { class: 'pbox', hidden: '' }, grid)

  const setAngle = (a) => { S.angle = a; S.grp?.setAttribute('transform', `rotate(${a} ${S.px} ${Y0})`) }
  function tween(to, done) {
    const from = S.angle, t0 = performance.now(), tok = ++S.tok
    if (reduced) { setAngle(to); done(); return }
    const f = (t) => {
      if (tok !== S.tok) return
      const k = Math.min(1, (t - t0) / 1100)
      setAngle(from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * k)))
      k < 1 ? requestAnimationFrame(f) : done()
    }
    requestAnimationFrame(f)
  }

  const say = (kind, msg) => { S.kind = kind; S.msg = msg; refresh() }
  const to = (phase, kind, msg) => { S.phase = phase; say(kind, msg) }
  const A = {
    say,
    done() { document.querySelectorAll('#tabs button')[1]?.click() }, // la poutre est déjà partagée (setEx au démarrage)
    begin(pivot, target, intro) {
      S.sense = findSense(S.ex, pivot, target); S.rot = null; setAngle(0)
      to('groups', 'info', intro || '')
    },
    choose(pivot, target) {
      const P = S.ex.forces.find((f) => f.id === pivot)
      if (P.kind !== 'unknown') return say('bad', `Au point ${pivot}, la force ${forceText(P)} est connue : elle n'élimine aucune inconnue. Choisis le point de l'autre force inconnue pour que son moment soit nul.`)
      A.begin(pivot, target)
    },
    guessRot(ans) {
      const r = S.sense.rotation ?? 'equal', T = forceText(S.sense.target)
      if (ans !== r) return say('bad', 'Non : compare les deux sommes Σ, sens positif et sens négatif. Le groupe dont la somme est la plus grande fait tourner la poutre ; si elles sont identiques, elle ne tourne pas.')
      if (ans === 'equal') { S.found[S.sense.target.id] = 0; return to('result', 'ok', `Les deux sommes sont égales : la poutre ne tourne pas, donc ${T} = 0 N. Il n'y a pas de sens à chercher.`) }
      S.rot = ans; to('busy', 'info', 'Rotation en cours…')
      tween(ans === 'ccw' ? -TILT : TILT, () => to('sense', 'ok', `Rotation terminée : la poutre a tourné dans le sens ${ans === 'cw' ? 'négatif ↻' : 'positif ↺'}. Bien vu, regarde la poutre tourner.`))
    },
    guessSense(sign) {
      const T = S.sense.target
      if (sign !== S.sense.targetSign) return say('bad', 'Non : la force cherchée doit créer un moment opposé à la rotation.')
      S.found[T.id] = sign; to('busy', 'info', "La poutre revient à l'horizontale…")
      tween(0, () => { S.rot = null; to('result', 'ok', `Exact : ${forceText(T)} s'oppose à la rotation et la poutre revient en position initiale.`) })
    },
    next() {
      const left = unknown(S.ex).filter((f) => !(f.id in S.found))
      S.sense = null
      if (!left.length) return to('intens', 'info', 'Les deux sens sont trouvés. Calcule maintenant les intensités avec ΣF = 0 et ΣM = 0.')
      const other = unknown(S.ex).find((f) => f.id !== left[0].id)
      if (left.length === 1 && other) return A.begin(other.id, left[0].id, `Il reste la force ${forceText(left[0])} : le centre de rotation est le point ${other.id}.`)
      to('choose', 'info', '')
    },
  }

  function start(ex) {
    S.tok++
    setEx(ex) // la même poutre et les mêmes forces servent à TOUS les onglets dès « Commencer »
    Object.assign(S, { ex, found: {}, sense: null, rot: null, in: {}, res: null, done: false, reveal: false, angle: 0, grp: null })
    form.el.hidden = true; top.hidden = false; box.hidden = false; grid.classList.remove('solo')
    const p = unknown(ex)[0], side = p.x > 0 ? 'à droite' : 'à gauche'
    to(ex.type === 'encastree' ? 'intens' : 'choose', 'info', ex.type === 'encastree' ? `Poutre encastrée ${side} (point ${p.id}) : une réaction ${forceText(p)} et un moment M_${p.id} à calculer (ΣF = 0, ΣM/${p.id} = 0).` : '')
  }
  function newEx() {
    S.tok++; S.phase = 'setup'; S.grp = null; S.angle = 0
    form.load(S.ex || getEx()) // on repart de la poutre courante pour la modifier
    form.el.hidden = false; top.hidden = true; box.hidden = true; grid.classList.add('solo')
    refresh(); form.el.querySelector('h2').focus()
  }

  function draw() {
    const ex = S.phase === 'setup' ? S.pre : S.ex
    s.innerHTML = ''; S.grp = null
    if (!ex) { s.setAttribute('viewBox', `0 0 ${W} 120`); svg('text', { x: W / 2, y: 60, 'text-anchor': 'middle', class: 'lbl2' }, s).textContent = "Complète l'exercice : la poutre s'affichera ici."; return }
    const g = svg('g', {}, s), solved = S.done || S.reveal
    const loads = solved ? fullLoads(ex) : { L: ex.L, forces: ex.forces }
    const b = drawBeam(g, loads, { type: ex.type, y0: Y0, dirs: S.found, dims: true, couples: solved })
    const P = S.sense && ex.forces.find((f) => f.id === S.sense.pivot.id)
    const pad = S.phase === 'setup' ? 8 : 48
    s.setAttribute('viewBox', `0 ${b.top - pad} ${W} ${b.bottom - b.top + 2 * pad}`)
    if (!P) return
    S.px = b.sx(P.x); S.grp = g
    svg('circle', { cx: S.px, cy: Y0, r: 7, class: 'pivot' }, s)
    const r = S.px > W * 0.6
    svg('text', { x: S.px + (r ? -10 : 10), y: Y0 - 12, 'text-anchor': r ? 'end' : 'start', class: 'lbl' }, s).textContent = 'pivot ' + P.id
    if (S.rot) rotArc(s, S.px, Y0, 22, S.rot, 'rot ' + S.rot)
    setAngle(S.angle)
  }

  let lastPhase = ''
  function refresh() {
    draw()
    if (S.ex && S.phase !== 'setup' && S.phase !== 'busy') { // avancement conservé quand on change d'onglet
      setSession({ phase: S.phase, found: S.found, pivot: S.sense?.pivot.id, target: S.sense?.target.id, rot: S.rot, in: S.in, res: S.res, done: S.done, reveal: S.reveal })
    }
    if (S.phase === 'setup') return
    panel(box, S, A)
    if (S.phase !== lastPhase) box.querySelector('[data-focus]')?.focus({ preventScroll: false })
    lastPhase = S.phase
  }
  const sv = getSession() // retour sur l'onglet : on retrouve exactement l'exercice et l'étape en cours
  if (sv) {
    const ex = getEx(), sense = sv.pivot ? findSense(ex, sv.pivot, sv.target) : null
    Object.assign(S, { ex, found: sv.found || {}, in: sv.in || {}, res: sv.res, done: sv.done, reveal: sv.reveal, rot: sv.rot, sense,
      angle: sv.phase === 'sense' ? (sv.rot === 'ccw' ? -TILT : TILT) : 0, phase: sv.phase })
    form.load(ex); form.el.hidden = true; top.hidden = false; box.hidden = false; grid.classList.remove('solo')
  } else form.load(getEx())
  S.ready = true
  refresh()
  return () => { S.tok++ }
}
