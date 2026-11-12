// État de l'animation et grandeurs de la chaîne de cotes
// Montage à obstacle sur chaque roulement : G arrête vers la gauche, D arrête vers la droite.
// Paramètres géométriques (mm) en noms « techniques » ; les cotes de chaîne NF E 04-550 (lettre + n° de pièce) sont dans dims.js
const M = {
  mode: 'arbre',   // 'arbre' | 'hub'
  c: 172,          // mm : bâti (ou axe) entre ses deux plans de départ
  a1: 6, a2: 6,    // mm : obstacles côté G et côté D (centrage couvercle / épaisseur anneau élastique)
  b1: 11, b2: 11,  // mm : largeurs des roulements G et D
  p1: 30.5, p2: 30.5, e1: 8, e2: 8,  // poulies : p (position, pièce mobile), e (pièce fixe)
  t1: 8, t2: 8,    // mm : épaisseur des flasques fixes (moyeu tournant)
  d: 134,          // mm : arbre (ou moyeu) entre ses deux épaulements
  ref: 176,        // px : plan de départ gauche des cotes
  g: 0,            // px : décalage de l'ensemble mobile depuis la butée gauche
  target: 0,
  push: null,      // -1 gauche, 1 droite, null repos
  rot: true,
  angle: 0,
  chain: 'G',      // jeu dont on trace la chaîne : 'G' (Jp G), 'D' (Jp D) ou 'J' (course axiale)
  lower: false     // lettres de cotes en minuscules
};

// arbre : bâti + 2 couvercles ; moyeu : axe + 2 anneaux élastiques d'arbre
const PROF = {
  arbre: { ref: 176, a1: 6, a2: 6, c: 172, cMin: 167, cMax: 176, p: 30.5, e: 8, t: 8 },
  hub:   { ref: 170, a1: 7.5, a2: 7.5, c: 175, cMin: 170, cMax: 179, p: 17, e: 0, t: 8 }   // a1, a2 = entretoises ; ref, c = appuis de flasque
};

// nomenclature (repères)
const PARTS = {
  arbre: [['1', 'Bâti'], ['2', 'Couvercle G'], ['3', 'Couvercle D'], ['4', 'Arbre (tourne)'],
    ['5', 'Roulement G'], ['6', 'Roulement D'], ['7', 'Poulie G'], ['8', 'Poulie D'], ['9', 'Anneau élastique d\'arbre'],
    ['10', 'Vis à tête lamée'], ['11', 'Écrou (×2)'], ['12', 'Rondelle frein (×2)']],
  hub: [['1', 'Axe (fixe)'], ['2', 'Moyeu (tourne)'], ['3', 'Roulement G'], ['4', 'Roulement D'],
    ['5', 'Poulie G (jante)'], ['6', 'Poulie D (jante)'], ['7', 'Flasque G'], ['8', 'Flasque D'],
    ['9', 'Entretoise G'], ['10', 'Entretoise D'], ['11', 'Anneau d\'alésage'], ['12', 'Écrou (×2)'],
    ['13', 'Rondelle frein (×2)']]
};

// signification des cotes (lettre + n° de pièce) ; les cotes C, D, E d'une pièce sont des sommes de cotes de la même pièce
const DESC = {
  arbre: {
    A1: 'Bâti (1) : entre plans de joint', A2: 'Couvercle G (2) : centrage', A3: 'Couvercle D (3) : centrage',
    A4: 'Arbre (4) : entre épaulements', A5: 'Roulement G (5) : largeur', A6: 'Roulement D (6) : largeur',
    B2: 'Couvercle G (2) : bride', B3: 'Couvercle D (3) : bride',
    B4: 'Arbre (4) : épaulement de poulie G → épaulement G', C4: 'Arbre (4) : épaulement D → épaulement de poulie D',
    C2: 'Couvercle G (2) : bride + centrage', C3: 'Couvercle D (3) : bride + centrage',
    D4: 'Arbre (4) : épaulement de poulie G → épaulement D', E4: 'Arbre (4) : épaulement G → épaulement de poulie D'
  },
  hub: {
    A1: 'Axe (1) : entre appuis de flasque', A2: 'Moyeu (2) : entre épaulements', A3: 'Roulement G (3) : largeur',
    A4: 'Roulement D (4) : largeur', A9: 'Entretoise G (9) : longueur', A10: 'Entretoise D (10) : longueur',
    B2: 'Moyeu (2) : épaulement G → bout G', C2: 'Moyeu (2) : épaulement D → bout D',
    D2: 'Moyeu (2) : bout G → épaulement D', E2: 'Moyeu (2) : épaulement G → bout D'
  }
};

// Jeu poulie / pièce fixe, côté qui se ferme, mm : jeux MINI sur la course axiale J (chaînes dans dims.js)
// arbre : poulies à l'extérieur des couvercles → la poulie G se ferme en poussant à DROITE, la D à GAUCHE
// moyeu : jantes du moyeu face aux flasques fixes de l'axe → G se ferme en poussant à gauche, D à droite
function JpG() { return chainSum(CHAINS[M.mode].G.mini); }
function JpD() { return chainSum(CHAINS[M.mode].D.mini); }
// jeu poulie réel (px) à la position courante g ; mini du côté fermant, + jpx() du côté opposé
function gapG() { return K * JpG() + (M.mode === 'arbre' ? Math.max(0, jpx() - M.g) : M.g); }
function gapD() { return K * JpD() + (M.mode === 'arbre' ? M.g : Math.max(0, jpx() - M.g)); }
function closeG() { return M.mode === 'arbre' ? 1 : -1; }   // sens de poussée qui ferme le jeu poulie G
function friction() { return JpG() < 0 || JpD() < 0; }
// curseur « jeu poulie nominal » : règle p1, p2 pour obtenir JpG = JpD = jp (p1, p2 comptent + en arbre, − en moyeu)
function setJp(jp) {
  const s = M.mode === 'arbre' ? 1 : -1;
  M.p1 += s * (jp - JpG()); M.p2 += s * (jp - JpD());
}

function J() { return M.c - M.a1 - M.a2 - M.b1 - M.d - M.b2; }
function jpx() { return Math.max(0, K * J()); }
const STOP_L = 200, RING_G = 200, RING_D = 780;     // butée gauche, roulements (x de la face gauche)
function stopR() { return M.ref + K * (M.c - M.a2); }   // butée droite

function setPush(d) {
  M.push = d;
  M.target = d < 0 ? 0 : jpx();
}

function resetM() {
  M.push = null;
  M.target = jpx() / 2;
}

function clampG() {
  M.g = Math.min(Math.max(M.g, 0), jpx());
  if (M.push === null) M.target = jpx() / 2; else setPush(M.push);
}

function step(dt) {
  const t = Math.min(M.target, jpx());
  M.g += (t - M.g) * Math.min(1, dt * 7);
  if (Math.abs(t - M.g) < 0.05) M.g = t;
}

// contact en butée : 'L' (roulement G sur sa butée), 'R' (roulement D sur sa butée), 'both' ou null
function contact() {
  if (J() < 0.001) return 'both';
  if (M.g <= 0.3) return 'L';
  if (M.g >= jpx() - 0.3) return 'R';
  return null;
}
