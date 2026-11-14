import { Link, useParams } from 'react-router-dom'
import { Factory, Plus } from 'lucide-react'
import { producerIdOf } from '../lib/util'
import { useApp } from '../state/AppContext'
import { WineRow } from '../components/WineCard'
import { Empty } from '../components/ui'

export function ProducerDetail() {
  const { id = '' } = useParams()
  const { producerMap, wines, myCheckins } = useApp()
  const p = producerMap.get(id)
  if (!p) return <Empty icon={<Factory size={26} />} title="Producer not found"><Link to="/explore" className="btn btn-soft mt-3">Back</Link></Empty>

  const theirs = wines.filter((w) => producerIdOf(w) === id)
  const tasted = new Set(myCheckins.filter((c) => theirs.some((w) => w.id === c.wineId)).map((c) => c.wineId)).size

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-ink/50">Producer</p>
        <h1 className="text-3xl font-semibold leading-tight">{p.name}</h1>
        {(p.region || p.country) && <p className="mt-1 text-sm text-ink/60">{[p.region, p.country].filter(Boolean).join(', ')}</p>}
        {tasted > 0 && <p className="mt-2 text-sm text-wine-700">You've tasted {tasted} of their wines.</p>}
      </div>
      <Link to={`/wines/new?producer=${encodeURIComponent(id)}`} className="btn btn-soft w-full"><Plus size={18} /> Add a wine by {p.name}</Link>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Wines <span className="text-sm font-normal text-ink/50">· {theirs.length}</span></h2>
        {theirs.length === 0 && <p className="text-sm text-ink/55">No wines from this producer yet.</p>}
        {theirs.map((w) => <WineRow key={w.id} wine={w} to={`/wines/${w.id}`} />)}
      </section>
    </div>
  )
}
