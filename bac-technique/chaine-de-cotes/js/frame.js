// Cadre de dessin + cartouche (ISO 5457 / ISO 7200), symbole de projection 1er dièdre (ISO 5456-2)
function drawFrame(svg) {
  const g = el('g', {}, svg), X0 = 520, Y0 = 566, X1 = 994, Y1 = 634;
  el('rect', { x: 6, y: 6, width: 988, height: 628, class: 'fr' }, g);
  el('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, class: 'fr' }, g);
  [Y0 + 22, Y0 + 45].forEach(y => el('line', { x1: X0, y1: y, x2: X1, y2: y, class: 'fth' }, g));
  [X0 + 110, X0 + 300].forEach(x => el('line', { x1: x, y1: Y0, x2: x, y2: Y1, class: 'fth' }, g));
  const t = (x, y, s, c) => txt(g, x, y, s, { class: c || 'ct' });
  t(X0 + 4, Y0 + 15, 'Échelle'); t(X0 + 114, Y0 + 15, 'Matière / ajustements'); t(X0 + 304, Y0 + 15, 'Format');
  t(X0 + 4, Y0 + 38, '1 mm = 4 px'); t(X0 + 114, Y0 + 38, 'Bagues : ISO 286 (k6, H7, N7, g6)');
  t(X0 + 304, Y0 + 38, 'A4 paysage'); t(X0 + 114, Y0 + 61, 'Tolérances générales : ISO 2768-m');
  t(X0 + 4, Y0 + 61, 'Coupe axiale', 'ctb');
  // symbole de projection : tronc de cône vu de côté + deux cercles concentriques (vue de gauche à droite)
  const sx = X0 + 395, sy = Y0 + 38;
  el('polygon', { points: `${sx},${sy - 7} ${sx + 18},${sy - 11} ${sx + 18},${sy + 11} ${sx},${sy + 7}`, class: 'fth' }, g);
  el('line', { x1: sx - 3, y1: sy, x2: sx + 21, y2: sy, class: 'fth', 'stroke-dasharray': '6 2 1 2' }, g);
  [11, 6].forEach(r => el('circle', { cx: sx + 42, cy: sy, r, class: 'fth' }, g));
  el('line', { x1: sx + 28, y1: sy, x2: sx + 56, y2: sy, class: 'fth', 'stroke-dasharray': '6 2 1 2' }, g);
}
