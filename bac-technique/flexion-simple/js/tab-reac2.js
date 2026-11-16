// Onglet 1 : formulaire « Définir l'exercice » (équivalent de ExerciseForm.tsx de la 3ème).
// API : exerciseForm(parent, { onStart(ex), onPreview(ex|null) }) → { el, load(ex) }. Importé par tab-reac.js.
import { h } from './svg.js'
import { EXAMPLES, EXAMPLE_LIST, randomExercise, normalizeExercise, validateExercise, defaultLetter, NAME_RE } from './exercise.js'
import { forceHtml, richText } from './math.js'

const num = (s) => (String(s).trim() === '' ? NaN : Number(String(s).replace(',', '.')))
// name '' = lettre automatique (A, B, C… selon x) ; sinon nom choisi par l'enseignant.
const rowsOf = (ex) => ex.forces.map((f, i) => ({ name: f.id === defaultLetter(i) ? '' : f.id, x: String(f.x), kind: f.kind, val: f.value === undefined ? '' : String(f.value) }))
const senseText = (val) => { const v = num(val); return v > 0 ? '↑ vers le haut' : v < 0 ? '↓ vers le bas' : '—' }

export function exerciseForm(parent, { onStart, onPreview }) {
  const F = { type: 'appuis', L: '1000', rows: rowsOf(EXAMPLES.appuis) }
  const el = h('form', { class: 'card exform', novalidate: '' }, parent, '<h2 tabindex="-1">Définir l\'exercice</h2>')
  const top = h('div', { class: 'xrow' }, el)
  const typ = h('select', {}, h('label', { class: 'f' }, top, '<span>Type de poutre</span>'), '<option value="appuis">Sur 2 appuis</option><option value="encastree">Encastrée</option>')
  const len = h('input', { type: 'number', min: '1', step: 'any', inputmode: 'decimal', value: F.L }, h('label', { class: 'f' }, top, '<span>Longueur de la poutre (mm)</span>'))
  const wrap = h('div', { class: 'tw' }, el)
  const tbl = h('table', { class: 'xf' }, wrap, `<thead><tr><th>Point</th><th>Position x (mm)</th><th>Type</th><th>Sens (selon le signe)</th><th>F (N) : + haut, − bas</th><th><span class="sr-only">Actions</span></th></tr></thead>`)
  const body = h('tbody', {}, tbl)
  const bar = h('div', { class: 'btns' }, el)
  const add = h('button', { type: 'button' }, bar, '+ Force')
  const rnd = h('button', { type: 'button' }, bar, 'Exercice aléatoire')
  const exl = h('label', { class: 'inl' }, bar, '<span>Exemples</span> ')
  const exs = h('select', {}, exl, '<option value="" disabled selected>Choisir…</option>' + EXAMPLE_LIST.map((e, i) => `<option value="${i}">${e.title}</option>`).join(''))
  const err = h('p', { class: 'warn', role: 'alert', hidden: '' }, el)
  h('button', { type: 'submit', class: 'btn on' }, el, 'Commencer')

  const build = () => normalizeExercise({ type: F.type, L: num(F.L), forces: F.rows.map((r, i) => ({ id: 'p' + i, name: r.name, _i: i, x: num(r.x), kind: r.kind, ...(r.kind === 'known' ? { value: num(r.val) } : {}) })) })
  const clean = (ex) => ({ ...ex, forces: ex.forces.map(({ _i, ...f }) => f) })
  const minRows = () => (F.type === 'encastree' ? 2 : 3)
  const sync = () => {
    const ex = build(), letter = {}
    ex.forces.forEach((f, k) => { letter[f._i] = defaultLetter(k) })
    ;[...body.rows].forEach((tr, i) => {
      const r = F.rows[i], ni = tr.querySelector('.pname'), ok = !r.name || NAME_RE.test(r.name)
      ni.placeholder = letter[i]
      ni.setAttribute('aria-invalid', String(!ok))
      tr.querySelector('.fname').innerHTML = forceHtml({ kind: r.kind, id: ok && r.name ? r.name : letter[i] })
      tr.cells[3].textContent = r.kind === 'unknown' ? '—' : senseText(r.val)
      tr.querySelector('.del').disabled = F.rows.length <= minRows()
    })
    add.disabled = F.rows.length >= 5
    onPreview(validateExercise(ex).length ? null : clean(ex))
  }
  const render = (focus) => {
    body.innerHTML = ''
    F.rows.forEach((r, i) => {
      const tr = h('tr', {}, body)
      const cell = (label, html) => h('td', { 'data-label': label }, tr, html)
      const th = h('th', { scope: 'row', 'data-label': 'Point' }, tr)
      const ni = h('input', { type: 'text', class: 'pt pname', maxlength: '3', autocomplete: 'off', spellcheck: 'false', value: r.name, 'aria-label': `Nom du point, ligne ${i + 1} (vide = lettre automatique)` }, th)
      h('span', { class: 'fname' }, th)
      ni.addEventListener('input', () => { r.name = ni.value.trim(); sync() })
      const xi = h('input', { type: 'number', step: 'any', inputmode: 'decimal', value: r.x, 'aria-label': `Position x en mm, ligne ${i + 1}` }, cell('Position x (mm)'))
      const ks = h('select', { 'aria-label': `Type, ligne ${i + 1}` }, cell('Type'), `<option value="known">connue (F)</option><option value="unknown">inconnue (réaction R)</option>`)
      ks.value = r.kind
      cell('Sens')
      const vi = h('input', { type: 'number', step: 'any', inputmode: 'decimal', value: r.val, 'aria-label': `F en N, ligne ${i + 1} : positif vers le haut, négatif vers le bas` }, cell('F (N)'))
      vi.disabled = r.kind === 'unknown'
      const del = h('button', { type: 'button', class: 'del', 'aria-label': `Retirer la ligne ${i + 1}` }, cell('Retirer'), '<span aria-hidden="true">✕</span>')
      xi.addEventListener('input', () => { r.x = xi.value; sync() })
      xi.addEventListener('change', () => { F.rows.sort((a, b) => (num(a.x) || 0) - (num(b.x) || 0)); render() })
      vi.addEventListener('input', () => { r.val = vi.value; sync() })
      ks.addEventListener('change', () => { r.kind = ks.value; render(i) })
      del.addEventListener('click', () => { F.rows.splice(i, 1); render(Math.min(i, F.rows.length - 1)); })
    })
    if (focus !== undefined) body.rows[focus]?.querySelector('input')?.focus()
    sync()
  }
  const load = (ex) => { F.type = ex.type; typ.value = ex.type; F.L = String(ex.L); len.value = F.L; F.rows = rowsOf(ex); err.hidden = true; render() }
  typ.addEventListener('change', () => load(EXAMPLES[typ.value]))
  len.addEventListener('input', () => { F.L = len.value; sync() })
  add.addEventListener('click', () => {
    const L = num(F.L) || 1000, used = new Set(F.rows.map((r) => num(r.x)))
    let x = Math.round(L / 2 / 50) * 50
    while (used.has(x) && x < L) x += 50
    F.rows.push({ x: String(x), kind: 'known', val: '-100' }); render(F.rows.length - 1)
  })
  rnd.addEventListener('click', () => load(randomExercise(Math.floor(Math.random() * 1e9), F.type)))
  exs.addEventListener('change', () => { load(EXAMPLE_LIST[+exs.value]); exs.selectedIndex = 0 })
  el.addEventListener('submit', (e) => {
    e.preventDefault()
    const ex = build(), errors = validateExercise(ex)
    err.hidden = !errors.length
    err.innerHTML = richText(errors.join(' '))
    if (errors.length) return
    onStart(clean(ex))
  })
  render()
  return { el, load }
}
