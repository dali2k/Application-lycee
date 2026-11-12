// Routeur d'onglets : chaque module tab-*.js exporte mount(root) → fonction de nettoyage.
const TABS = [
  ['essai', '1 · La torsion'],
  ['tau', '2 · Contrainte τ'],
  ['io', '3 · Moment quadratique'],
  ['calc', '4 · Calculs'],
  ['quiz', '5 · Quiz'],
]
const nav = document.getElementById('tabs')
const view = document.getElementById('view')
let cleanup = null

const buttons = TABS.map(([id, label]) => {
  const b = document.createElement('button')
  b.textContent = label
  b.type = 'button'
  b.addEventListener('click', () => show(id))
  nav.appendChild(b)
  return b
})

async function show(id) {
  if (cleanup) cleanup()
  cleanup = null
  view.innerHTML = ''
  buttons.forEach((b, i) => b.classList.toggle('on', TABS[i][0] === id))
  try {
    const m = await import(`./tab-${id}.js`)
    cleanup = m.mount(view) || null
  } catch (e) {
    view.innerHTML = `<p class="warn">Erreur de chargement : ${e.message}</p>`
  }
  history.replaceState(null, '', '#' + id)
}

const start = location.hash.slice(1)
show(TABS.some(([id]) => id === start) ? start : 'essai')
