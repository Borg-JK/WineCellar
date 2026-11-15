import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronDown, GlassWater, Lock, Minus, Plus, RotateCcw, Warehouse, Wine as WineIcon, X } from 'lucide-react'
import { addToCellar, createCheckin, updateCheckin } from '../lib/db'
import { FLAVOUR_TAGS, OCCASIONS, type Checkin, type CheckinInput, type Serving } from '../lib/types'
import { cx, errMsg, euro, lastPurchase, today } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { WineSearch } from './Explore'
import { PhotoPicker } from '../components/PhotoPicker'
import { WineRow } from '../components/WineCard'
import { Avatar, ErrorNote, Field, FullSpinner, Spinner, ScoreInput } from '../components/ui'

/** Step 1: choose the wine. */
export function LogPick() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">What are you drinking?</h1>
      <WineSearch linkTo={(id) => `/log/${id}`} addLink="/wines/new?next=log" />
    </div>
  )
}

/** Route /checkins/:checkinId/edit: the log form, filled in with one of your check-ins. */
export function EditCheckin() {
  const { checkinId } = useParams()
  const { myCheckins, myCheckinsLoaded } = useApp()
  const c = myCheckins.find((x) => x.id === checkinId)
  if (!c) return myCheckinsLoaded
    ? <p className="py-10 text-center text-sm text-ink/60">Check-in not found. You can only edit your own.</p>
    : <FullSpinner />
  return <LogWine key={c.id} editing={c} />
}

