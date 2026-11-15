import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, Check, Clock, Columns3, GlassWater, List, Minus, Pencil, Plus, RotateCcw, Trash2, Warehouse, Wine as WineIcon } from 'lucide-react'
import { addBottlePhotos, addToCellar, canEditInPlace, changeCellarQuantity, createWine, updateWine, finishBottle, markOpened, removeCellarItem, removeFromWishlist, updateCellarItem } from '../lib/db'
import type { CellarItem, Wine, WineType } from '../lib/types'
import { cx, euro, fmtDay, fmtScore, slug, today, TYPE_COLOUR } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { CellarForm } from '../components/CellarForm'
import { CorkPop } from '../components/CorkPop'
import { WineRow } from '../components/WineCard'
import { Empty, Sheet, Tabs } from '../components/ui'
import { WineSearch } from './Explore'
import { EditCopyNote } from './WineForm'
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
  /** Set when the draft is an edit of a picked wine: yours is changed in place, anyone else's becomes a new version. */
  const [basedOn, setBasedOn] = useState<Wine | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const closeAdd = () => { setAdding(false); setPicked(null); setDraft(null); setBasedOn(null); setPhotos([]) }
  const editPicked = (w: Wine) => { setBasedOn(w); setDraft(draftFrom(w)); setPicked(null) }
  const sheetTitle = picked ? 'Add to cellar' : basedOn ? 'Edit details' : draft ? 'New wine for your cellar' : 'Which wine?'

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
          ) : (
            <CellarView items={cellar} onOpen={setPopping} onEdit={setEditing} />
          )}
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
            <button type="button" className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine-700" onClick={() => editPicked(picked)}>
              <Pencil size={14} /> Details not right? Edit them
            </button>
            <CellarForm key={picked.id} wineId={picked.id} submitLabel="Add to cellar" onSubmit={async (v) => {
              await addToCellar(me.id, picked, v, cellar)
              if (photos.length) await addBottlePhotos(picked, me.id, photos)
              closeAdd()
            }}>
              <BottlePhotoField files={photos} onChange={setPhotos} hasPhoto={picked.photos.length > 0} />
            </CellarForm>
          </div>
        ) : draft ? (
          <CellarForm wineId={basedOn && canEditInPlace(basedOn, me.id) ? basedOn.id : undefined} submitLabel={basedOn && !canEditInPlace(basedOn, me.id) ? 'Save my version and add' : 'Add to cellar'} onSubmit={async (v) => {
            const data = await draftToWine(draft, me.id, producerMap.has(slug(draft.producer)))
            if (basedOn && canEditInPlace(basedOn, me.id)) {
              await updateWine(basedOn.id, data)
              const wine = { ...basedOn, ...data }
              await addToCellar(me.id, wine, v, cellar)
              if (photos.length) await addBottlePhotos(wine, me.id, photos)
            } else {
              const wine = await createWine(me.id, data, photos, basedOn?.photos)
              await addToCellar(me.id, wine, v)
            }
            closeAdd()
          }}>
            {basedOn
              ? <button type="button" className="text-sm font-semibold text-wine-700" onClick={() => { setPicked(basedOn); setBasedOn(null); setDraft(null) }}>← Back</button>
              : <button type="button" className="text-sm font-semibold text-wine-700" onClick={() => setDraft(null)}>← Back to search</button>}
            {basedOn && !canEditInPlace(basedOn, me.id) && <EditCopyNote />}
            <WineFields value={draft} onChange={setDraft} showStores={false} />
            <BottlePhotoField files={photos} onChange={setPhotos} hasPhoto={!!basedOn?.photos.length} />
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

/** The cellar split by colour. Bubbles takes sparkling and champagne; orange, dessert and fortified go under Other. */
const GROUPS: { id: string; label: string; types: WineType[]; colour: string }[] = [
  { id: 'red', label: 'Red', types: ['red'], colour: TYPE_COLOUR.red },
  { id: 'white', label: 'White', types: ['white'], colour: TYPE_COLOUR.white },
  { id: 'rose', label: 'Rosé', types: ['rosé'], colour: TYPE_COLOUR['rosé'] },
  { id: 'bubbles', label: 'Bubbles', types: ['sparkling', 'champagne'], colour: TYPE_COLOUR.champagne },
  { id: 'other', label: 'Other', types: ['orange', 'dessert', 'fortified'], colour: TYPE_COLOUR.orange },
]
const WIDE = '(min-width: 1280px)'
const VIEW_KEY = 'cellar-view'

function useMedia(q: string) {
  const [on, setOn] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setOn(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [q])
  return on
}

/**
 * Bottles at home. On a phone (and in list view): chips to show one colour at a time.
 * On a wide screen you can switch to columns, one per colour, each scrolling on its own across the full width.
 */
function CellarView({ items, onOpen, onEdit }: { items: CellarItem[]; onOpen: (i: CellarItem) => void; onEdit: (i: CellarItem) => void }) {
  const { wineMap } = useApp()
  const wide = useMedia(WIDE)
  const [view, setViewState] = useState<'list' | 'columns'>(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'columns' ? 'columns' : 'list' } catch { return 'list' }
  })
  const setView = (v: 'list' | 'columns') => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v) } catch { /* private mode */ } }
  const [group, setGroup] = useState('all')

  const typeOf = (i: CellarItem) => wineMap.get(i.wineId)?.type ?? i.wine.type
  const byGroup = useMemo(() => {
    const m = new Map(GROUPS.map((g) => [g.id, [] as CellarItem[]]))
    for (const i of items) m.get(GROUPS.find((g) => g.types.includes(typeOf(i)))?.id ?? 'other')!.push(i)
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, wineMap])
  const count = (list: CellarItem[]) => list.reduce((s, i) => s + i.quantity, 0)
  // Columns for the four main colours always; Other only when there is something in it.
  const columns = GROUPS.filter((g) => g.id !== 'other' || byGroup.get('other')!.length > 0)
  const chips = GROUPS.filter((g) => byGroup.get(g.id)!.length > 0)
  const current = group === 'all' || !byGroup.get(group)?.length ? 'all' : group
  const card = (i: CellarItem, compact = false) => <CellarCard key={i.id} i={i} onOpen={onOpen} onEdit={onEdit} compact={compact} />

  const toggle = wide && (
    <div className="flex shrink-0 rounded-full bg-sand p-1" role="radiogroup" aria-label="Cellar view">
      {([['list', 'List', List], ['columns', 'Columns', Columns3]] as const).map(([v, label, Icon]) => (
        <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)}
          className={cx('flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors', view === v ? 'bg-white text-wine-800 shadow-sm' : 'text-ink/55')}>
          <Icon size={15} /> {label}
        </button>
      ))}
    </div>
  )

  if (wide && view === 'columns') {
    return (
      <>
        <div className="flex justify-end">{toggle}</div>
        {/* Breaks out of the narrow page column to use the full width of the screen. */}
        <div className="relative left-1/2 grid w-[calc(100vw-3rem)] max-w-[1800px] -translate-x-1/2 gap-4"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((g) => {
            const list = byGroup.get(g.id)!
            return (
              <section key={g.id} className="flex min-w-0 flex-col rounded-2xl bg-sand/50 p-2" aria-label={`${g.label} wines`}>
                <h2 className="flex items-center gap-2 px-2 pb-2 pt-1 font-sans text-sm font-semibold">
                  <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: g.colour }} />
                  {g.label}
                  <span className="font-normal text-ink/50">{count(list)} bottle{count(list) === 1 ? '' : 's'}</span>
                </h2>
                <div className="max-h-[calc(100dvh-21rem)] min-h-40 space-y-2 overflow-y-auto overscroll-contain">
                  {list.length ? list.map((i) => card(i, true)) : <p className="px-2 py-6 text-center text-sm text-ink/45">No {g.label.toLowerCase()} at home</p>}
                </div>
              </section>
            )
          })}
        </div>
      </>
    )
  }

  const shown = current === 'all' ? items : byGroup.get(current)!
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="no-scrollbar -mx-4 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-4" role="tablist" aria-label="Show by type">
          {[{ id: 'all', label: 'All', colour: '' }, ...chips].map((g) => {
            const n = count(g.id === 'all' ? items : byGroup.get(g.id)!)
            return (
              <button key={g.id} type="button" role="tab" aria-selected={current === g.id} onClick={() => setGroup(g.id)}
                className={cx('chip shrink-0', current === g.id && 'chip-on')}>
                {g.colour && <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: g.colour }} />}
                {g.label} <span className={cx('tabular-nums', current === g.id ? 'text-cream/70' : 'text-ink/45')}>{n}</span>
              </button>
            )
          })}
        </div>
        {toggle}
      </div>
      {shown.map((i) => card(i))}
    </>
  )
}

