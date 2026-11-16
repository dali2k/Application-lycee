// Routeur d'onglets : chaque module tab-*.js exporte mount(root) → fonction de nettoyage.
const TABS = [
  ['reac', '1 · Réactions'],
  ['coupe', '2 · Coupure & point G'],
  ['diag', '3 · Diagrammes T et Mf'],
  ['io', '4 · Moment quadratique'],
  ['sigma', '5 · Contraintes & calculs'],
  ['quiz', '6 · Quiz'],
]
const nav = document.getElementById('tabs')
const view = document.getElementById('view')
let cleanup = null

const buttons = TABS.map(([id, label]) => {
  const b = document.createElement('button')
  b.textContent = label
  b.type = 'button'
  b.setAttribute('role', 'tab')
  b.addEventListener('click', () => show(id))
  nav.appendChild(b)
  return b
})

async function show(id) {
  if (cleanup) cleanup()
  cleanup = null
  view.innerHTML = ''
  buttons.forEach((b, i) => {
    const on = TABS[i][0] === id
    b.classList.toggle('on', on)
    b.setAttribute('aria-selected', String(on))
    if (on) b.scrollIntoView({ inline: 'center', block: 'nearest' })
  })
  try {
    const m = await import(`./tab-${id}.js`)
    cleanup = m.mount(view) || null
  } catch (e) {
    view.innerHTML = `<p class="warn">Erreur de chargement : ${e.message}</p>`
  }
  history.replaceState(null, '', '#' + id)
}

const start = location.hash.slice(1)
show(TABS.some(([id]) => id === start) ? start : 'reac')
