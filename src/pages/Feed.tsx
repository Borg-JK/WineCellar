import { Link } from 'react-router-dom'
import { GlassWater } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { CheckinCard } from '../components/CheckinCard'
import { Empty } from '../components/ui'

export function Feed() {
  const { feed, friendIds } = useApp()
  if (feed.length === 0) {
    return (
      <Empty icon={<GlassWater size={28} />} title="Nothing poured yet">
        <p>Log your first wine, or add friends to see what they are drinking.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/log" className="btn btn-primary">Log a wine</Link>
          <Link to="/friends" className="btn btn-soft">Find friends</Link>
        </div>
      </Empty>
    )
  }
  return (
    <div className="space-y-4">
      {friendIds.length === 0 && (
        <Link to="/friends" className="card flex items-center justify-between bg-wine-50 p-4 text-sm">
          <span>Your feed is just you so far.</span><span className="font-semibold text-wine-700">Find friends →</span>
        </Link>
      )}
      {feed.map((c) => <CheckinCard key={c.id} c={c} />)}
    </div>
  )
}
