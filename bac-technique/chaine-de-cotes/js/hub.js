// Exemple 2 : MOYEU TOURNANT (axe fixe), montage à obstacle sur chaque roulement.
// G : bague intérieure arrêtée à gauche seulement ; D : arrêtée à droite seulement, par une bague entretoise
// (ni épaulement ni anneau élastique côté bague). Flasques fixes plaqués sur l'épaulement de filetage de l'axe,
// serrés par écrou + rondelle frein (montage démontable).
// Bagues extérieures serrées, arrêtées des 2 côtés (épaulement + anneau élastique pour alésage).
// L'axe (pièce pleine) n'est pas coupé : silhouette non hachurée.
const Hub = {
  build(fix, mov, spin, ann, am, fullF, fullM) {
    const xf = M.ref + K * M.c, sr = stopR();                      // appui du flasque D ; butée D (face gauche de l'entretoise D)
    const hl = RING_G + BW - K * M.p1, hr = RING_D + K * M.p2;     // extrémités du moyeu (poulies)
    const wf = K * M.t1, wr = K * M.t2, WW = 6, NW = 20;           // épaisseurs : flasques, rondelle frein, écrou (px)
    const lx = M.ref - wf, rx = xf + wr;                           // faces extérieures des flasques G et D
    // axe : r40 entre les appuis de flasque, filetage r36 aux extrémités (extrémité = écrou + 5)
    full(fullF, [[lx - WW - NW - 8, 33], [lx - WW - NW - 5, 36], [M.ref, 36], [M.ref, 40], [xf, 40], [xf, 36],
      [rx + WW + NW + 5, 36], [rx + WW + NW + 8, 33]], '#eef4ff');
    el('line', { x1: lx - WW - NW - 5, y1: AXIS - 33, x2: M.ref, y2: AXIS - 33, class: 'thread' }, fix);   // fond de filet
    el('line', { x1: xf, y1: AXIS - 33, x2: rx + WW + NW + 5, y2: AXIS - 33, class: 'thread' }, fix);
    // bagues entretoises (arrêt des bagues intérieures), flasques, rondelles frein, écrous
    box(fix, M.ref, STOP_L, 40, 47, 'sec', H(45, 4, 'f')); box(fix, sr, xf, 40, 47, 'sec', H(45, 4, 'f'));
    flange(fix, lx, M.ref, H(135, 7, 'f')); flange(fix, xf, rx, H(135, 7, 'f'));
    circ(fix, lx - WW, lx, 36, 45); circ(fix, rx, rx + WW, 36, 45);
    box(fix, lx - WW - NW, lx - WW, 36, 46, 'sec', H(45, 7, 'f')); box(fix, rx + WW, rx + WW + NW, 36, 46, 'sec', H(45, 7, 'f'));
    // moyeu (45°) : épaulements internes + gorges d'anneaux élastiques d'alésage
    poly(mov, [[hl, 110], [hr, 110], [hr, 80], [832, 80], [832, 86], [824, 86], [824, 80], [780, 80],
      [780, 68], [756, 68], [756, 80], [268, 80], [268, 68], [244, 68], [244, 80], [200, 80], [200, 86],
      [192, 86], [192, 80], [hl, 80]], 'sec', H(45, 7, 'r'));
    rim(mov, hl, H(135, 7, 'r')); rim(mov, hr - PW, H(135, 7, 'r'));   // poulies G et D (jantes à gorge en V)
    circ(mov, 192, 200, 74, 86);
    circ(mov, 824, 832, 74, 86);
    bearing(mov, RING_G, H(135, 4, 'f'), H(45, 4, 'r'), spin);
    bearing(mov, RING_D, H(135, 4, 'f'), H(45, 4, 'r'), spin);
    // repères (cf. PARTS)
    rep(ann, 410, 490, '1', 410, AXIS + 38);
    rep(ann, M.ref - wf / 2, 500, '7', M.ref - wf / 2, AXIS + 100);
    rep(ann, xf + wr / 2, 500, '8', xf + wr / 2, AXIS + 100);
    rep(ann, 195, 555, '9', (M.ref + STOP_L) / 2, AXIS + 44);
    rep(ann, 845, 555, '10', (sr + xf) / 2, AXIS + 44);
    rep(ann, lx - WW - NW / 2 - 14, 500, '12', lx - WW - NW / 2, AXIS + 41);
    rep(ann, lx - WW / 2, 525, '13', lx - WW / 2, AXIS + 40);
    rep(ann, rx + WW + NW / 2 + 14, 500, '12', rx + WW + NW / 2, AXIS + 41);
    rep(ann, rx + WW / 2, 525, '13', rx + WW / 2, AXIS + 40);
    rep(am, 540, 490, '2', 540, AXIS + 95);
    rep(am, 300, 490, '3', 222, AXIS + 72);
    rep(am, 740, 490, '4', 802, AXIS + 72);
    rep(am, hl + 30, 500, '5', hl + 30, AXIS + 117);
    rep(am, hr - 30, 500, '6', hr - 30, AXIS + 117);
    rep(am, 780, 525, '11', 828, AXIS + 80);
  },
  path(dir) {
    const xs = [-26, -12, -6, 0, 6, 12, 22], rs = [76, 76, 66, 60, 54, 48, 48];
    return xs.map((x, i) => [dir * x, rs[i]]);
  },
  stopR: [40, 47],
  rBot: 128,
  // F agit sur la jante de la poulie D (poussée à droite) ou G (poussée à gauche), face tournée vers l'intérieur
  get endL() { return RING_D + K * M.p2 - PW; },
  get endR() { return RING_G + BW - K * M.p1 + PW; }
};
