// Exemple 1 : ARBRE TOURNANT (bâti fixe), montage à obstacle sur chaque roulement.
// G : bague extérieure arrêtée à gauche seulement (couvercle G) ; D : arrêtée à droite seulement (couvercle D).
// Bagues intérieures serrées, arrêtées des 2 côtés (épaulement + anneau élastique pour arbre).
// Poulies entre un épaulement d'arbre (côté couvercle) et un écrou + rondelle frein (côté extérieur) :
// rayons d'arbre r30 (filetage) < r34 (portée de poulie) < r40 (portée de bague et passage de couvercle, alésage r44) < r56 (corps).
// Montage possible : poulie, bagues et anneaux glissent depuis l'extrémité sur des rayons toujours plus petits ou égaux.
// L'arbre (pièce pleine) n'est pas coupé : silhouette non hachurée.
const Shaft = {
  build(fix, mov, spin, ann, am, fullF, fullM) {
    const xr = M.ref + K * M.c, sr = stopR();   // face droite du bâti, extrémité du centrage D
    const xl = M.ref - K * M.e1, xrf = xr + K * M.e2;                // faces extérieures des brides des couvercles
    const pg = RING_G + BW - K * M.p1 - PW, pd = RING_D + K * M.p2;  // poulies : face gauche (G), face intérieure (D)
    const WW = 5, NW = 16, SEAT = 32;                                // rondelle frein, écrou, longueur de portée de poulie (px)
    const xe1 = pg - WW - NW - 3, xe2 = pd + PW + WW + NW + 3;       // extrémités filetées de l'arbre
    full(fullM, [[xe1, 27], [xe1 + 3, 30], [pg + PW - SEAT, 30], [pg + PW - SEAT, 34], [pg + PW, 34], [pg + PW, 40],
      [192, 40], [192, 37], [200, 37], [200, 40], [244, 40], [244, 56], [780, 56], [780, 40], [824, 40], [824, 37],
      [832, 37], [832, 40], [pd, 40], [pd, 34], [pd + SEAT, 34], [pd + SEAT, 30], [xe2 - 3, 30], [xe2, 27]], '#fff3e6');
    // bâti (45°) sans épaulement intérieur ; couvercles (135°) vissés
    box(fix, M.ref, xr, 80, 110, 'sec', H(45, 7, 'f'));
    // lamage (r89-107, prof. 14) + trou de passage (r93-103) : la coupe de bride est scindée en deux régions
    const hf = H(135, 7, 'f');
    poly(fix, [[xl, 44], [xl, 89], [xl + 14, 89], [xl + 14, 93], [176, 93], [176, 80], [200, 80], [200, 68], [176, 68],
      [176, 44]], 'sec', hf);
    poly(fix, [[xl, 110], [176, 110], [176, 103], [xl + 14, 103], [xl + 14, 107], [xl, 107]], 'sec', hf);
    poly(fix, [[xr, 44], [xrf, 44], [xrf, 89], [xrf - 14, 89], [xrf - 14, 93], [xr, 93], [xr, 80], [sr, 80], [sr, 68],
      [xr, 68]], 'sec', hf);
    poly(fix, [[xr, 110], [xrf, 110], [xrf, 107], [xrf - 14, 107], [xrf - 14, 103], [xr, 103]], 'sec', hf);
    // vis à tête cylindrique noyée dans le lamage (2 px sous la face), taraudée dans le bâti
    screw(fix, xl + 2, xl + 14, xl + 46, 98);
    screw(fix, xrf - 2, xrf - 14, xrf - 46, 98);
    // ensemble mobile : anneaux élastiques d'arbre + roulements G et D
    circ(mov, 192, 200, 37, 47);
    circ(mov, 824, 832, 37, 47);
    // poulies G et D (rotatives, appuyées sur l'épaulement) + rondelles frein + écrous (filetage r30)
    pulley(mov, pg, H(135, 7, 'r')); pulley(mov, pd, H(135, 7, 'r'));
    circ(mov, pg - WW, pg, 30, 40); circ(mov, pd + PW, pd + PW + WW, 30, 40);
    box(mov, pg - WW - NW, pg - WW, 30, 42, 'sec', H(45, 4, 'r'));
    box(mov, pd + PW + WW, pd + PW + WW + NW, 30, 42, 'sec', H(45, 4, 'r'));
    el('line', { x1: xe1, y1: AXIS - 27, x2: pg + PW - SEAT, y2: AXIS - 27, class: 'thread' }, mov);   // fond de filet
    el('line', { x1: pd + SEAT, y1: AXIS - 27, x2: xe2, y2: AXIS - 27, class: 'thread' }, mov);
    bearing(mov, RING_G, H(135, 4, 'r'), H(45, 4, 'f'), spin);
    bearing(mov, RING_D, H(135, 4, 'r'), H(45, 4, 'f'), spin);
    // repères (cf. PARTS)
    rep(ann, 410, 490, '1', 410, AXIS + 95);
    rep(ann, 130, 500, '2', xl + 8, AXIS + 62);
    rep(ann, 900, 500, '3', xrf - 8, AXIS + 62);
    rep(ann, 215, 525, '10', xl + 30, AXIS + 98);
    rep(ann, 860, 525, '10', xrf - 30, AXIS + 98);
    rep(am, 560, 490, '4', 560, AXIS + 48);
    rep(am, 300, 490, '5', 222, AXIS + 72);
    rep(am, 740, 490, '6', 802, AXIS + 72);
    rep(am, pg + 10, 490, '7', pg + 10, AXIS + 80);
    rep(am, pd + 26, 490, '8', pd + 26, AXIS + 80);
    rep(am, 175, 490, '9', 196, AXIS + 42);
    rep(am, 828, 490, '9', 828, AXIS + 42);
    rep(am, pg - 22, 500, '11', pg - WW - NW / 2, AXIS + 36);
    rep(am, pg - 2, 525, '12', pg - WW / 2, AXIS + 35);
    rep(am, pd + PW + WW + NW / 2 + 14, 500, '11', pd + PW + WW + NW / 2, AXIS + 36);
    rep(am, pd + PW + WW / 2, 525, '12', pd + PW + WW / 2, AXIS + 35);
  },
  // trajet de l'effort axial : points [dx relatif au centre du roulement, r]
  path(dir) {
    const xs = [-26, -12, -6, 0, 6, 12, 22], rs = [44, 48, 54, 60, 66, 74, 74];
    return xs.map((x, i) => [dir * x, rs[i]]);
  },
  stopR: [68, 78],   // rayons des surfaces de butée (bague ext.)
  rBot: 110,         // rayon max des pièces fixes (pose des lignes d'attache)
  // extrémités de l'arbre (flèche F), suivent la position des poulies (poulie + rondelle + écrou + 3)
  get endL() { return RING_G + BW - K * M.p1 - PW - 24; },
  get endR() { return RING_D + K * M.p2 + PW + 24; }
};
