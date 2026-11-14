import { useId } from 'react'
import { ensureProducer, type NewWine } from '../lib/db'
import { WINE_TYPES, type Wine, type WineType } from '../lib/types'
import { cx, slug } from '../lib/util'
import { useApp } from '../state/AppContext'
import { Field } from './ui'

const COUNTRIES = ['France', 'Italy', 'Spain', 'Portugal', 'Germany', 'Austria', 'Netherlands', 'Greece', 'Hungary', 'Georgia', 'Lebanon', 'South Africa', 'Chile', 'Argentina', 'Uruguay', 'United States', 'Canada', 'Australia', 'New Zealand']
const GRAPES = ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Shiraz', 'Grenache', 'Tempranillo', 'Sangiovese', 'Malbec', 'Primitivo', 'Nebbiolo', 'Gamay', 'Chardonnay', 'Sauvignon Blanc', 'Pinot Grigio', 'Riesling', 'Chenin Blanc', 'Verdejo', 'Viognier', 'Grüner Veltliner', 'Albariño', 'Glera']

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
  const addGrape = (g: string) => {
    const cur = f.grapes.split(',').map((x) => x.trim()).filter(Boolean)
    if (!cur.includes(g)) set({ grapes: [...cur, g].join(', ') })
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
      <Field label="Grapes" hint="Separate several grapes with commas.">
        <input className="input" placeholder="e.g. Grenache, Syrah" value={f.grapes} onChange={(e) => set({ grapes: e.target.value })} />
      </Field>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {GRAPES.map((g) => <button type="button" key={g} onClick={() => addGrape(g)} className="tag shrink-0 cursor-pointer">+ {g}</button>)}
      </div>
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
