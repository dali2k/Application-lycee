// Onglet 6 : quiz QCM (correction expliquée + score). Formules en KaTeX ($…$), forces nommées R_A / F_C.
// Citation : « respecte les normalisation des expression mathematique … l'affichage n'est pas adapter a tous les ecrant c'est pas dynamique ».
import { h } from './svg.js'
import { withTex } from './tex.js'

// [question, [bonne réponse, mauvaises...], explication] ; $…$ = formule KaTeX en ligne.
const Q = [
  ['Une force verticale $F_{C}$ <b>vers le haut</b> est appliquée <b>à droite</b> du point $G$. Dans quel sens son moment tourne-t-il autour de $G$ ?',
    ['Sens positif ↺ (+)', 'Sens négatif ↻ (−)', 'Il ne tourne pas', 'Cela dépend de l\'intensité'],
    '$M_{G}(F_{C}) = F_{C}\\times(x_{C}-x_{G})$ avec $F_{C} > 0$ (haut) et $x_{C}-x_{G} > 0$ (à droite) : $M_{G} > 0$, donc le moment tourne dans le <b>sens positif</b> ↺.'],
  ['Une force verticale $F_{B}$ <b>vers le bas</b> est appliquée <b>à gauche</b> de $G$. Son moment autour de $G$ est :',
    ['Sens positif ↺ (+)', 'Sens négatif ↻ (−)', 'Nul', 'Impossible à dire'],
    '$F_{B} < 0$ (bas) et $x_{B}-x_{G} < 0$ (à gauche) : le produit est positif. Le côté gauche descend, la poutre tourne dans le <b>sens positif</b> ↺.'],
  ['Selon la convention du cours, à <b>gauche</b> de la coupure on a $T = -\\sum F$. Seule une force $F_{B} = -200\\text{ N}$ (vers le bas) agit à gauche. Que vaut $T$ ?',
    ['$T = +200\\text{ N}$', '$T = -200\\text{ N}$', '$T = 0$', '$T = +100\\text{ N}$'],
    '$\\sum F = -200\\text{ N}$ (vers le bas est négatif), donc $T = -\\sum F = $ <b>$+200\\text{ N}$</b>. À droite de la coupure, ce serait $T = +\\sum F$.'],
  ['À <b>droite</b> de $G$ ($M_{f} = +\\sum M_{G}$), une force $F_{C} = +100\\text{ N}$ <b>vers le haut</b> est à $0{,}5\\text{ m}$ de $G$. Que vaut $M_{f}$ ?',
    ['$+50\\text{ N·m}$', '$-50\\text{ N·m}$', '$+100\\text{ N·m}$', '$+200\\text{ N·m}$'],
    '$M_{G} = F_{C}\\times d = 100\\times 0{,}5 = +50\\text{ N·m}$ (sens positif). À droite : $M_{f} = +\\sum M_{G} = $ <b>$+50\\text{ N·m}$</b>. On multiplie la force par sa distance à $G$, sans oublier les unités.'],
  ['Sur une poutre sur deux appuis $R_{A}$ et $R_{D}$, où le moment fléchissant est-il maximal (en valeur absolue) ?',
    ['Là où l\'effort tranchant $T$ change de signe (passe par zéro)', 'Toujours au milieu de la poutre', 'Sur les appuis', 'Là où $T$ est maximal'],
    '$M_{f}$ est la « primitive » de $T$ : il est extrémal là où $T$ s\'annule en changeant de signe. Ce n\'est pas toujours au milieu (si les charges sont dissymétriques).'],
  ['Pourquoi le moment quadratique d\'un rectangle $b\\times h$ contient-il $h^{3}$ : $I_{Gz} = \\dfrac{b\\,h^{3}}{12}$ ?',
    ['Parce que la hauteur compte deux fois : plus de matière et des fibres plus éloignées ($y^{2}$)', 'Parce que le volume est $b\\times h\\times h$', 'C\'est une convention sans explication', 'Parce que la largeur $b$ est élevée au cube'],
    'Chaque petite surface apporte $y^{2}\\,\\Delta S$. Si on double $h$, la surface double et les distances $y$ doublent aussi ($y^{2}\\times 4$) : $I_{Gz}$ est multiplié par $2\\times 4 = $ <b>$8$</b>.'],
  ['Un rectangle de $20\\times 60\\text{ mm}$ est utilisé « debout » ($h = 60\\text{ mm}$ vertical) puis « couché » ($20\\text{ mm}$ vertical). Le rapport $I_{Gz}$ debout / $I_{Gz}$ couché vaut :',
    ['$9$', '$3$', '$1$ (même aire, même rigidité)', '$27$'],
    'Debout : $\\dfrac{20\\times 60^{3}}{12} = 360\\,000\\text{ mm}^{4}$. Couché : $\\dfrac{60\\times 20^{3}}{12} = 40\\,000\\text{ mm}^{4}$. Rapport $= \\left(\\dfrac{60}{20}\\right)^{2} = $ <b>$9$</b>. On place toujours la plus grande dimension dans le sens de la flexion.'],
  ['Dans le théorème de Huygens $I_{Gz} = \\sum\\left(I_{0}+S\\,d^{2}\\right)$, que représente $d$ ?',
    ['La distance entre le centre de gravité de la partie et l\'axe $G_{z}$ de la section entière', 'Le diamètre de la partie', 'La hauteur de la partie', 'La distance entre deux appuis'],
    '$I_{0}$ est le moment quadratique de la partie autour de <b>son propre</b> axe. $S\\,d^{2}$ « transporte » ce moment vers l\'axe $G_{z}$ de l\'ensemble ; $d = y_{c}-y_{G}$.'],
  ['Où la contrainte normale $\\sigma$ est-elle maximale dans une section fléchie ?',
    ['Sur les fibres les plus éloignées de la fibre neutre', 'Sur la fibre neutre', 'Au centre de gravité', 'Elle est uniforme dans la section'],
    '$\\sigma = \\dfrac{M_{f}\\,y}{I_{Gz}}$ est proportionnelle à $y$ : nulle sur la fibre neutre ($y = 0$), maximale en $y = \\pm v$ : <b>$\\sigma_{\\max} = \\dfrac{|M_{f}|\\,v}{I_{Gz}} = \\dfrac{|M_{f}|}{I_{Gz}/v}$</b>.'],
  ['On trouve $\\sigma_{\\max} = -180\\text{ MPa}$ (compression) avec $R_{pe} = 150\\text{ MPa}$. La condition de résistance est-elle vérifiée ?',
    ['Non : $|-180| = 180\\text{ MPa} > 150\\text{ MPa}$', 'Oui : $-180$ est inférieur à $150$', 'Oui : le signe négatif est favorable', 'On ne peut pas conclure'],
    'La condition s\'écrit avec des <b>valeurs absolues</b> : $|\\sigma_{\\max}| \\le R_{pe}$. Comparer $-180$ à $150$ sans valeur absolue donnerait un faux « résiste ». Ici $180 > 150$ : la poutre <b>ne résiste pas</b>.'],
  ['Avec $M_{f}$ en $\\text{N·mm}$, $I_{Gz}$ en $\\text{mm}^{4}$ et $v$ en $\\text{mm}$, la contrainte $\\sigma = \\dfrac{M_{f}\\,v}{I_{Gz}}$ s\'exprime en :',
    ['$\\text{MPa}$ ($= \\text{N/mm}^{2}$)', '$\\text{Pa}$', '$\\text{N·mm}$', '$\\text{mm}^{3}$'],
    '$\\dfrac{\\text{N·mm}\\times\\text{mm}}{\\text{mm}^{4}} = \\text{N/mm}^{2} = $ <b>$\\text{MPa}$</b>. Le rapport $\\dfrac{I_{Gz}}{v}$ est en $\\text{mm}^{3}$ ; $R_{pe} = \\dfrac{R_{e}}{s}$ est aussi en $\\text{MPa}$.'],
]

