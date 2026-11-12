// Roulement à billes à contact radial (BC, rainure profonde) en demi-coupe
// Représentation : bagues hachurées (sens opposés), billes non coupées, cage en trait.
// bague int. r 40..56, bague ext. r 64..80, bille centre r 60 (rayon 6), largeur 44, chanfreins 2
const BW = 44, BALL_R = 6, BALL_C = 60, CH = 2;

function bearing(p, x0, inFill, outFill, spin) {
  const cx = x0 + BW / 2, hw = Math.sqrt(BALL_R * BALL_R - 16);
  const y = r => AXIS - r, w = x0 + BW, g = el('g', {}, p);
  el('path', {
    d: `M${x0 + CH},${y(40)} L${w - CH},${y(40)} L${w},${y(40 + CH)} L${w},${y(56 - CH)} L${w - CH},${y(56)} ` +
       `L${cx + hw},${y(56)} A${BALL_R},${BALL_R} 0 0 1 ${cx - hw},${y(56)} L${x0 + CH},${y(56)} ` +
       `L${x0},${y(56 - CH)} L${x0},${y(40 + CH)} Z`, class: 'sec', fill: inFill
  }, g);
  el('path', {
    d: `M${x0 + CH},${y(80)} L${w - CH},${y(80)} L${w},${y(80 - CH)} L${w},${y(64 + CH)} L${w - CH},${y(64)} ` +
       `L${cx + hw},${y(64)} A${BALL_R},${BALL_R} 0 0 0 ${cx - hw},${y(64)} L${x0 + CH},${y(64)} ` +
       `L${x0},${y(64 + CH)} L${x0},${y(80 - CH)} Z`, class: 'sec', fill: outFill
  }, g);
  // cage (trait fin entre les billes)
  el('line', { x1: cx - 9, y1: y(BALL_C), x2: cx + 9, y2: y(BALL_C), class: 'thread' }, g);
  el('circle', { cx, cy: y(BALL_C), r: BALL_R, fill: 'url(#ball)', class: 'ball' }, g);
  // centre de la bille : trait fin d'axe, dépassant de 2 mm
  el('line', { x1: cx, y1: y(BALL_C) - BALL_R - 5, x2: cx, y2: y(BALL_C) + BALL_R + 5, class: 'thread' }, g);
  const m = el('line', { x1: cx, y1: y(BALL_C), x2: cx, y2: y(BALL_C) - BALL_R + 1, class: 'spin' }, g);
  spin.push({ el: m, cx, cy: y(BALL_C) });
  return g;
}
