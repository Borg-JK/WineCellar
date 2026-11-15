import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { ensureProducer, type NewWine } from '../lib/db'
import { WINE_TYPES, type Wine, type WineType } from '../lib/types'
import { cx, slug } from '../lib/util'
import { useApp } from '../state/AppContext'
import { Field } from './ui'

const COUNTRIES = ['France', 'Italy', 'Spain', 'Portugal', 'Germany', 'Austria', 'Netherlands', 'Greece', 'Hungary', 'Georgia', 'Lebanon', 'South Africa', 'Chile', 'Argentina', 'Uruguay', 'United States', 'Canada', 'Australia', 'New Zealand']
/** Common grapes first (shown before you type), then the rest. Grapes of wines already in the app are added on top. */
const GRAPES = [
  'Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Shiraz', 'Grenache', 'Tempranillo', 'Sangiovese', 'Malbec', 'Primitivo',
  'Nebbiolo', 'Gamay', 'Chardonnay', 'Sauvignon Blanc', 'Pinot Grigio', 'Riesling', 'Chenin Blanc', 'Verdejo', 'Viognier',
  'Grüner Veltliner', 'Albariño', 'Glera',
  'Aglianico', 'Alvarinho', 'Arinto', 'Assyrtiko', 'Barbera', 'Blaufränkisch', 'Bonarda', 'Cabernet Franc', 'Carignan', 'Carménère',
  'Catarratto', 'Cinsault', 'Colombard', 'Corvina', 'Cortese', 'Dolcetto', 'Fiano', 'Furmint', 'Garganega', 'Garnacha', 'Gewürztraminer',
  'Godello', 'Greco', 'Grillo', 'Lambrusco', 'Loureiro', 'Macabeo', 'Marsanne', 'Melon de Bourgogne', 'Monastrell', 'Montepulciano',
  'Moscato', 'Mourvèdre', 'Muscat', 'Müller-Thurgau', 'Nero d\'Avola', 'Palomino', 'Parellada', 'Pedro Ximénez', 'Petit Verdot',
  'Picpoul', 'Pinot Blanc', 'Pinot Gris', 'Pinot Meunier', 'Pinotage', 'Rkatsiteli', 'Roussanne', 'Saperavi', 'Sémillon', 'Silvaner',
  'Tannat', 'Torrontés', 'Touriga Nacional', 'Trebbiano', 'Ugni Blanc', 'Verdicchio', 'Vermentino', 'Xarel·lo', 'Zinfandel', 'Zweigelt',
]

export interface WineDraft {
  name: string
  producer: string
  type: WineType
  grapes: string
  country: string
  region: string
  abv: string
  organic: boolean
  storeIds: string[]
}

export const draftFrom = (w?: Wine, prefill: Partial<WineDraft> = {}): WineDraft => ({
  name: w?.name ?? '', producer: w?.producer ?? '', type: w?.type ?? 'red', grapes: w?.grapes.join(', ') ?? '',
  country: w?.country ?? '', region: w?.region ?? '', abv: w?.abv ? String(w.abv) : '', organic: w?.organic ?? false,
  storeIds: w?.storeIds ?? [], ...prefill,
})

/**
 * Turn the form into a wine. A producer that isn't on the list yet is saved first,
 * so it can be picked for the next wine.
 */
export async function draftToWine(d: WineDraft, uid: string, knownProducer: boolean): Promise<NewWine> {
  const producer = d.producer.trim()
  const producerId = knownProducer ? slug(producer) : await ensureProducer(uid, producer, d.country.trim(), d.region.trim())
  const abv = Number(d.abv.replace(',', '.'))
  return {
    name: d.name.trim(), producer, producerId, type: d.type,
    grapes: d.grapes.split(',').map((g) => g.trim()).filter(Boolean),
    country: d.country.trim(), region: d.region.trim(), abv: d.abv && !isNaN(abv) ? abv : null, organic: d.organic, storeIds: d.storeIds,
  }
}

/** The wine's own details: name, producer (picked from the list or new), type, grapes, origin. */
export function WineFields({ value: f, onChange, showStores = true }: { value: WineDraft; onChange: (d: WineDraft) => void; showStores?: boolean }) {
  const { producerMap, producers, stores } = useApp()
  const ids = useId()
  const set = (patch: Partial<WineDraft>) => onChange({ ...f, ...patch })
  const known = producerMap.get(slug(f.producer))

  const pickProducer = (name: string) => {
    const p = producerMap.get(slug(name))
    // Fill in where the producer is from, unless the person already typed it.
    set({ producer: name, country: f.country || p?.country || '', region: f.region || p?.region || '' })
  }
  const toggleStore = (sid: string) => set({ storeIds: f.storeIds.includes(sid) ? f.storeIds.filter((s) => s !== sid) : [...f.storeIds, sid] })

  return (
    <div className="space-y-4">
      <Field label="Producer / winery" hint={!f.producer.trim() ? 'Pick one from the list, or type a new one.' : known ? `On the list${known.country ? ` · ${[known.region, known.country].filter(Boolean).join(', ')}` : ''}` : 'New producer: it will be saved for your next wines.'}>
        <input className="input" required list={`${ids}-producers`} autoComplete="off" placeholder="e.g. Marqués de Riscal" value={f.producer} onChange={(e) => pickProducer(e.target.value)} />
        <datalist id={`${ids}-producers`}>{producers.map((p) => <option key={p.id} value={p.name} />)}</datalist>
      </Field>
      <Field label="Wine name"><input className="input" required placeholder="e.g. Rioja Reserva" value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
      <div>
        <span className="label">Type</span>
        <div className="flex flex-wrap gap-2">
          {WINE_TYPES.map((t) => <button type="button" key={t} onClick={() => set({ type: t })} className={cx('chip capitalize', f.type === t && 'chip-on')}>{t}</button>)}
        </div>
      </div>
      <GrapePicker value={f.grapes} onChange={(grapes) => set({ grapes })} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Country">
          <input className="input" list={`${ids}-countries`} value={f.country} onChange={(e) => set({ country: e.target.value })} />
          <datalist id={`${ids}-countries`}>{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Region"><input className="input" placeholder="e.g. Rioja" value={f.region} onChange={(e) => set({ region: e.target.value })} /></Field>
        <Field label="Alcohol %"><input className="input" inputMode="decimal" placeholder="13,5" value={f.abv} onChange={(e) => set({ abv: e.target.value })} /></Field>
        <label className="flex items-end gap-2 pb-3 text-sm font-medium">
          <input type="checkbox" className="h-5 w-5 accent-wine-700" checked={f.organic} onChange={(e) => set({ organic: e.target.checked })} /> Organic
        </label>
      </div>
      {showStores && (
        <div>
          <span className="label">Sold at</span>
          <div className="flex flex-wrap gap-2">
            {stores.map((s) => <button type="button" key={s.id} onClick={() => toggleStore(s.id)} className={cx('chip', f.storeIds.includes(s.id) && 'chip-on')}>{s.name}</button>)}
          </div>
        </div>
      )}
    </div>
  )
}

const splitGrapes = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean)

