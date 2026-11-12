const $ = id => document.getElementById(id);
const G = {}, spin = [], cache = {};

function init() {
  const svg = $('svg');
  initPatterns(svg.querySelector('defs'));
  G.fullF = el('g', {}, svg); G.fullM = el('g', {}, svg);   // pièces pleines, non coupées
  const sc = el('g', { id: 'scene' }, svg);
  G.fix = el('g', {}, sc); G.mov = el('g', {}, sc); G.ovl = el('g', { id: 'ovl' }, sc);
  // demi-coupe basse : 2e construction en groupe miroir (hachures re-inversées, cf. MIRROR dans dim.js)
  const low = el('g', { transform: `translate(0,${2 * AXIS}) scale(1,-1)` }, svg);
  G.fix2 = el('g', {}, low); G.mov2 = el('g', {}, low);
  el('use', { href: '#ovl', transform: `translate(0,${2 * AXIS}) scale(1,-1)` }, svg);
  G.ann = el('g', {}, svg); G.annMov = el('g', {}, svg); G.dyn = el('g', {}, svg);
  build();
  drawFrame(svg);
}

function build() {
  [G.fix, G.mov, G.fix2, G.mov2, G.ann, G.annMov, G.fullF, G.fullM].forEach(clear);
  spin.length = 0;
  const T = M.mode === 'arbre' ? Shaft : Hub;
  T.build(G.fix, G.mov, spin, G.ann, G.annMov, G.fullF, G.fullM);
  MIRROR = true;
  T.build(G.fix2, G.mov2, spin, el('g'), el('g'), el('g'), el('g'));   // étiquettes/pièces pleines jetées
  MIRROR = false;
  // axe : tiret-point fin, dépassant le contour de 2 à 3 mm
  el('line', { x1: 60, y1: AXIS, x2: 960, y2: AXIS, class: 'axis' }, G.ann);
}

function setHTML(id, html) {
  if (cache[id] !== html) { $(id).innerHTML = html; cache[id] = html; }
}

let last = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
  step(dt);
  const tr = `translate(${M.g},0)`;
  G.mov.setAttribute('transform', tr);
  G.mov2.setAttribute('transform', tr);
  G.annMov.setAttribute('transform', tr);
  G.fullM.setAttribute('transform', tr);
  if (M.rot) {
    M.angle = (M.angle + dt * 240) % 360;
    spin.forEach(s => s.el.setAttribute('transform', `rotate(${M.angle} ${s.cx} ${s.cy})`));
  }
  drawChain(G.dyn, G.ovl);
  setHTML('eq', eqHTML());
  setHTML('expl', explHTML());
  $('btnL').classList.toggle('on', M.push === -1);
  $('btnR').classList.toggle('on', M.push === 1);
  requestAnimationFrame(frame);
}

function setMode(m) {
  M.mode = m;
  const P = PROF[m], r = $('cRange');
  Object.assign(M, { ref: P.ref, a1: P.a1, a2: P.a2, c: P.c, p1: P.p, p2: P.p, e1: P.e, e2: P.e, t1: P.t, t2: P.t });
  $('parts').innerHTML = PARTS[m].map(([n, t]) => `<span><b>${n}</b> ${t}</span>`).join('');
  $('jpRange').value = Math.round(JpG() * 10) / 10; $('jpVal').textContent = f1(JpG()) + ' mm';
  r.min = P.cMin; r.max = P.cMax; r.value = P.c; $('cVal').textContent = f1(P.c) + ' mm';
  $('tabArbre').classList.toggle('on', m === 'arbre');
  $('tabHub').classList.toggle('on', m === 'hub');
  $('btnL').textContent = m === 'arbre' ? '◄ Pousser l\'arbre à gauche' : '◄ Pousser le moyeu à gauche';
  $('btnR').textContent = m === 'arbre' ? 'Pousser l\'arbre à droite ►' : 'Pousser le moyeu à droite ►';
  M.g = jpx() / 2; resetM(); build();
}

$('btnL').onclick = () => setPush(-1);
$('btnR').onclick = () => setPush(1);
$('btnReset').onclick = resetM;
$('rot').onchange = e => { M.rot = e.target.checked; };
$('tabArbre').onclick = () => setMode('arbre');
$('tabHub').onclick = () => setMode('hub');
['G', 'D', 'J'].forEach(k => { $('ch' + k).onclick = () => { M.chain = k; selChain(); }; });
function selChain() { ['G', 'D', 'J'].forEach(k => $('ch' + k).classList.toggle('on', M.chain === k)); }
$('lc').onchange = e => { M.lower = e.target.checked; };
$('jpRange').oninput = e => {
  setJp(+e.target.value);
  $('jpVal').textContent = f1(+e.target.value) + ' mm';
  clampG(); build();
};
$('cRange').oninput = e => {
  M.c = +e.target.value;
  $('cVal').textContent = f1(M.c) + ' mm';
  clampG(); build();
};
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') setPush(-1);
  else if (e.key === 'ArrowRight') setPush(1);
  else if (e.key === 'Escape') resetM();
});

init();
setMode('arbre');
requestAnimationFrame(frame);
