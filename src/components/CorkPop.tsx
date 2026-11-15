import { useEffect, useRef, type CSSProperties } from 'react'
import type { WineSnap } from '../lib/types'
import { isBubbly, TYPE_COLOUR } from '../lib/util'

/** How long the full pop plays before moving on (matches the keyframe timings in index.css). */
const FULL_MS = 950
const REDUCED_MS = 300

/** Where the drops fly when the cork comes out: [x, y] in px. */
const SPRAY = [[-26, -38], [-12, -58], [4, -66], [18, -54], [30, -34], [-34, -16], [36, -14]]

/**
 * A bottle that shakes and pops its cork, shown when you open a bottle from the cellar.
 * Calls `onDone` once it has played; a tap skips it.
 */
export function CorkPop({ wine, onDone }: { wine: Pick<WineSnap, 'name' | 'type'>; onDone: () => void }) {
  const done = useRef(false)
  const finish = () => { if (!done.current) { done.current = true; onDone() } }

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(finish, reduce ? REDUCED_MS : FULL_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tint = TYPE_COLOUR[wine.type]
  const glass = wine.type === 'white' || wine.type === 'rosé' || isBubbly(wine.type) ? '#3d4a2e' : '#22291c'

  return (
    <div className="fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center" role="status" aria-label={`Opening ${wine.name}`} onClick={finish}>
      <div className="pop-backdrop absolute inset-0 bg-wine-900/70" />
      <div className="pop-enter relative">
        <div className="pop-shake relative h-[200px] w-20">
          <svg viewBox="0 0 80 200" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M33 38h14v34c0 8 19 14 19 36v78a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8v-78c0-22 19-28 19-36z" fill={glass} />
            <rect x="31" y="38" width="18" height="10" rx="2" fill={tint} opacity="0.9" />
            <rect x="18" y="120" width="44" height="46" rx="4" fill="#faf6f0" />
            <rect x="18" y="128" width="44" height="6" fill={tint} />
            <path d="M22 96c2-10 8-14 10-16" stroke="#fff" strokeOpacity="0.18" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
          <div className="pop-cork absolute left-[34px] top-[22px] h-5 w-3 rounded-[3px] bg-[#c9a36a] ring-1 ring-black/10" />
          {SPRAY.map(([dx, dy], i) => (
            <span key={i} className="pop-drop absolute left-[38px] top-[36px] h-1.5 w-1.5 rounded-full"
              style={{ background: isBubbly(wine.type) ? '#f4ecd0' : tint, '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${470 + i * 30}ms` } as CSSProperties} />
          ))}
        </div>
      </div>
      <p className="pop-word relative mt-6 font-display text-3xl font-semibold text-cream">Pop!</p>
      <p className="pop-word relative mt-1 max-w-[80vw] truncate text-sm text-cream/70">{wine.name}</p>
    </div>
  )
}
