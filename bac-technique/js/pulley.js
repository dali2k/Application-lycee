// Poulies (demi-coupe hachurée) et flasque fixe de l'axe. x0 = face gauche, PW = largeur (px)
const PW = 36;

// poulie clavetée sur la portée r34 : moyeu r34-60, voile, jante r88-104 à gorge en V (rotative)
function pulley(p, x0, fill) {
  const W = PW, x = d => x0 + d;
  return poly(p, [[x(0), 34], [x(W), 34], [x(W), 60], [x(W - 10), 60], [x(W - 10), 88], [x(W), 88], [x(W), 104],
    [x(W * .62), 104], [x(W / 2), 94], [x(W * .38), 104], [x(0), 104], [x(0), 88], [x(10), 88], [x(10), 60], [x(0), 60]],
    'sec', fill);
}

// jante à gorge en V rapportée sur l'extrémité du moyeu (r110-124)
function rim(p, x0, fill) {
  const W = PW, x = d => x0 + d;
  return poly(p, [[x(0), 110], [x(W), 110], [x(W), 124], [x(W * .62), 124], [x(W / 2), 114], [x(W * .38), 124],
    [x(0), 124]], 'sec', fill);
}

// flasque fixe monté sur le filetage de l'axe (r36-128), en regard de l'extrémité du moyeu
function flange(p, x0, x1, fill) { return box(p, x0, x1, 36, 128, 'sec', fill); }
