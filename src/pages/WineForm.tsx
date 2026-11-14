import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createWine, updateWine, type NewWine } from '../lib/db'
import { WINE_TYPES, type WineType } from '../lib/types'
import { cx, errMsg } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { PhotoPicker } from '../components/PhotoPicker'
import { ErrorNote, Field, Spinner } from '../components/ui'

const COUNTRIES = ['France', 'Italy', 'Spain', 'Portugal', 'Germany', 'Austria', 'Netherlands', 'Greece', 'Hungary', 'Georgia', 'Lebanon', 'South Africa', 'Chile', 'Argentina', 'United States', 'Canada', 'Australia', 'New Zealand']
const GRAPES = ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Syrah', 'Shiraz', 'Grenache', 'Tempranillo', 'Sangiovese', 'Malbec', 'Primitivo', 'Nebbiolo', 'Gamay', 'Chardonnay', 'Sauvignon Blanc', 'Pinot Grigio', 'Riesling', 'Chenin Blanc', 'Verdejo', 'Viognier', 'Grüner Veltliner', 'Albariño', 'Glera']

/** Add a wine by hand, or edit one you added (route /wines/:id/edit). */
export function WineForm() {
  const me = useMe()
  const nav = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const { wineMap, stores } = useApp()
  const existing = id ? wineMap.get(id) : undefined
  const [f, setF] = useState({
    name: existing?.name ?? '', producer: existing?.producer ?? '', type: (existing?.type ?? 'red') as WineType,
    grapes: existing?.grapes.join(', ') ?? '', country: existing?.country ?? '', region: existing?.region ?? '',
    abv: existing?.abv ? String(existing.abv) : '', organic: existing?.organic ?? false, storeIds: existing?.storeIds ?? [] as string[],
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const abv = Number(f.abv.replace(',', '.'))
    const data: NewWine = {
      name: f.name.trim(), producer: f.producer.trim(), type: f.type,
      grapes: f.grapes.split(',').map((g) => g.trim()).filter(Boolean),
      country: f.country.trim(), region: f.region.trim(), abv: f.abv && !isNaN(abv) ? abv : null, organic: f.organic, storeIds: f.storeIds,
    }
    try {
      if (existing) {
        await updateWine(existing.id, data)
        nav(`/wines/${existing.id}`, { replace: true })
      } else {
        const wine = await createWine(me.id, data, photos)
        const next = params.get('next')
        nav(next === 'log' ? `/log/${wine.id}` : next === 'cellar' ? `/wines/${wine.id}?cellar=add` : `/wines/${wine.id}`, { replace: true })
      }
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  const addGrape = (g: string) => {
    const cur = f.grapes.split(',').map((x) => x.trim()).filter(Boolean)
    if (!cur.includes(g)) setF({ ...f, grapes: [...cur, g].join(', ') })
  }
  const toggleStore = (sid: string) =>
    setF({ ...f, storeIds: f.storeIds.includes(sid) ? f.storeIds.filter((s) => s !== sid) : [...f.storeIds, sid] })

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold">{existing ? 'Edit wine' : 'Add a wine'}</h1>
      <Field label="Wine name"><input className="input" required placeholder="e.g. Rioja Reserva" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Producer / winery"><input className="input" required placeholder="e.g. Marqués de Vitoria" value={f.producer} onChange={(e) => setF({ ...f, producer: e.target.value })} /></Field>
      <div>
        <span className="label">Type</span>
        <div className="flex flex-wrap gap-2">
          {WINE_TYPES.map((t) => <button type="button" key={t} onClick={() => setF({ ...f, type: t })} className={cx('chip capitalize', f.type === t && 'chip-on')}>{t}</button>)}
        </div>
      </div>
      <Field label="Grapes" hint="Separate several grapes with commas.">
        <input className="input" placeholder="e.g. Grenache, Syrah" value={f.grapes} onChange={(e) => setF({ ...f, grapes: e.target.value })} />
      </Field>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {GRAPES.map((g) => <button type="button" key={g} onClick={() => addGrape(g)} className="tag shrink-0 cursor-pointer">+ {g}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Country">
          <input className="input" list="countries" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
          <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Region"><input className="input" placeholder="e.g. Rioja" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} /></Field>
        <Field label="Alcohol %"><input className="input" inputMode="decimal" placeholder="13,5" value={f.abv} onChange={(e) => setF({ ...f, abv: e.target.value })} /></Field>
        <label className="flex items-end gap-2 pb-3 text-sm font-medium">
          <input type="checkbox" className="h-5 w-5 accent-wine-700" checked={f.organic} onChange={(e) => setF({ ...f, organic: e.target.checked })} /> Organic
        </label>
      </div>
      <div>
        <span className="label">Sold at</span>
        <div className="flex flex-wrap gap-2">
          {stores.map((s) => <button type="button" key={s.id} onClick={() => toggleStore(s.id)} className={cx('chip', f.storeIds.includes(s.id) && 'chip-on')}>{s.name}</button>)}
        </div>
      </div>
      {!existing && (
        <div>
          <span className="label">Bottle photos</span>
          <p className="mb-2 text-xs text-ink/55">Front label first, so others recognise the bottle.</p>
          <PhotoPicker files={photos} onChange={setPhotos} max={4} />
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>
      <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}{existing ? 'Save changes' : 'Add wine'}</button>
    </form>
  )
}