/** One cellar entry. `compact` (narrow columns) puts the main button on its own line. */
function CellarCard({ i, onOpen, onEdit, compact }: { i: CellarItem; onOpen: (i: CellarItem) => void; onEdit: (i: CellarItem) => void; compact?: boolean }) {
  const me = useMe()
  const st = drinkStatus(i)
  return (
    <div className="card p-3">
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
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-wine-50 py-1.5 pl-3 pr-1.5 text-sm text-wine-800">
          <GlassWater size={16} className="shrink-0" />
          <span className="flex-1">{i.quantity > 1 ? '1 bottle open' : 'Open'} since {fmtDay(i.openedAt)}</span>
          <button className="btn btn-outline !gap-1.5 !px-3.5 !py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-400"
            onClick={() => confirm(i.quantity > 1 ? 'Finished this bottle? It comes off your stock.' : 'Finished this bottle? It was your last one, so it leaves your cellar.') && finishBottle(me.id, i)}>
            <Check size={15} /> Finished
          </button>
        </div>
      )}
      <div className={cx('mt-3 flex items-center gap-2', compact && 'flex-wrap')}>
        <div className="flex items-center rounded-full border border-sand">
          <button aria-label="One bottle less" className="p-2 text-ink/60" onClick={() => (i.quantity > 1 || confirm('Remove this wine from your cellar?')) && changeCellarQuantity(me.id, i, -1)}><Minus size={16} /></button>
          <span className="w-7 text-center text-sm font-semibold tabular-nums">{i.quantity}</span>
          <button aria-label="One bottle more" className="p-2 text-ink/60" onClick={() => changeCellarQuantity(me.id, i, 1)}><Plus size={16} /></button>
        </div>
        {i.openedAt
          ? <Link to={`/log/${i.wineId}?cellar=${i.id}`} className={cx('btn btn-primary flex-1 !py-2', compact && 'order-last basis-full')}><WineIcon size={16} /> Drink some more</Link>
          : <button className={cx('btn btn-primary flex-1 !py-2', compact && 'order-last basis-full')} onClick={() => onOpen(i)}><WineIcon size={16} /> Open a bottle</button>}
        {compact && <span className="flex-1" />}
        <button aria-label="Edit" className="btn btn-ghost !p-2" onClick={() => onEdit(i)}><Pencil size={16} /></button>
        <button aria-label="Remove" className="btn btn-ghost !p-2 text-ink/40" onClick={() => confirm('Remove this wine from your cellar?') && removeCellarItem(me.id, i.id)}><Trash2 size={16} /></button>
      </div>
      {!i.openedAt && (
        // A bottle that was opened without a check-in (e.g. before you used the app). The date can be changed with the pencil.
        <button className="btn btn-ghost mt-1.5 w-full !py-1.5 text-ink/60" onClick={() => markOpened(me.id, i, today())}>
          <GlassWater size={15} /> Already open? Mark it, no check-in
        </button>
      )}
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
