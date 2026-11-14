import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { GlassWater, Lock, Minus, Plus, RotateCcw, Wine as WineIcon } from 'lucide-react'
import { createCheckin } from '../lib/db'
import { FLAVOUR_TAGS, OCCASIONS, type Serving } from '../lib/types'
import { cx, errMsg, today } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { WineSearch } from './Explore'
import { PhotoPicker } from '../components/PhotoPicker'
import { WineRow } from '../components/WineCard'
import { Avatar, ErrorNote, Field, Spinner, ScoreInput } from '../components/ui'

/** Step 1: choose the wine. */
export function LogPick() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">What are you drinking?</h1>
      <WineSearch linkTo={(id) => `/log/${id}`} addLink="/wines/new?next=log" />
    </div>
  )
}

/** Step 2: rate it and capture the details. */
export function LogWine() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const me = useMe()
  const { wineMap, stores, friendIds, people, cellar } = useApp()
  const wine = wineMap.get(id)
  const fromCellar = cellar.find((c) => c.id === params.get('cellar'))

  const [rating, setRating] = useState(0)
  const [f, setF] = useState({
    vintage: fromCellar?.vintage ? String(fromCellar.vintage) : '',
    drankAt: today(),
    storeName: fromCellar?.storeName ?? '',
    price: fromCellar?.price != null ? String(fromCellar.price) : '',
    notes: '', occasion: '', pairing: '', location: '',
  })
  const [serving, setServing] = useState<Serving>('bottle')
  const [glasses, setGlasses] = useState(1)
  const byGlass = serving === 'glass' && !fromCellar
  const [tags, setTags] = useState<string[]>([])
  const [withUids, setWithUids] = useState<string[]>([])
  const [buyAgain, setBuyAgain] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [bottle, setBottle] = useState<File[]>([])
  const [moments, setMoments] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!wine) return <p className="py-10 text-center text-sm text-ink/60">Wine not found. <Link className="font-semibold text-wine-700" to="/log">Pick another</Link></p>

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const price = Number(f.price.replace(',', '.'))
    const vintage = Number(f.vintage)
    const store = stores.find((s) => s.name.toLowerCase() === f.storeName.trim().toLowerCase())
    try {
      await createCheckin({
        me, wine, friendIds, bottleFiles: bottle, momentFiles: moments, fromCellar,
        input: {
          rating, vintage: f.vintage && !isNaN(vintage) ? vintage : null, drankAt: f.drankAt,
          storeId: byGlass ? '' : store?.id ?? '', storeName: byGlass ? '' : store?.name ?? f.storeName.trim(),
          price: f.price && !isNaN(price) ? price : null,
          serving: byGlass ? 'glass' : 'bottle', glasses: byGlass ? glasses : null,
          notes: f.notes.trim(), tags, occasion: f.occasion, pairing: f.pairing.trim(), location: f.location.trim(),
          withUids, withNames: withUids.map((u) => people.get(u)?.displayName ?? '').filter(Boolean),
          buyAgain, private: isPrivate,
        },
      })
      nav('/', { replace: true })
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <WineRow wine={wine} right={<Link to="/log" className="text-sm font-semibold text-wine-700">Change</Link>} />
      {fromCellar ? (
        <p className="rounded-xl bg-wine-50 px-3.5 py-2.5 text-sm text-wine-800">Opening a bottle from your cellar. It will be taken off your stock.</p>
      ) : (
        <div>
          <span className="label">How did you drink it?</span>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 rounded-full bg-sand p-1" role="radiogroup" aria-label="Serving">
              {([['bottle', 'Bottle', WineIcon], ['glass', 'By the glass', GlassWater]] as const).map(([v, label, Icon]) => (
                <button type="button" key={v} role="radio" aria-checked={serving === v} onClick={() => setServing(v)}
                  className={cx('flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition', serving === v ? 'bg-white text-wine-800 shadow-sm' : 'text-ink/55')}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
            {byGlass && (
              <div className="flex items-center rounded-full border border-sand bg-white" aria-label="Number of glasses">
                <button type="button" aria-label="One glass less" className="p-2 text-ink/60 disabled:opacity-30" disabled={glasses <= 1} onClick={() => setGlasses(glasses - 1)}><Minus size={16} /></button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{glasses}</span>
                <button type="button" aria-label="One glass more" className="p-2 text-ink/60" onClick={() => setGlasses(Math.min(20, glasses + 1))}><Plus size={16} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      <div><span className="label">Your score</span><ScoreInput value={rating} onChange={setRating} /></div>

      <Field label="Tasting notes">
        <textarea className="input min-h-24" placeholder="What did it taste like? Would you serve it again?" value={f.notes} onChange={set('notes')} maxLength={2000} />
      </Field>

      <div>
        <span className="label">Flavours</span>
        <div className="flex flex-wrap gap-1.5">
          {FLAVOUR_TAGS.map((t) => <button type="button" key={t} onClick={() => setTags(toggle(tags, t))} className={cx('chip !px-2.5 !py-1 !text-[13px]', tags.includes(t) && 'chip-on')}>{t}</button>)}
        </div>
      </div>

      <div>
        <span className="label">Bottle photos</span>
        <p className="mb-2 text-xs text-ink/55">Label shots. These are added to the wine's page so everyone can recognise the bottle.</p>
        <PhotoPicker files={bottle} onChange={setBottle} max={3} />
      </div>
      <div>
        <span className="label">Moment photos</span>
        <p className="mb-2 text-xs text-ink/55">The table, the view, the people. Only shown on this check-in.</p>
        <PhotoPicker files={moments} onChange={setMoments} max={6} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Year (vintage)"><input className="input" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="e.g. 2019" value={f.vintage} onChange={set('vintage')} /></Field>
        <Field label="Date"><input className="input" type="date" value={f.drankAt} max={today()} onChange={set('drankAt')} /></Field>
        {byGlass ? (
          <Field label="Bar or restaurant"><input className="input" placeholder="e.g. Café de Witte Aap" value={f.location} onChange={set('location')} /></Field>
        ) : (
          <Field label="Bought at">
            <input className="input" list="log-stores" placeholder="Store" value={f.storeName} onChange={set('storeName')} />
            <datalist id="log-stores">{stores.map((s) => <option key={s.id} value={s.name} />)}</datalist>
          </Field>
        )}
        <Field label={byGlass ? 'Price per glass (€)' : 'Price (€)'}><input className="input" inputMode="decimal" placeholder="0,00" value={f.price} onChange={set('price')} /></Field>
      </div>

      <div>
        <span className="label">Occasion</span>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          {OCCASIONS.map((o) => <button type="button" key={o} onClick={() => setF({ ...f, occasion: f.occasion === o ? '' : o })} className={cx('chip shrink-0 !px-2.5 !py-1 !text-[13px]', f.occasion === o && 'chip-on')}>{o}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Paired with"><input className="input" placeholder="e.g. Risotto" value={f.pairing} onChange={set('pairing')} /></Field>
        {!byGlass && <Field label="Where"><input className="input" placeholder="e.g. Home, Kralingen" value={f.location} onChange={set('location')} /></Field>}
      </div>

      {friendIds.length > 0 && (
        <div>
          <span className="label">Drank with</span>
          <div className="flex flex-wrap gap-2">
            {friendIds.map((u) => people.get(u) && (
              <button type="button" key={u} onClick={() => setWithUids(toggle(withUids, u))} className={cx('chip !py-1 !pl-1', withUids.includes(u) && 'chip-on')}>
                <Avatar src={people.get(u)!.photoURL} name={people.get(u)!.displayName} size={24} /> {people.get(u)!.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card divide-y divide-sand">
        <label className="flex cursor-pointer items-center gap-3 p-4">
          <RotateCcw size={18} className="text-wine-600" /><span className="flex-1 text-sm font-medium">I would buy this again</span>
          <input type="checkbox" className="h-5 w-5 accent-wine-700" checked={buyAgain} onChange={(e) => setBuyAgain(e.target.checked)} />
        </label>
        <label className="flex cursor-pointer items-center gap-3 p-4">
          <Lock size={18} className="text-wine-600" /><span className="flex-1 text-sm font-medium">Only me <span className="font-normal text-ink/50">— hide from friends' feeds</span></span>
          <input type="checkbox" className="h-5 w-5 accent-wine-700" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
        </label>
      </div>

      <ErrorNote>{error}</ErrorNote>
      <button className="btn btn-primary w-full !py-3.5 text-base" disabled={busy}>{busy && <Spinner />}{busy ? 'Saving…' : 'Check in'}</button>
    </form>
  )
}
