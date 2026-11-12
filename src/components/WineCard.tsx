import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Wine, WineSnap } from '../lib/types'
import { avgRating } from '../lib/util'
import { BottleImage, Stars, TypeDot } from './ui'

export function WineRow({ wine, to, right, sub }: { wine: Wine | WineSnap; to?: string; right?: ReactNode; sub?: ReactNode }) {
  const full = 'grapes' in wine ? wine : null
  const photo = full ? full.photos[0] : (wine as WineSnap).photo
  const body = (
    <>
      <BottleImage src={photo} type={wine.type} className="h-16 w-12 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-ink/50">{wine.producer}</p>
        <p className="truncate font-display text-[17px] font-semibold leading-snug">{wine.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink/60">
          <span className="inline-flex items-center gap-1 capitalize"><TypeDot type={wine.type} /> {wine.type}</span>
          {wine.country && <span>· {wine.country}</span>}
          {full && full.grapes.length > 0 && <span className="truncate">· {full.grapes.slice(0, 2).join(', ')}</span>}
          {full && full.ratingCount > 0 && (
            <span className="inline-flex items-center gap-1">· <Stars value={avgRating(full)} size={12} /> {avgRating(full).toFixed(1)}</span>
          )}
        </div>
        {sub}
      </div>
    </>
  )
  return (
    <div className="card flex items-center gap-3 p-3">
      {to ? <Link to={to} className="flex min-w-0 flex-1 items-center gap-3">{body}</Link> : <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>}
      {right}
    </div>
  )
}
