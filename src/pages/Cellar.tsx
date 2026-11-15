import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, Check, Clock, GlassWater, Minus, Pencil, Plus, RotateCcw, Trash2, Warehouse, Wine as WineIcon } from 'lucide-react'
import { addBottlePhotos, addToCellar, changeCellarQuantity, createWine, finishBottle, removeCellarItem, removeFromWishlist, updateCellarItem } from '../lib/db'
import type { CellarItem, Wine } from '../lib/types'
import { euro, fmtDay, fmtScore, slug } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { CellarForm } from '../components/CellarForm'
import { CorkPop } from '../components/CorkPop'
import { WineRow } from '../components/WineCard'
import { Empty, Sheet, Tabs } from '../components/ui'
import { WineSearch } from './Explore'
import { PhotoPicker } from '../components/PhotoPicker'
import { draftFrom, draftToWine, WineFields, type WineDraft } from '../components/WineFields'

type Tab = 'home' | 'wishlist' | 'again'
const YEAR = new Date().getFullYear()

function drinkStatus(i: CellarItem): { label: string; tone: string } | null {
  if (i.drinkBy && i.drinkBy < YEAR) return { label: `Past its window (${i.drinkBy})`, tone: 'text-red-700' }
  if (i.drinkBy && i.drinkBy === YEAR) return { label: 'Drink this year', tone: 'text-amber-700' }
  if (i.drinkFrom && i.drinkFrom > YEAR) return { label: `Wait until ${i.drinkFrom}`, tone: 'text-ink/55' }
  if (i.drinkFrom || i.drinkBy) return { label: `Ready${i.drinkBy ? ` until ${i.drinkBy}` : ''}`, tone: 'text-green-700' }
  return null
}

