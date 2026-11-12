// Cotes fonctionnelles NF E 04-550 : lettre + numéro de la pièce en indice, une seule cote par pièce et par chaîne.
// Les cotes C, D, E sont des cotes de la même pièce, somme de deux cotes de base (tolérances additionnées).
// valeurs de base (mm) à partir des paramètres géométriques de model.js
function baseDim() {
  const m = M;
  return m.mode === 'arbre'
    ? { A1: m.c, A2: m.a1, A3: m.a2, A4: m.d, A5: m.b1, A6: m.b2, B2: m.e1, B3: m.e2, B4: m.p1, C4: m.p2 }
    : { A1: m.c, A2: m.d, A3: m.b1, A4: m.b2, A9: m.a1, A10: m.a2, B2: m.p1, C2: m.p2 };
}
const DER = {
  arbre: { C2: ['A2', 'B2'], C3: ['A3', 'B3'], D4: ['A4', 'B4'], E4: ['A4', 'C4'] },
  hub: { D2: ['B2', 'A2'], E2: ['A2', 'C2'] }
};
// tolérances (± mm) des cotes de base
const TOLK = {
  arbre: { A1: .3, A2: .1, A3: .1, A4: .2, A5: .06, A6: .06, B2: .1, B3: .1, B4: .15, C4: .15 },
  hub: { A1: .3, A2: .2, A3: .06, A4: .06, A9: .05, A10: .05, B2: .15, C2: .15 }
};

function dimVal(k) {
  const b = baseDim();
  return k in b ? b[k] : DER[M.mode][k].reduce((s, q) => s + b[q], 0);
}
function dimTol(k) {
  const t = TOLK[M.mode];
  return k in t ? t[k] : DER[M.mode][k].reduce((s, q) => s + t[q], 0);
}

// Chaînes : liste ordonnée [cote, sens] depuis l'origine du vecteur condition (sens + = même sens que la condition, de G à D)
// J : course axiale (G : poussée à droite, D : poussée à gauche) ; G, D : jeu poulie mini (côté qui se ferme) / maxi (côté opposé)
const CHAINS = {
  arbre: {
    J: { G: [['A2', -1], ['A1', 1], ['A3', -1], ['A6', -1], ['A4', -1], ['A5', -1]],
         D: [['A6', -1], ['A4', -1], ['A5', -1], ['A2', -1], ['A1', 1], ['A3', -1]] },
    G: { mini: [['D4', 1], ['A6', 1], ['A3', 1], ['A1', -1], ['B2', -1]],
         maxi: [['B4', 1], ['A5', -1], ['C2', -1]] },
    D: { mini: [['B3', -1], ['A1', -1], ['A2', 1], ['A5', 1], ['E4', 1]],
         maxi: [['C3', -1], ['A6', -1], ['C4', 1]] }
  },
  hub: {
    J: { G: [['A9', -1], ['A1', 1], ['A10', -1], ['A4', -1], ['A2', -1], ['A3', -1]],
         D: [['A4', -1], ['A2', -1], ['A3', -1], ['A9', -1], ['A1', 1], ['A10', -1]] },
    G: { mini: [['A9', 1], ['A3', 1], ['B2', -1]],
         maxi: [['A1', 1], ['A10', -1], ['A4', -1], ['D2', -1]] },
    D: { mini: [['C2', -1], ['A4', 1], ['A10', 1]],
         maxi: [['E2', -1], ['A3', -1], ['A9', -1], ['A1', 1]] }
  }
};

const chainSum = def => def.reduce((s, [k, sg]) => s + sg * dimVal(k), 0);
function chainStat(def) {
  const nom = chainSum(def), t = def.reduce((s, [k]) => s + dimTol(k), 0);
  return { nom, min: nom - t, max: nom + t, tol: t };
}
// J : course axiale ; G / D : jeu poulie mini (poussée du côté fermant) et maxi (poussée opposée)
function stats() {
  const c = CHAINS[M.mode];
  return { J: chainStat(c.J.G), G: { mini: chainStat(c.G.mini), maxi: chainStat(c.G.maxi) },
    D: { mini: chainStat(c.D.mini), maxi: chainStat(c.D.maxi) } };
}

// écriture d'une cote : lettre majuscule (ou minuscule) + numéro de pièce en indice
const SUBD = '₀₁₂₃₄₅₆₇₈₉';
function L(k) { return (M.lower ? k[0].toLowerCase() : k[0]) + k.slice(1).replace(/\d/g, d => SUBD[+d]); }
