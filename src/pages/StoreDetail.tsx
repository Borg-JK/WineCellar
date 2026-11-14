import { Link, useParams } from 'react-router-dom'
import { ExternalLink, MapPin, Store as StoreIcon } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { WineRow } from '../components/WineCard'
import { Empty } from '../components/ui'
import { checkinCost, euro } from '../lib/util'

export function StoreDetail() {
  const { id = '' } = useParams()
  const { storeMap, wines, myCheckins, feed } = useApp()
  const store = storeMap.get(id)
  if (!store) return <Empty icon={<StoreIcon size={26} />} title="Store not found"><Link to="/explore" className="btn btn-soft mt-3">Back</Link></Empty>

  const here = wines.filter((w) => w.storeIds.includes(id))
  const bought = myCheckins.filter((c) => c.storeId === id)
  const spent = bought.reduce((s, c) => s + checkinCost(c), 0)
  const friendsHere = new Set(feed.filter((c) => c.storeId === id).map((c) => c.uid)).size
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address ?? ''} Rotterdam`)}`

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold leading-tight">{store.name}</h1>
        {(store.address || store.area) && <p className="mt-1 text-sm text-ink/60">{[store.address, store.area].filter(Boolean).join(' · ')}</p>}
        {store.note && <p className="mt-2 text-sm">{store.note}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={maps} target="_blank" rel="noreferrer" className="btn btn-outline !py-2"><MapPin size={16} /> Map</a>
          {store.website && <a href={store.website} target="_blank" rel="noreferrer" className="btn btn-outline !py-2"><ExternalLink size={16} /> Website</a>}
        </div>
      </div>
      {(bought.length > 0 || friendsHere > 0) && (
        <p className="card p-4 text-sm">
          You logged <b>{bought.length}</b> bottle{bought.length === 1 ? '' : 's'} from here{spent > 0 && <> for <b>{euro(spent)}</b></>}.
          {friendsHere > 0 && ` ${friendsHere} ${friendsHere === 1 ? 'person' : 'people'} in your feed shop here.`}
        </p>
      )}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Wines found here <span className="text-sm font-normal text-ink/50">· {here.length}</span></h2>
        {here.length === 0 && <p className="text-sm text-ink/55">No wines linked to this store yet. Log one you bought here and it appears in this list.</p>}
        {here.map((w) => <WineRow key={w.id} wine={w} to={`/wines/${w.id}`} />)}
      </section>
    </div>
  )
}
