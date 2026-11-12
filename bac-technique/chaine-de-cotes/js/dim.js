// Helpers SVG + constantes géométriques (1 mm = K px, demi-coupe au-dessus de l'axe)
const NS = 'http://www.w3.org/2000/svg';
const AXIS = 300;   // ordonnée de l'axe de rotation
const K = 4;        // px par mm

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function clear(g) { while (g.firstChild) g.removeChild(g.firstChild); }

// points [x, r] : r = rayon au-dessus de l'axe
function poly(p, pts, cls, fill) {
  const a = { points: pts.map(([x, r]) => x + ',' + (AXIS - r)).join(' '), class: cls };
  if (fill) a.fill = fill;
  return el('polygon', a, p);
}

function box(p, x0, x1, r0, r1, cls, fill) {
  return poly(p, [[x0, r0], [x1, r0], [x1, r1], [x0, r1]], cls, fill);
}

// pièce pleine (arbre, axe) : silhouette complète, NON coupée, non hachurée (NF EN ISO 128-50)
function full(p, top, fill) {
  const bot = top.map(([x, r]) => [x, -r]).reverse();
  return poly(p, top.concat(bot), 'plein', fill);
}

// anneau élastique en coupe (petite section pleine)
function circ(p, x0, x1, r0, r1) { return box(p, x0, x1, r0, r1, 'circ'); }

// vis (pièce pleine, filetage en trait fin) en demi-vue
function screw(p, xh, xs, xe, r) {
  box(p, Math.min(xh, xs), Math.max(xh, xs), r - 7, r + 7, 'plein', '#fff');
  box(p, Math.min(xs, xe), Math.max(xs, xe), r - 4, r + 4, 'plein', '#fff');
  el('line', { x1: xs, y1: AXIS - r - 3.2, x2: xe, y2: AXIS - r - 3.2, class: 'thread' }, p);   // fond de filet (trait fin)
  el('line', { x1: xs, y1: AXIS - r + 3.2, x2: xe, y2: AXIS - r + 3.2, class: 'thread' }, p);
}

// hachures normalisées : 45° / 135°, trait fin continu (0,5 × trait fort)
function initPatterns(defs) {
  [45, 135].forEach(a => [4, 7].forEach(sp => ['r', 'f'].forEach(w => {
    const pt = el('pattern', { id: `h${a}_${sp}${w}`, width: sp, height: sp, patternUnits: 'userSpaceOnUse',
      patternTransform: `rotate(${a})` }, defs);
    el('rect', { width: sp, height: sp, fill: '#fff' }, pt);
    el('line', { x1: 0, y1: 0, x2: 0, y2: sp, stroke: w === 'r' ? '#c2610c' : '#2f5fc4', 'stroke-width': 0.7 }, pt);
  })));
}
// MIRROR : demi-coupe basse dessinée dans un groupe miroir → sens inversé pour que la hachure
// d'une même pièce garde le même sens de part et d'autre de l'axe (ISO 128-50)
let MIRROR = false;
const H = (a, sp, w) => `url(#h${MIRROR ? 180 - a : a}_${sp}${w})`;

function txt(p, x, y, s, attrs) {
  const t = el('text', Object.assign({ x, y }, attrs || {}), p);
  t.textContent = s;
  return t;
}

// pointe de flèche pleine ISO 129 : longueur AL, largeur AL/3 (~19°), taille unique sur tout le dessin
const AL = 10;
function arrow(p, x, y, d, col, hw) {
  const w = hw || AL / 6;
  return el('polygon', { points: `${x},${y} ${x + d * AL},${y - w} ${x + d * AL},${y + w}`, fill: col }, p);
}

// cote horizontale à double flèche ; flèches renversées (à l'extérieur) si la cote est trop courte
function hdim(p, x1, x2, y, col, label) {
  const s = x2 >= x1 ? 1 : -1, out = Math.abs(x2 - x1) < 2 * AL + 2, o = out ? -1 : 1;
  el('line', { x1: out ? x1 - s * (AL + 4) : x1, y1: y, x2: out ? x2 + s * (AL + 4) : x2, y2: y,
    stroke: col, 'stroke-width': 0.7 }, p);
  [[x1, s], [x2, -s]].forEach(([x, d]) => arrow(p, x, y, d * o, col));
  if (label) txt(p, (x1 + x2) / 2, y - 6, label, { fill: col, 'text-anchor': 'middle', class: 'dt' });
}

function vext(p, x, y1, y2) {
  el('line', { x1: x, y1, x2: x, y2, class: 'ext' }, p);
}

// étiquette avec ligne de rappel
function lab(p, tx, ty, s, px, py) {
  el('line', { x1: tx, y1: ty - 13, x2: px, y2: py, class: 'lead' }, p);
  el('circle', { cx: px, cy: py, r: 2, class: 'leadDot' }, p);   // point : repère sur une surface
  txt(p, tx, ty, s, { 'text-anchor': 'middle', class: 'lab' });
}

function sub(p, x, y, s) {
  txt(p, x, y, s, { 'text-anchor': 'middle', class: 'sub' });
}

// vecteur de cote (NF E 04-550) : simple trait = cote composante, double trait = cote condition
function vec(p, x1, x2, y, label, dbl, bad) {
  const s = x2 >= x1 ? 1 : -1, a = Math.min(AL, Math.abs(x2 - x1) * 0.6), c = bad ? '#dc2626' : '#111';
  (dbl ? [-2.2, 2.2] : [0]).forEach(o =>
    el('line', { x1, y1: y + o, x2: x2 - s * a, y2: y + o, stroke: c, 'stroke-width': 0.7 }, p));
  el('polygon', { points: `${x2},${y} ${x2 - s * a},${y - (dbl ? 4 : a / 6)} ${x2 - s * a},${y + (dbl ? 4 : a / 6)}`,
    fill: c }, p);
  txt(p, (x1 + x2) / 2, y - 6, label, { fill: c, 'text-anchor': 'middle', class: 'dt' });
}

// repère de pièce : numéro dans un cercle (ISO 6433), ligne de rappel fine terminée par un point sur la surface
function rep(p, tx, ty, n, px, py) {
  const dx = px - tx, dy = py - ty, d = Math.hypot(dx, dy) || 1, r = 9;
  el('line', { x1: tx + dx / d * r, y1: ty + dy / d * r, x2: px, y2: py, class: 'lead' }, p);
  el('circle', { cx: px, cy: py, r: 2, class: 'leadDot' }, p);
  el('circle', { cx: tx, cy: ty, r, class: 'repc' }, p);
  txt(p, tx, ty + 4.5, n, { 'text-anchor': 'middle', class: 'repn' });
}