const shuffle = (a) => { const r = a.map((t, i) => [Math.random(), t, i]).sort((x, y) => x[0] - y[0]); return r.map((x) => ({ t: x[1], good: x[2] === 0 })) }

export function mount(root) {
  const card = h('div', { class: 'card' }, root)
  let i = 0, score = 0
  function ask() {
    const [q, opts, why] = Q[i]
    card.innerHTML = `<h2>Quiz — question ${i + 1} / ${Q.length}</h2><div class="qz-prog"><i style="width:${(100 * i) / Q.length}%"></i></div><p class="qz-q">${withTex(q)}</p>`
    const box = h('div', {}, card), fb = h('div', { 'aria-live': 'polite' }, card)
    const btns = shuffle(opts).map((o) => {
      const b = h('button', { type: 'button', class: 'qz-opt' }, box, withTex(o.t))
      b.onclick = () => {
        btns.forEach((x) => { x.b.disabled = true; if (x.o.good) x.b.classList.add('good') })
        if (o.good) score++; else b.classList.add('wrong')
        fb.innerHTML = `<div class="qz-exp"><b class="${o.good ? 'ok' : 'bad'}">${o.good ? '✔ Bonne réponse' : '✘ Réponse fausse'}</b><br>${withTex(why)}</div>`
        const nx = h('button', { type: 'button', class: 'btn' }, fb, i + 1 < Q.length ? 'Question suivante →' : 'Voir mon score')
        nx.onclick = () => { i++; i < Q.length ? ask() : end() }
        nx.focus()
      }
      return { b, o }
    })
  }
  function end() {
    const pct = Math.round((100 * score) / Q.length)
    card.innerHTML = `<h2>Résultat</h2><p class="qz-score">${score} / ${Q.length}</p><p>${pct >= 80 ? 'Très bien : le cours est acquis.' : pct >= 50 ? 'Pas mal : relis les explications des questions ratées.' : 'Reprends les onglets 3, 4 et 5 puis réessaie.'}</p>`
    h('button', { type: 'button', class: 'btn' }, card, '↻ Recommencer').onclick = () => { i = 0; score = 0; ask() }
  }
  ask()
}