export function Cellar() {
  const me = useMe()
  const { cellar, wishlist, myCheckins, wineMap, producerMap } = useApp()
  const [tab, setTab] = useState<Tab>('home')
  const [editing, setEditing] = useState<CellarItem | null>(null)
  /** The bottle being opened: its cork pops, then the log form opens. */
  const [popping, setPopping] = useState<CellarItem | null>(null)
  const nav = useNavigate()
  const [adding, setAdding] = useState(false)
  const [picked, setPicked] = useState<Wine | null>(null)
  /** Set while adding a wine that isn't in the catalogue yet: its details and the bottles in one form. */
  const [draft, setDraft] = useState<WineDraft | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const closeAdd = () => { setAdding(false); setPicked(null); setDraft(null); setPhotos([]) }
  const sheetTitle = picked ? 'Add to cellar' : draft ? 'New wine for your cellar' : 'Which wine?'

  const bottles = cellar.reduce((s, i) => s + i.quantity, 0)
  const value = cellar.reduce((s, i) => s + i.quantity * (i.price ?? 0), 0)
  const soon = cellar.filter((i) => i.drinkBy && i.drinkBy <= YEAR).length
  const open = cellar.filter((i) => i.openedAt).length

  // One entry per wine the user said they would buy again, best rating first.
  const again = useMemo(() => {
    const m = new Map<string, { rating: number; store: string }>()
    for (const c of myCheckins) if (c.buyAgain && (m.get(c.wineId)?.rating ?? -1) < c.rating) m.set(c.wineId, { rating: c.rating, store: c.storeName })
    return [...m.entries()].sort((a, b) => b[1].rating - a[1].rating)
  }, [myCheckins])

  return (
    <div className="space-y-4">
      <Tabs value={tab} onChange={setTab} options={[{ id: 'home', label: 'At home' }, { id: 'wishlist', label: 'Wishlist' }, { id: 'again', label: 'Buy again' }]} />

      {tab === 'home' && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[[String(bottles), open ? `bottles · ${open} open` : 'bottles'], [value ? euro(value) : '–', 'value'], [String(soon), 'drink soon']].map(([n, l]) => (
              <div key={l} className="card px-2 py-3"><p className="font-display text-xl font-semibold text-wine-700">{n}</p><p className="text-xs text-ink/55">{l}</p></div>
            ))}
          </div>
          {cellar.length === 0 ? (
            <Empty icon={<Warehouse size={28} />} title="Your cellar is empty">
              Keep track of the bottles you have at home. Tap "Add a bottle" below to start.
            </Empty>
          ) : cellar.map((i) => {
            const st = drinkStatus(i)
            return (
              <div key={i.id} className="card p-3">
                <WineRowBare item={i} />
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 pl-[60px] text-xs text-ink/60">
                  {i.vintage && <span className="rounded bg-wine-50 px-1.5 font-semibold text-wine-800">{i.vintage}</span>}
                  {i.storeName && <span>{i.storeName}</span>}
                  {i.price != null && <span>{euro(i.price)}</span>}
                  {i.location && <span>📍 {i.location}</span>}
                  {st && <span className={`inline-flex items-center gap-1 font-medium ${st.tone}`}><Clock size={12} /> {st.label}</span>}
                </div>
                {i.notes && <p className="mt-1 pl-[60px] text-xs italic text-ink/55">{i.notes}</p>}
                {i.openedAt && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-wine-50 px-3 py-2 text-sm text-wine-800">
                    <GlassWater size={16} className="shrink-0" />
                    <span className="flex-1">{i.quantity > 1 ? '1 bottle open' : 'Open'} since {fmtDay(i.openedAt)}</span>
                    <button className="inline-flex items-center gap-1 font-semibold" onClick={() => confirm('Bottle empty? It comes off your stock.') && finishBottle(me.id, i)}>
                      <Check size={15} /> Finished
                    </button>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center rounded-full border border-sand">
                    <button aria-label="One bottle less" className="p-2 text-ink/60" onClick={() => (i.quantity > 1 || confirm('Remove this wine from your cellar?')) && changeCellarQuantity(me.id, i, -1)}><Minus size={16} /></button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">{i.quantity}</span>
                    <button aria-label="One bottle more" className="p-2 text-ink/60" onClick={() => changeCellarQuantity(me.id, i, 1)}><Plus size={16} /></button>
                  </div>
                  {i.openedAt
                    ? <Link to={`/log/${i.wineId}?cellar=${i.id}`} className="btn btn-primary flex-1 !py-2"><WineIcon size={16} /> Drink some more</Link>
                    : <button className="btn btn-primary flex-1 !py-2" onClick={() => setPopping(i)}><WineIcon size={16} /> Open a bottle</button>}
                  <button aria-label="Edit" className="btn btn-ghost !p-2" onClick={() => setEditing(i)}><Pencil size={16} /></button>
                  <button aria-label="Remove" className="btn btn-ghost !p-2 text-ink/40" onClick={() => confirm('Remove this wine from your cellar?') && removeCellarItem(me.id, i.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })}
          <button className="btn btn-primary w-full" onClick={() => setAdding(true)}><Plus size={18} /> Add a bottle</button>
        </>
      )}

      {tab === 'wishlist' && (wishlist.length === 0 ? (
        <Empty icon={<Bookmark size={28} />} title="No wines saved">Tap "Wishlist" on any wine to remember it for your next shop.</Empty>
      ) : wishlist.map((w) => (
        <WineRow key={w.id} wine={wineMap.get(w.id) ?? w.wine} to={`/wines/${w.id}`}
          right={<button aria-label="Remove from wishlist" className="btn btn-ghost !p-2 text-wine-600" onClick={() => removeFromWishlist(me.id, w.id)}><Bookmark size={18} fill="currentColor" /></button>} />
      )))}

      {tab === 'again' && (again.length === 0 ? (
        <Empty icon={<RotateCcw size={28} />} title="Nothing here yet">Tick "I would buy this again" when you log a wine and it shows up here as a shopping list.</Empty>
      ) : again.map(([wineId, info]) => wineMap.get(wineId) && (
        <WineRow key={wineId} wine={wineMap.get(wineId)!} to={`/wines/${wineId}`}
          sub={<p className="mt-0.5 text-xs text-wine-600">You gave it {info.rating ? `${fmtScore(info.rating)}/10` : '–'}{info.store && ` · bought at ${info.store}`}</p>} />
      )))}

      <Sheet open={adding} onClose={closeAdd} title={sheetTitle}>
        {picked ? (
          <div className="space-y-4">
            <WineRow wine={picked} right={<button type="button" className="text-sm font-semibold text-wine-700" onClick={() => setPicked(null)}>Change</button>} />
            <CellarForm key={picked.id} wineId={picked.id} submitLabel="Add to cellar" onSubmit={async (v) => {
              await addToCellar(me.id, picked, v, cellar)
              if (photos.length) await addBottlePhotos(picked, me.id, photos)
              closeAdd()
            }}>
              <BottlePhotoField files={photos} onChange={setPhotos} hasPhoto={picked.photos.length > 0} />
            </CellarForm>
          </div>
        ) : draft ? (
          <CellarForm submitLabel="Add to cellar" onSubmit={async (v) => {
            const data = await draftToWine(draft, me.id, producerMap.has(slug(draft.producer)))
            const wine = await createWine(me.id, data, photos)
            await addToCellar(me.id, wine, v)
            closeAdd()
          }}>
            <button type="button" className="text-sm font-semibold text-wine-700" onClick={() => setDraft(null)}>← Back to search</button>
            <WineFields value={draft} onChange={setDraft} showStores={false} />
            <BottlePhotoField files={photos} onChange={setPhotos} hasPhoto={false} />
          </CellarForm>
        ) : <WineSearch onPick={setPicked} onAdd={(typed) => setDraft(draftFrom(undefined, { name: typed }))} />}
      </Sheet>

      {popping && <CorkPop wine={wineMap.get(popping.wineId) ?? popping.wine} onDone={() => nav(`/log/${popping.wineId}?cellar=${popping.id}`)} />}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit cellar entry">
        {editing && <CellarForm key={editing.id} initial={editing} submitLabel="Save" onSubmit={async (v) => { await updateCellarItem(me.id, editing.id, v); setEditing(null) }} />}
      </Sheet>
    </div>
  )
}

/** Optional photo of your bottle; the newest bottle photo becomes the wine's picture for everyone. */
export function BottlePhotoField({ files, onChange, hasPhoto }: { files: File[]; onChange: (f: File[]) => void; hasPhoto: boolean }) {
  return (
    <div>
      <span className="label">Bottle photo</span>
      <p className="mb-2 text-xs text-ink/55">
        {hasPhoto ? 'Optional. Your photo replaces the current picture of this wine for everyone.' : 'Optional. Your photo becomes the picture of this wine for everyone.'}
      </p>
      <PhotoPicker files={files} onChange={onChange} max={2} />
    </div>
  )
}

function WineRowBare({ item }: { item: CellarItem }) {
  const { wineMap } = useApp()
  const wine = wineMap.get(item.wineId) ?? item.wine
  return (
    <Link to={`/wines/${item.wineId}`} className="[&>.card]:border-0 [&>.card]:p-0 [&>.card]:shadow-none block">
      <WineRow wine={wine} />
    </Link>
  )
}
