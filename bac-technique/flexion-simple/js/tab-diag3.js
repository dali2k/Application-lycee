// Onglet 3 : tableau récapitulatif (points A, B, C…), extrêmes et calcul tronçon par tronçon en KaTeX.
import { h, fmt } from './svg.js'
import { efforts } from './calc.js'
import { sg as sg0 } from './fx.js'

import { fmtNum, nm, renderTex, N, NMM, MM } from './math.js'

const sg = (v, n = 2) => sg0(Math.abs(v) < 0.5 * 10 ** -n ? 0 : v, n)

const sv = (v) => (v > 0 ? '+' : '') + fmtNum(v)
const pointAt = (loads, x) => loads.forces.find((f) => f.x === x)?.id
const plain = (n) => fmtNum(n).replace(/\\,/g, ' ').replace(/\{,\}/g, ',').replace('-', '−')

export function recap(loads, dg) {
  const xs = [...new Set(dg.T.map((p) => p[0]))]
  const rows = xs.map((x) => {
    const a = efforts(loads, x, false), b = efforts(loads, x, true)
    return `<tr><td>${pointAt(loads, x) ?? '—'}</td><td>${fmt(x, 0)}</td><td>${sg(a.T, 1)}</td><td>${sg(b.T, 1)}</td><td>${sg(b.T - a.T, 1)}</td><td>${sg((x < loads.L ? b : a).Mf, 0)}</td></tr>` // en x = L : Mf juste avant (encastrement à droite)
  })
  return `<div class="tw"><table class="ct"><thead><tr><th>Point</th><th>x (mm)</th><th>T avant (N)</th><th>T après (N)</th><th>Saut (N)</th><th>M<sub>f</sub> (N·mm)</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
    <p class="note">Le saut de T à une force est égal à cette force. M<sub>f</sub> est maximal là où T change de signe (T = 0).</p>`
}

/** Valeurs absolues maximales de T et Mf (LaTeX). */
export function extremaTex(dg) {
  return [
    `T_{\\max} = ${fmtNum(Math.abs(dg.tMax))}${N} \\quad (x = ${fmtNum(dg.xT)}${MM})`,
    `M_{f\\,\\max} = ${fmtNum(Math.abs(dg.mfMax))}${NMM} = ${fmtNum(Math.abs(dg.mfMax) / 1000)}\\text{ N·m} \\quad (x = ${fmtNum(dg.xMf)}${MM})`,
  ]
}

const par = (n) => (n < 0 ? `\\left(${fmtNum(n)}\\right)` : fmtNum(n))
/** Droite a·x + b en LaTeX. */
function affine(a, b) {
  if (a === 0) return fmtNum(b)
  const ax = a === 1 ? 'x' : a === -1 ? '-x' : `${fmtNum(a)}\\,x`
  return b === 0 ? ax : `${ax} ${b < 0 ? '-' : '+'} ${fmtNum(Math.abs(b))}`
}

/** Calcul côté gauche, tronçon par tronçon : T = −ΣF ; M_f(x) = −Σ F·(xᵢ − x) − Σ couples. Écrit dans `parent`. */
export function handCalc(parent, loads, dg) {
  const xs = [...new Set(dg.T.map((p) => p[0]))]
  for (let i = 0; i + 1 < xs.length; i++) {
    const [xa, xb] = [xs[i], xs[i + 1]], mid = (xa + xb) / 2
    const fs = loads.forces.filter((f) => f.x < mid && f.value !== 0), cs = loads.couples.filter((c) => c.x < mid && c.m !== 0)
    const pa = pointAt(loads, xa), pb = pointAt(loads, xb)
    const title = `Tronçon${pa && pb ? ` ${pa}${pb}` : ''} : ${plain(xa)} ≤ x ≤ ${plain(xb)} mm`
    const box = h('div', { class: 'tron' }, parent, `<p><b>${title}</b></p>`)
    if (!fs.length && !cs.length) { renderTex(box, 'T = 0 \\quad \\text{et} \\quad M_f = 0'); continue }
    const sF = fs.reduce((s, f) => s + f.value, 0), b = -fs.reduce((s, f) => s + f.value * f.x, 0) - cs.reduce((s, c) => s + c.m, 0)
    const names = [...fs.map(nm), ...cs.map((c) => `M_{${c.id}}`)].join(', ')
    const terms = [...fs.map((f) => `${par(f.value)}\\,(${fmtNum(f.x)} - x)`), ...cs.map((c) => par(c.m))].join(' + ')
    renderTex(box, `\\begin{aligned}
      &\\text{à gauche : } ${names} \\\\
      T &= -\\sum F = -\\left(${sv(sF)}${N}\\right) = ${sv(-sF)}${N} \\\\
      M_f(x) &= -\\left[${terms}\\right] \\\\ &= ${affine(sF, b)}\\ \\text{(N·mm)} \\\\
      M_f(${fmtNum(xa)}) &= ${sv(sF * xa + b)}${NMM} \\qquad M_f(${fmtNum(xb)}) = ${sv(sF * xb + b)}${NMM}
      \\end{aligned}`)
  }
}