/**
 * Grapes as chips, with a type-ahead: start typing and matching grapes drop down; tap one (or press Enter) to add it.
 * A grape that isn't on the list can be added as typed. Stored as the same comma-separated text as before.
 */
function GrapePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { wines } = useApp()
  const ids = useId()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined)
  const selected = splitGrapes(value)
  const chosen = new Set(selected.map(slug))

  const all = useMemo(() => {
    const m = new Map<string, string>()
    for (const g of [...GRAPES, ...wines.flatMap((w) => w.grapes)]) if (g.trim() && !m.has(slug(g))) m.set(slug(g), g.trim())
    return [...m.values()]
  }, [wines])

  const needle = slug(q)
  const matches = (needle
    ? all.filter((g) => slug(g).includes(needle)).sort((a, b) => Number(!slug(a).startsWith(needle)) - Number(!slug(b).startsWith(needle)))
    : all
  ).filter((g) => !chosen.has(slug(g))).slice(0, 8)
  const custom = q.trim() && !all.some((g) => slug(g) === needle) && !chosen.has(needle) ? q.trim() : ''
  const options = custom ? [...matches, custom] : matches
  const shown = open && options.length > 0

  const add = (g: string) => {
    if (!chosen.has(slug(g))) onChange([...selected, g].join(', '))
    setQ(''); setActive(0)
    clearTimeout(closing.current); setOpen(true); input.current?.focus()
  }
  const remove = (g: string) => onChange(selected.filter((x) => x !== g).join(', '))

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); setOpen(true)
      setActive((i) => (options.length ? (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length : 0))
    } else if (e.key === 'Enter' || e.key === ',') {
      // Enter must not submit the whole form while picking a grape.
      if (e.key === ',' || q.trim()) e.preventDefault()
      if (q.trim()) add(shown ? options[Math.min(active, options.length - 1)] : q.trim())
    } else if (e.key === 'Backspace' && !q && selected.length) {
      remove(selected[selected.length - 1])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div>
      <label className="label" htmlFor={`${ids}-grape`}>Grapes</label>
      <div className="relative">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-sand bg-white px-2 py-1.5 focus-within:border-wine-400 focus-within:ring-2 focus-within:ring-wine-100">
          {selected.map((g) => (
            <span key={g} className="inline-flex items-center gap-1 rounded-full bg-wine-100 py-1 pl-2.5 pr-1 text-sm font-medium text-wine-800">
              {g}
              <button type="button" aria-label={`Remove ${g}`} className="cursor-pointer rounded-full p-0.5 text-wine-700 hover:bg-wine-200" onClick={() => remove(g)}><X size={13} /></button>
            </span>
          ))}
          <input ref={input} id={`${ids}-grape`} className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-[16px] outline-none placeholder:text-ink/35"
            role="combobox" aria-expanded={shown} aria-controls={`${ids}-grapes`} aria-autocomplete="list"
            aria-activedescendant={shown ? `${ids}-opt-${active}` : undefined} autoComplete="off"
            placeholder={selected.length ? 'Add another grape' : 'Start typing, e.g. Grenache'}
            value={q} onChange={(e) => { setQ(e.target.value.replace(',', '')); setActive(0); setOpen(true) }}
            onFocus={() => { clearTimeout(closing.current); setOpen(true) }}
            // Phones blur the input before the tap on a suggestion lands, so close a moment later.
            onBlur={() => { closing.current = setTimeout(() => setOpen(false), 150) }} onKeyDown={onKey} />
        </div>
        {shown && (
          <ul id={`${ids}-grapes`} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-sand bg-white py-1 shadow-lg">
            {options.map((g, i) => (
              <li key={g} id={`${ids}-opt-${i}`} role="option" aria-selected={i === active}
                // No focus change on mouse press, so the input stays active; the tap itself adds the grape.
                onMouseDown={(e) => e.preventDefault()} onClick={() => add(g)} onMouseEnter={() => setActive(i)}
                className={cx('flex cursor-pointer items-center gap-2 px-3.5 py-2.5 text-sm', i === active && 'bg-wine-50 text-wine-800')}>
                {g === custom ? <><Plus size={15} className="text-wine-600" /> Add “{g}”</> : g}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