/** Step 2: rate it and capture the details. With `editing`, changes an existing check-in instead. */
export function LogWine({ editing }: { editing?: Checkin } = {}) {
  const params0 = useParams()
  const id = editing?.wineId ?? params0.id ?? ''
  const [params] = useSearchParams()
  const nav = useNavigate()
  const me = useMe()
  const { wineMap, stores, friendIds, people, cellar, myCheckins } = useApp()
  const wine = wineMap.get(id)
  const shown = wine ?? editing?.wine
  const e0 = editing
  // Year, store and price of a new check-in start from your last purchase of this wine.
  const [last] = useState(() => (e0 ? null : lastPurchase(id, cellar, myCheckins)))

  const [rating, setRating] = useState(e0?.rating ?? 0)
  const [f, setF] = useState({
    vintage: (e0 ?? last)?.vintage ? String((e0 ?? last)!.vintage) : '',
    drankAt: e0?.drankAt || today(),
    storeName: (e0 ?? last)?.storeName ?? '',
    price: (e0 ?? last)?.price != null ? String((e0 ?? last)!.price).replace('.', ',') : '',
    notes: e0?.notes ?? '', occasion: e0?.occasion ?? '', pairing: e0?.pairing ?? '', location: e0?.location ?? '',
  })
  const [serving, setServing] = useState<Serving>(e0?.serving ?? 'bottle')
  const [glasses, setGlasses] = useState(e0?.glasses ?? 1)
  const byGlass = serving === 'glass'

  // Bottles of this wine you have at home. A bottle you log comes from there unless you say otherwise,
  // so you don't retype year, store and price and the stock stays right.
  const owned = e0 ? [] : cellar.filter((c) => c.wineId === id)
  const [cellarChoice, setCellarChoice] = useState<string | null>(null) // null = default, '' = not from the cellar
  const fromCellar = byGlass ? undefined : cellarChoice === null
    ? owned.find((c) => c.id === params.get('cellar')) ?? owned[0]
    : owned.find((c) => c.id === cellarChoice)
  const [moreAtHome, setMoreAtHome] = useState(0)
  const [tags, setTags] = useState<string[]>(e0?.tags ?? [])
  const [withUids, setWithUids] = useState<string[]>(e0?.withUids ?? [])
  const [buyAgain, setBuyAgain] = useState(e0?.buyAgain ?? false)
  const [isPrivate, setIsPrivate] = useState(e0?.private ?? false)
  const [bottle, setBottle] = useState<File[]>([])
  const [moments, setMoments] = useState<File[]>([])
  const [keepMoments, setKeepMoments] = useState<string[]>(e0?.momentPhotos ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  /** Back to wherever the edit was opened from (or the feed on a fresh load). */
  const goBack = () => (window.history.state?.idx > 0 ? nav(-1) : nav('/', { replace: true }))

  if (!shown) return <p className="py-10 text-center text-sm text-ink/60">Wine not found. <Link className="font-semibold text-wine-700" to="/log">Pick another</Link></p>

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const price = fromCellar ? fromCellar.price ?? NaN : Number(f.price.replace(',', '.'))
    const vintage = fromCellar ? fromCellar.vintage ?? NaN : Number(f.vintage)
    const storeName = fromCellar ? fromCellar.storeName : f.storeName
    const store = stores.find((s) => s.name.toLowerCase() === storeName.trim().toLowerCase())
    const input: CheckinInput = {
      rating, vintage: vintage && !isNaN(vintage) ? vintage : null, drankAt: f.drankAt,
      storeId: byGlass ? '' : store?.id ?? '', storeName: byGlass ? '' : store?.name ?? storeName.trim(),
      price: !isNaN(price) && (fromCellar || f.price) ? price : null,
      serving: byGlass ? 'glass' : 'bottle', glasses: byGlass ? glasses : null,
      notes: f.notes.trim(), tags, occasion: f.occasion, pairing: f.pairing.trim(), location: f.location.trim(),
      withUids, withNames: withUids.map((u) => people.get(u)?.displayName ?? '').filter(Boolean),
      buyAgain, private: isPrivate,
    }
    try {
      if (editing) {
        await updateCheckin({ c: editing, input, friendIds, keepMoments, newMoments: moments })
        goBack()
      } else {
        await createCheckin({ me, wine: wine!, friendIds, bottleFiles: bottle, momentFiles: moments, fromCellar, input })
        if (moreAtHome > 0) {
          await addToCellar(me.id, wine!, {
            quantity: moreAtHome, vintage: input.vintage, storeName: input.storeName, price: input.price, purchasedAt: f.drankAt,
            drinkFrom: null, drinkBy: null, location: '', notes: '',
          }, cellar)
        }
        nav('/', { replace: true })
      }
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {editing && <h1 className="text-2xl font-semibold">Edit check-in</h1>}
      <WineRow wine={shown} right={editing ? undefined : <Link to="/log" className="text-sm font-semibold text-wine-700">Change</Link>} />
      {(
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

      {!byGlass && owned.length > 0 && (
        <div className="card space-y-1 p-3">
          <p className="flex items-center gap-2 px-1 text-sm font-semibold text-wine-800"><Warehouse size={16} /> From your cellar?</p>
          {owned.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm">
              <input type="radio" name="from-cellar" className="h-4 w-4 accent-wine-700" checked={fromCellar?.id === c.id} onChange={() => setCellarChoice(c.id)} />
              <span className="flex-1">
                <b>{c.vintage ?? 'No year'}</b> · {c.quantity} at home
                <span className="text-ink/55">{[c.storeName, c.price != null ? euro(c.price) : ''].filter(Boolean).map((x) => ` · ${x}`).join('')}</span>
              </span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm">
            <input type="radio" name="from-cellar" className="h-4 w-4 accent-wine-700" checked={!fromCellar} onChange={() => setCellarChoice('')} />
            <span className="flex-1 text-ink/70">No, a different bottle</span>
          </label>
          {fromCellar && <p className="px-1 text-xs text-ink/55">One bottle comes off your stock. Year, store and price are taken from the cellar.</p>}
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

      {!editing && (
        <div>
          <span className="label">Bottle photos</span>
          <p className="mb-2 text-xs text-ink/55">Label shots. These are added to the wine's page so everyone can recognise the bottle.</p>
          <PhotoPicker files={bottle} onChange={setBottle} max={3} />
        </div>
      )}
      <div>
        <span className="label">Moment photos</span>
        <p className="mb-2 text-xs text-ink/55">The table, the view, the people. Only shown on this check-in.</p>
        {keepMoments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {keepMoments.map((u) => (
              <div key={u} className="relative h-20 w-20">
                <img src={u} alt="" className="h-full w-full rounded-xl object-cover" />
                <button type="button" aria-label="Remove photo" onClick={() => setKeepMoments(keepMoments.filter((x) => x !== u))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-1 text-white shadow"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
        <PhotoPicker files={moments} onChange={setMoments} max={Math.max(0, 6 - keepMoments.length)} />
      </div>

      {last && !fromCellar && !byGlass && <p className="-mb-3 text-xs text-ink/55">Year, store and price filled in from your last bottle of this wine.</p>}
      <div className="grid grid-cols-2 gap-3">
        {!fromCellar && <Field label="Year (vintage)"><input className="input" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="e.g. 2019" value={f.vintage} onChange={set('vintage')} /></Field>}
        <Field label="Date"><input className="input" type="date" value={f.drankAt} max={today()} onChange={set('drankAt')} /></Field>
        {fromCellar ? null : byGlass ? (
          <Field label="Bar or restaurant"><input className="input" placeholder="e.g. Café de Witte Aap" value={f.location} onChange={set('location')} /></Field>
        ) : (
          <Field label="Bought at">
            <input className="input" list="log-stores" placeholder="Store" value={f.storeName} onChange={set('storeName')} />
            <datalist id="log-stores">{stores.map((s) => <option key={s.id} value={s.name} />)}</datalist>
          </Field>
        )}
        {!fromCellar && <Field label={byGlass ? 'Price per glass (€)' : 'Price (€)'}><input className="input" inputMode="decimal" placeholder="0,00" value={f.price} onChange={set('price')} /></Field>}
      </div>

      {!editing && !byGlass && !fromCellar && (
        <div className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-sand">
          <Warehouse size={18} className="shrink-0 text-wine-600" />
          <span className="flex-1 text-sm">Bought more? Put the rest in your cellar</span>
          <div className="flex items-center rounded-full border border-sand" aria-label="Bottles to put in the cellar">
            <button type="button" aria-label="One bottle less for the cellar" className="p-2 text-ink/60 disabled:opacity-30" disabled={moreAtHome <= 0} onClick={() => setMoreAtHome(moreAtHome - 1)}><Minus size={16} /></button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">{moreAtHome}</span>
            <button type="button" aria-label="One bottle more for the cellar" className="p-2 text-ink/60" onClick={() => setMoreAtHome(Math.min(48, moreAtHome + 1))}><Plus size={16} /></button>
          </div>
        </div>
      )}

      <details className="group rounded-xl ring-1 ring-sand" open={!!(e0 && (e0.occasion || e0.pairing || e0.location || e0.withUids.length))}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-3 text-sm font-semibold text-ink/70 [&::-webkit-details-marker]:hidden">
          <span className="whitespace-nowrap">More details</span>
          <span className="mx-2 min-w-0 flex-1 truncate text-right font-normal text-ink/45">occasion, food, where, with whom</span>
          <ChevronDown size={18} className="shrink-0 transition group-open:rotate-180" />
        </summary>
        <div className="space-y-5 px-3.5 pb-4">
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
        </div>
      </details>

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
      <button className="btn btn-primary w-full !py-3.5 text-base" disabled={busy}>{busy && <Spinner />}{busy ? 'Saving…' : editing ? 'Save changes' : 'Check in'}</button>
      {editing && <button type="button" className="btn btn-ghost w-full" onClick={goBack} disabled={busy}>Cancel</button>}
    </form>
  )
}
