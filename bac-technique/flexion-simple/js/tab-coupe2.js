// Onglet 2 : étude d'un côté de G — tableau des moments, formules KaTeX, règle de signe, vérification gauche = droite.
import { h, fmt } from './svg.js'
import { coupe } from './calc.js'
import { sg, ROT } from './fx.js'
import { forceHtml, renderTex } from './math.js'
import { headTex, momentsTex, sumsTex, resultTex, checkTex, origin, distsTex } from './tab-coupe4.js'

/** Étude d'un côté : moments exacts autour de x (xe = x décalé de 0,01 si x tombe sur une force, pour choisir le côté). */
export function study(loads, x, xe, side) {
  const c = coupe(loads, xe, side), left = side === 'g'
  const rows = c.rows.map((r) => {
    const m = r.f.value * (r.f.x - x)
    return { f: r.f, d: Math.abs(r.f.x - x), m, rot: m > 0 ? 'ccw' : m < 0 ? 'cw' : null }
  })
  const sM = rows.reduce((s, r) => s + r.m, 0) + c.couples.reduce((s, p) => s + p.m, 0)
  return { rows, couples: c.couples, sF: c.sF, sM, T: c.T, left, Mf: (left ? -1 : 1) * sM || 0 }
}

const mname = (p) => `M<sub>${p.id}</sub>`

function table(st) {
  const rows = st.rows.map((r) => `<tr class="${r.rot || ''}"><td>${forceHtml(r.f)}</td><td>${r.f.value > 0 ? '↑ haut' : '↓ bas'}</td><td>${fmt(r.d, 2)}</td>
    <td><b>${sg(r.m, 0)}</b></td><td>${r.rot ? ROT[r.rot] : '—'}</td></tr>`)
  const cps = st.couples.map((p) => `<tr class="${p.m > 0 ? 'ccw' : 'cw'}"><td>${mname(p)}</td><td>couple</td><td>—</td><td><b>${sg(p.m, 0)}</b></td><td>${ROT[p.m > 0 ? 'ccw' : 'cw']}</td></tr>`)
  return `<div class="tw"><table class="ct"><thead><tr><th>Force</th><th>Sens</th><th>d (mm)</th><th>Moment (N·mm)</th><th>Rotation / G</th></tr></thead>
    <tbody>${rows.join('')}${cps.join('')}
    <tr class="sum"><td colspan="3">ΣF = ${sg(st.sF)} N</td><td colspan="2">ΣM<sub>G</sub> = ${sg(st.sM, 0)} N·mm</td></tr></tbody></table></div>`
}

function note(st) {
  const items = [...st.rows.map((r) => ({ name: forceHtml(r.f), m: r.m, up: r.f.value > 0 })), ...st.couples.map((p) => ({ name: mname(p), m: p.m, up: null }))]
  const big = items.sort((a, b) => Math.abs(b.m) - Math.abs(a.m))[0]
  if (!big || !big.m) return ''
  const name = st.left ? 'gauche' : 'droite', rot = big.m > 0 ? 'ccw' : 'cw', contrib = (st.left ? -1 : 1) * big.m
  const sens = big.up === null ? '' : big.up ? ' (vers le haut)' : ' (vers le bas)'
  const rule = st.left ? 'T = −ΣF : une force vers le haut à gauche donne T &lt; 0.' : 'T = +ΣF : une force vers le haut à droite donne T &gt; 0.'
  return `<p class="note"><b>${big.name}</b>${sens} à ${name} de G → tourne dans le ${ROT[rot]} autour de G → contribue ${contrib > 0 ? 'à M<sub>f</sub> &gt; 0' : 'à M<sub>f</sub> &lt; 0'}.<br>
    Règle : à ${name} de G, une rotation dans le ${ROT[st.left ? 'cw' : 'ccw']} donne M<sub>f</sub> &gt; 0 ; ${rule}</p>`
}

const eq = (u, v) => Math.abs(u - v) <= 1e-6 * (1 + Math.abs(u) + Math.abs(v))

export function report(out, loads, x, xe, side) {
  const st = study(loads, x, xe, side), name = st.left ? 'gauche' : 'droite'
  out.innerHTML = ''
  h('h3', {}, out, `Étude à ${name} de G`)
  if (!st.rows.length && !st.couples.length) {
    h('p', {}, out, `Aucune force à ${name} de G : T = 0 et M<sub>f</sub> = 0.`)
  } else {
    h('div', {}, out, table(st))
    renderTex(out, headTex(st.left))
    const org = origin(loads), dt = distsTex(st, org, loads.forces)
    h('p', { class: 'note' }, out, `Origine en <b>${org.id}</b> (premier point à gauche) : <b>x</b> = distance de ${org.id} à G = ${fmt(x - org.x, 2)} mm.`)
    if (dt) renderTex(out, dt)
    renderTex(out, momentsTex(st, x, org))
    renderTex(out, sumsTex(st))
  }
  renderTex(out, resultTex(st))
  h('div', {}, out, note(st))
  const a = study(loads, x, xe, 'g'), b = study(loads, x, xe, 'd'), ok = eq(a.T, b.T) && eq(a.Mf, b.Mf)
  h('p', { class: ok ? 'ok' : 'bad' }, out, ok ? '✔ Vérification : même résultat des deux côtés.' : '✘ Vérification : écart, équilibre non respecté.')
  renderTex(out, checkTex(a, b))
  return st
}
