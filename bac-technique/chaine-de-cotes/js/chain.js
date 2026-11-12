// Dessin dynamique : chaîne de cotes (NF E 04-550) du jeu poulie / pièce fixe, contacts, trajet de l'effort, flèche F
// Condition Jp = jeu entre la poulie (tournante) et la pièce fixe voisine, côté qui se ferme sous l'effort.
// Chaîne tracée dans la position fermante (g = 0 ou g = J) ; vecteur : [clé, libellé, x départ, x arrivée, (cote condition)]
function chainRows(def, x0) {
  let x = x0;
  const rows = def.map(([k, sg]) => {
    const x2 = x + sg * K * dimVal(k), r = [k, (sg > 0 ? '+ ' : '− ') + L(k), x, x2];
    x = x2;
    return r;
  });
  return [['J', '', x0, x, 1]].concat(rows);
}

// intervalles [gauche, droite] des jeux poulie à la position courante (px) : G puis D
function gapSpans(off) {
  const hl = RING_G + BW - K * M.p1 + off, hr = RING_D + K * M.p2 + off;
  const lf = M.ref - K * M.e1, rf = M.ref + K * M.c + K * M.e2;
  return M.mode === 'arbre' ? [[hl, lf], [rf, hr]] : [[STOP_L - K * M.a1 - K * M.e1, hl], [hr, rf]];
}

function drawChain(dyn, ovl) {
  clear(dyn); clear(ovl);
  const T = M.mode === 'arbre' ? Shaft : Hub, off = M.g, jn = J(), sr = stopR(), bad = jn < 0;
  const sel = M.chain, cs = sel === 'G' ? closeG() : -closeG();
  const mini = M.push === null || M.push === cs;           // poussée vers le côté qui se ferme (ou repos) : jeu mini
  let def, x0;
  if (sel === 'J') {
    const left = M.push !== -1;
    def = CHAINS[M.mode].J[left ? 'G' : 'D'];
    x0 = left ? STOP_L : STOP_L + K * (M.b1 + M.d + M.b2);
  } else {
    def = CHAINS[M.mode][sel][mini ? 'mini' : 'maxi'];
    x0 = gapSpans(mini === (cs > 0) ? jpx() : 0)[sel === 'G' ? 0 : 1][0];   // borne gauche du jeu (position fermante / ouverte)
  }
  const vs = chainRows(def, x0), y0 = 54, dy = 18, yTop = 170;
  const name = sel === 'J' ? 'J' : 'Jp ' + sel, neg = sel === 'J' ? bad : mini && (sel === 'G' ? JpG() : JpD()) < 0;
  // --- chaîne NF E 04-550 : condition en double trait, composantes simple trait, lettres + n° de pièce
  const xs = new Set(); vs.forEach(v => { xs.add(v[2]); xs.add(v[3]); });
  xs.forEach(x => vext(dyn, x, y0 - 8, yTop));
  vs.forEach((v, i) => vec(dyn, v[2], v[3], y0 + i * dy, v[4] ? name : v[1], !!v[4], neg && !!v[4]));
  txt(dyn, 16, 26, name + (sel === 'J' ? '' : mini ? ' mini' : ' maxi') +
    (M.push === null ? '' : ' · poussée à ' + dirTxt(M.push)), { class: 'pc', 'text-anchor': 'start' });
  // --- jeux poulie réels (position courante) sous la coupe : repère pour l'animation
  const yR = 444, y1 = AXIS + T.rBot + 4, gaps = [gapG(), gapD()];
  gapSpans(off).forEach(([a, b], i) => {
    const c = gaps[i] < 0 ? '#dc2626' : '#16a34a';
    [a, b].forEach(x => vext(dyn, x, y1, yR + 8));
    if (Math.abs(b - a) > 1) hdim(dyn, a, b, yR, c, 'jp' + (i ? 'D ' : 'G ') + f1(gaps[i] / K));
  });
  // --- butées en contact
  const ct = contact(), [r0, r1] = T.stopR;
  const hl = x => el('line', { x1: x, y1: AXIS - r0, x2: x, y2: AXIS - r1, class: 'hit' }, ovl);
  if (ct === 'L' || ct === 'both') hl(STOP_L);
  if (ct === 'R' || ct === 'both') hl(sr);
  // --- trajet de l'effort : par le roulement D vers la droite, par le roulement G vers la gauche
  if (M.push !== null && jn >= 0) {
    const cx = (M.push > 0 ? RING_D : RING_G) + 22 + off;
    const pts = T.path(M.push).map(([dx, r]) => (cx + dx) + ',' + (AXIS - r)).join(' ');
    el('polyline', { points: pts, class: 'force', 'marker-end': 'url(#arr)' }, ovl);
  }
  // --- flèche d'effort extérieure F (sur la poulie / le bout d'arbre)
  if (M.push !== null) {
    const y = M.mode === 'arbre' ? AXIS : AXIS - 117, r = M.push > 0;
    const tip = (r ? T.endL : T.endR) + off, x0 = r ? tip - 28 : tip + 28;
    el('line', { x1: x0, y1: y, x2: tip, y2: y, class: 'fline', 'marker-end': 'url(#arr)' }, dyn);
    txt(dyn, x0 + (r ? 4 : -4), y - 10, 'F', { class: 'fl', 'text-anchor': r ? 'start' : 'end' });
  }
  txt(dyn, 500, AXIS - 66, M.rot ? '↻  ω ' + (M.mode === 'arbre' ? '(arbre)' : '(moyeu)') : '(à l\'arrêt)',
    { 'text-anchor': 'middle', class: 'omega' });
  if (bad) txt(dyn, 500, 40, 'J < 0 : montage impossible (c < a₁ + a₂ + b₁ + d + b₂)',
    { 'text-anchor': 'middle', class: 'warn' });
  if (friction()) txt(dyn, 500, 24, 'Jp < 0 : frottement poulie / pièce fixe',
    { 'text-anchor': 'middle', class: 'warn' });
}
