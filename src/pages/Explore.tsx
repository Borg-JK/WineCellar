import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Search, Store as StoreIcon } from 'lucide-react'
import { createStore } from '../lib/db'
import { WINE_TYPES, type Store, type WineType } from '../lib/types'
import { cx, errMsg, matchesWine } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { WineRow } from '../components/WineCard'
import { ErrorNote, Field, Sheet, Spinner, Tabs } from '../components/ui'

/** Search box + type and store filters over the merged catalogue. Also used as the picker on the Log page. */
export function WineSearch({ linkTo, addLink }: { linkTo: (id: string) => string; addLink: string }) {
  const { wines, stores } = useApp()
  const [q, setQ] = useState('')
  const [type, setType] = useState<WineType | null>(null)
  const [storeId, setStoreId] = useState('')
  const results = useMemo(
    () => wines.filter((w) => (!type || w.type === type) && (!storeId || w.storeIds.includes(storeId)) && matchesWine(w, q)),
    [wines, q, type, storeId],
  )
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
        <input className="input !pl-10" type="search" placeholder="Search wine, producer, grape, country…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {WINE_TYPES.map((t) => (
          <button key={t} onClick={() => setType(type === t ? null : t)} className={cx('chip shrink-0 capitalize', type === t && 'chip-on')}>{t}</button>
        ))}
      </div>
      <select className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Filter by store">
        <option value="">All stores</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <p className="text-xs text-ink/50">{results.length} wine{results.length === 1 ? '' : 's'}</p>
      <div className="space-y-2">
        {results.slice(0, 80).map((w) => <WineRow key={w.id} wine={w} to={linkTo(w.id)} right={<ChevronRight size={18} className="text-ink/30" />} />)}
      </div>
      <Link to={addLink} className="card flex items-center gap-3 border-dashed !border-wine-300 bg-wine-50 p-4 text-sm font-semibold text-wine-800">
        <Plus size={20} /> Can't find it? Add the wine yourself
      </Link>
    </div>
  )
}

const KIND_LABEL: Record<Store['kind'], string> = { supermarket: 'Supermarket', chain: 'Liquor store chain', specialist: 'Wine shop', online: 'Online', other: 'Other' }

function Stores() {
  const me = useMe()
  const { stores, wines } = useApp()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', kind: 'specialist' as Store['kind'], address: '', area: '', website: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const count = (id: string) => wines.filter((w) => w.storeIds.includes(id)).length

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await createStore(me.id, { name: f.name.trim(), kind: f.kind, address: f.address.trim(), area: f.area.trim(), website: f.website.trim() })
      setOpen(false); setF({ name: '', kind: 'specialist', address: '', area: '', website: '' })
    } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-2">
      {stores.map((s) => (
        <Link key={s.id} to={`/stores/${s.id}`} className="card flex items-center gap-3 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wine-50 text-wine-600"><StoreIcon size={20} /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{s.name}</p>
            <p className="truncate text-xs text-ink/55">{KIND_LABEL[s.kind]}{s.address && ` · ${s.address}`}{s.area && ` · ${s.area}`}</p>
          </div>
          <span className="text-xs text-ink/45">{count(s.id) || ''}</span>
          <ChevronRight size={18} className="text-ink/30" />
        </Link>
      ))}
      <button onClick={() => setOpen(true)} className="btn btn-soft w-full"><Plus size={18} /> Add a store</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add a store">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Kind">
            <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Store['kind'] })}>
              {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Address"><input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Neighbourhood"><input className="input" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></Field>
          <Field label="Website"><input className="input" type="url" placeholder="https://" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></Field>
          <ErrorNote>{error}</ErrorNote>
          <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}Save store</button>
        </form>
      </Sheet>
    </div>
  )
}

export function Explore() {
  const [tab, setTab] = useState<'wines' | 'stores'>('wines')
  return (
    <div className="space-y-4">
      <Tabs value={tab} onChange={setTab} options={[{ id: 'wines', label: 'Wines' }, { id: 'stores', label: 'Stores' }]} />
      {tab === 'wines' ? <WineSearch linkTo={(id) => `/wines/${id}`} addLink="/wines/new" /> : <Stores />}
    </div>
  )
}
