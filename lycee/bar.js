/* Barre de navigation commune : Accueil > Niveau > Application */
(function () {
  var LABELS = { '3eme-technique': '3ème Technique', 'bac-technique': 'Bac technique',
    'statique-des-solides': 'Statique des solides', 'chaine-de-cotes': 'Chaîne de cotes unilimites', 'torsion-simple': 'Torsion simple' };
  var s = document.currentScript || document.querySelector('script[src$="lycee/bar.js"]');
  var root = new URL('../', s.src).pathname;
  var segs = location.pathname.slice(root.length).split('/').filter(Boolean);
  segs = segs.filter(function (x) { return !/\.html?$/.test(x); });
  var bar = document.createElement('nav');
  bar.className = 'l-bar'; bar.setAttribute('aria-label', 'Navigation');
  var parts = [['Accueil', root]];
  segs.forEach(function (x, i) { parts.push([LABELS[x] || x, root + segs.slice(0, i + 1).join('/') + '/']); });
  parts.forEach(function (p, i) {
    if (i) { var sp = document.createElement('span'); sp.className = 'sep'; sp.textContent = '›'; bar.appendChild(sp); }
    var last = i === parts.length - 1, el = document.createElement(last ? 'span' : 'a');
    el.textContent = p[0]; if (last) el.className = 'cur'; else el.href = p[1];
    bar.appendChild(el);
  });
  function mount() {
    document.body.insertBefore(bar, document.body.firstChild);
    if (document.getElementById('app')) document.body.classList.add('l-app');
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
