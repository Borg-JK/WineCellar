import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Bookmark, Camera, Leaf, Pencil, Plus, Warehouse } from 'lucide-react'
import { addBottlePhotos, addToCellar, toggleWishlist } from '../lib/db'
import { avgRating, cx, errMsg, fmtScore, producerIdOf } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { CellarForm } from '../components/CellarForm'
import { photoCredit } from '../data/seedWines'
import { CheckinCard } from '../components/CheckinCard'
import { BottleImage, Empty, Lightbox, Sheet, Spinner, Score, TypeDot } from '../components/ui'

export function WineDetail() {
  const { id = '' } = useParams()
  const me = useMe()
  const { wineMap, storeMap, feed, myCheckins, wishlist, cellar } = useApp()
  const wine = wineMap.get(id)
  const [params] = useSearchParams()
  const [cellarOpen, setCellarOpen] = useState(params.get('cellar') === 'add')
  const [zoom, setZoom] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!wine) return <Empty icon={<Camera size={26} />} title="Wine not found"><Link to="/explore" className="btn btn-soft mt-3">Back to Explore</Link></Empty>

  const wished = wishlist.some((w) => w.id === wine.id)
  const atHome = cellar.filter((c) => c.wineId === wine.id).reduce((s, c) => s + c.quantity, 0)
  const mine = myCheckins.filter((c) => c.wineId === wine.id)
  const friends = feed.filter((c) => c.wineId === wine.id && c.uid !== me.id)
  const myAvg = mine.filter((c) => c.rating > 0)
  const facts: [string, string][] = [
    ['Grapes', wine.grapes.join(', ')], ['Country', wine.country], ['Region', wine.region],
    ['Alcohol', wine.abv ? `${wine.abv}%` : ''],
  ].filter(([, v]) => v) as [string, string][]

  const upload = async (list: FileList | null) => {
    if (!list?.length) return
    setUploading(true)
    try { await addBottlePhotos(wine, me.id, Array.from(list)) } catch (e) { alert(errMsg(e)) } finally { setUploading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4">
        {wine.photos.length === 0 && <BottleImage type={wine.type} className="h-64 w-full rounded-2xl" />}
        {wine.photos.map((p) => (
          <img key={p} src={p} alt="" onClick={() => setZoom(p)} className={cx('h-64 shrink-0 cursor-zoom-in snap-center rounded-2xl object-cover', wine.photos.length === 1 ? 'w-full' : 'w-48')} />
        ))}
      </div>

      {wine.photos.some((p) => p.startsWith('/bottles/')) && photoCredit(wine.id) && (
        <p className="-mt-3 text-right text-[11px] text-ink/40">
          Bottle photo: <a href={photoCredit(wine.id)!} target="_blank" rel="noreferrer" className="underline">Open Food Facts</a>, CC BY-SA
        </p>
      )}
      <div>
        <Link to={`/producers/${producerIdOf(wine)}`} className="text-sm font-medium uppercase tracking-wide text-ink/50 underline decoration-sand underline-offset-4">{wine.producer}</Link>
        <h1 className="text-3xl font-semibold leading-tight">{wine.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/65">
          <span className="inline-flex items-center gap-1.5 capitalize"><TypeDot type={wine.type} /> {wine.type}</span>
          {wine.organic && <span className="inline-flex items-center gap-1 text-green-700"><Leaf size={14} /> Organic</span>}
          {wine.ratingCount > 0
            ? <span className="inline-flex items-center gap-1.5"><Score value={avgRating(wine)} /> <span>from {wine.ratingCount} rating{wine.ratingCount === 1 ? '' : 's'}</span></span>
            : <span>No ratings yet</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link to={`/log/${wine.id}`} className="btn btn-primary col-span-2"><Plus size={18} /> Log this wine</Link>
        <button className="btn btn-outline" onClick={() => setCellarOpen(true)}><Warehouse size={17} /> {atHome ? `${atHome} at home` : 'Add to cellar'}</button>
        <button className={cx('btn', wished ? 'btn-soft' : 'btn-outline')} onClick={() => toggleWishlist(me.id, wine, !wished).catch((e) => alert(errMsg(e)))}>
          <Bookmark size={17} fill={wished ? 'currentColor' : 'none'} /> {wished ? 'On wishlist' : 'Wishlist'}
        </button>
        <button className="btn btn-ghost" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? <Spinner /> : <Camera size={17} />} Add bottle photo</button>
        {wine.source === 'user' && wine.createdBy === me.id && <Link to={`/wines/${wine.id}/edit`} className="btn btn-ghost"><Pencil size={16} /> Edit details</Link>}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {facts.length > 0 && (
        <dl className="card grid grid-cols-2 gap-x-4 gap-y-3 p-4">
          {facts.map(([k, v]) => <div key={k}><dt className="label !mb-0.5">{k}</dt><dd className="text-sm font-medium">{v}</dd></div>)}
        </dl>
      )}

      {wine.storeIds.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Where to buy</h2>
          <div className="flex flex-wrap gap-2">
            {wine.storeIds.map((s) => storeMap.get(s) && <Link key={s} to={`/stores/${s}`} className="chip">{storeMap.get(s)!.name}</Link>)}
          </div>
        </section>
      )}

      {mine.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Your check-ins <span className="text-sm font-normal text-ink/50">· {mine.length}×{myAvg.length > 0 && `, avg ${fmtScore(myAvg.reduce((s, c) => s + c.rating, 0) / myAvg.length)}/10`}</span>
          </h2>
          {mine.map((c) => <CheckinCard key={c.id} c={c} />)}
        </section>
      )}
      {friends.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Friends who drank this</h2>
          {friends.map((c) => <CheckinCard key={c.id} c={c} />)}
        </section>
      )}

      <Sheet open={cellarOpen} onClose={() => setCellarOpen(false)} title="Add to cellar">
        <CellarForm wineId={wine.id} submitLabel="Add to cellar" onSubmit={async (v) => { await addToCellar(me.id, wine, v, cellar); setCellarOpen(false) }} />
      </Sheet>
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </div>
  )
}
