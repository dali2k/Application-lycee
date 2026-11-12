// Textes pédagogiques dynamiques
const COL = { c: '#111', a: '#111', b: '#111', j: '#111' };
const f1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
const sp = (k, s) => `<b style="color:${COL[k]}">${s}</b>`;

const dirTxt = d => (d > 0 ? 'droite' : 'gauche');
const chainEq = def => def.map(([k, sg]) => (sg > 0 ? '+ ' : '− ') + L(k)).join(' ');
const limEq = def => def.map(([k, sg]) => (sg > 0 ? '+ ' : '− ') + L(k) + (sg > 0 ? 'mini' : 'maxi')).join(' ');

// tableau des jeux mini / nominal / maxi (pire cas) : course J et jeux poulie G, D
function tolHTML() {
  const S = stats(), cg = closeG(), CH = CHAINS[M.mode];
  const r = (n, mini, nom, maxi, note) => `<tr><th>${n}</th><td class="${mini < 0 ? 'ko' : ''}">${f1(mini)}</td>` +
    `<td>${f1(nom)}</td><td>${f1(maxi)}</td><td class="note">${note}</td></tr>`;
  const eq = (n, def, v) => `<p class="eq">${n} = ${chainEq(def)} = <b class="${v < 0 ? 'ko' : 'ok'}">${f1(v)}</b></p>`;
  return `<p class="cond">Jeu étudié : <b>Jp ≥ 0</b> entre la poulie (pièce tournante) et la pièce fixe voisine → pas de frottement. ` +
    `Mini : poulie qui se rapproche ; maxi : poulie opposée (tolérances au pire cas).</p>` +
    `<table class="tol"><tr><th>Jeu (mm)</th><th>mini</th><th>nominal</th><th>maxi</th><th></th></tr>` +
    r('J (course axiale)', S.J.min, S.J.nom, S.J.max, 'jG + jD') +
    r('Jp G (poulie gauche)', S.G.mini.min, S.G.mini.nom, S.G.maxi.max, 'mini : poussée à ' + dirTxt(cg)) +
    r('Jp D (poulie droite)', S.D.mini.min, S.D.mini.nom, S.D.maxi.max, 'mini : poussée à ' + dirTxt(-cg)) + `</table>` +
    eq('Jp G mini', CH.G.mini, S.G.mini.nom) + eq('Jp G maxi', CH.G.maxi, S.G.maxi.nom) +
    eq('Jp D mini', CH.D.mini, S.D.mini.nom) + eq('Jp D maxi', CH.D.maxi, S.D.maxi.nom);
}

function eqHTML() {
  const j = J(), jG = M.g / K, jD = Math.max(0, jpx() - M.g) / K, ok = j >= 0, CH = CHAINS[M.mode];
  const li = k => `<li><b>${L(k)}</b> ${DESC[M.mode][k]}</li>`;
  return `<p class="cond">Condition de course : <b>J ≥ 0</b> (jeu mini) → chaîne <b>unilimite</b></p>` +
    `<p class="eq">J = ${chainEq(CH.J.G)} = <b class="${ok ? 'ok' : 'ko'}">${f1(j)} mm</b></p>` +
    `<p class="eq">J<sub>mini</sub> = ${limEq(CH.J.G)} ≥ 0</p>` +
    (ok ? `<p>Jeu réel : <b>jG</b> = ${f1(jG)} mm · <b>jD</b> = ${f1(jD)} mm → <b>jG + jD = J</b></p>`
      : `<p class="ko">J &lt; 0 : l'ensemble ne peut pas se loger entre les deux obstacles → serrage axial, montage impossible.</p>`) +
    tolHTML() +
    `<ul class="names">${Object.keys(DESC[M.mode]).map(li).join('')}</ul>` +
    `<p class="note">Jeu exagéré pour être visible (1 mm = ${K} px).</p>`;
}

function explHTML() {
  const arbre = M.mode === 'arbre';
  if (J() < 0) return 'Cote c trop courte : augmenter c pour retrouver un jeu positif.';
  if (M.push === null)
    return (arbre ? 'L\'arbre' : 'Le moyeu') + ' est en position intermédiaire : un jeu existe devant chaque roulement (jG et jD). ' +
      'Le roulement G n\'a d\'obstacle que vers la gauche, le roulement D que vers la droite. Utiliser les boutons pour pousser.';
  const mob = arbre ? 'l\'arbre' : 'le moyeu';
  const cl = M.push === closeG() ? 'G' : 'D', op = cl === 'G' ? 'D' : 'G', S = stats();
  const gc = (cl === 'G' ? gapG() : gapD()) / K, go = (cl === 'G' ? gapD() : gapG()) / K;
  const fo = `<br><b>Force vers la ${dirTxt(M.push)}</b> : la poulie ${cl} se rapproche, son jeu tombe à <b>Jp ${cl} mini = ${f1(gc)} mm</b> ` +
    `(garanti ≥ ${f1(S[cl].mini.min)} mm) ; la poulie ${op} s\'éloigne, jeu <b>maxi = ${f1(go)} mm</b> (≤ ${f1(S[op].maxi.max)} mm).` +
    (S[cl].mini.min < 0 ? ' <span class="ko">Jp mini &lt; 0 : risque de frottement poulie / pièce fixe.</span>' : '');
  const r = arbre
    ? ['épaulement de l\'arbre → bague int. D → billes → bague ext. D → <b>couvercle D</b> → bâti',
       'épaulement de l\'arbre → bague int. G → billes → bague ext. G → <b>couvercle G</b> → bâti']
    : ['épaulement du moyeu → bague ext. D → billes → bague int. D → <b>entretoise D</b> → flasque D',
       'épaulement du moyeu → bague ext. G → billes → bague int. G → <b>entretoise G</b> → flasque G'];
  return M.push > 0
    ? `<b>Poussée à droite.</b> ${mob} s'arrête sur le <b>roulement D</b>. Chemin de l'effort : ${r[0]}.<br>Le jeu J se retrouve côté <b>roulement gauche</b> (jG = J).${fo}`
    : `<b>Poussée à gauche.</b> ${mob} s'arrête sur le <b>roulement G</b>. Chemin de l'effort : ${r[1]}.<br>Le jeu J se retrouve côté <b>roulement droit</b> (jD = J).${fo}`;
}
