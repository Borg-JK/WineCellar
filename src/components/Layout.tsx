import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, Home, Plus, User, Users, Warehouse } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { cx } from '../lib/util'

const tab = ({ isActive }: { isActive: boolean }) =>
  cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition', isActive ? 'text-wine-700' : 'text-ink/45')

export function Layout() {
  const { friendships, user } = useApp()
  const pending = friendships.filter((f) => f.status === 'pending' && f.requestedBy !== user?.uid).length
  const scroller = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  useEffect(() => { scroller.current?.scrollTo(0, 0) }, [pathname])
  return (
    <div className="flex h-full flex-col">
      <header className="z-30 mx-auto flex w-full max-w-xl shrink-0 items-center justify-between bg-cream px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-wine-700">WineCellar</Link>
        <Link to="/friends" className="relative inline-flex items-center gap-1.5 rounded-full bg-wine-50 px-3 py-1.5 text-sm font-semibold text-wine-700 hover:bg-wine-100">
          <Users size={18} /> Friends
          {pending > 0 && <span aria-label={`${pending} friend request${pending > 1 ? 's' : ''}`} className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-wine-600 px-1 text-[10px] font-bold text-white">{pending}</span>}
        </Link>
      </header>
      <main ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-xl px-4 pb-8"><Outlet /></div>
      </main>
      <nav className="z-30 shrink-0 border-t border-sand bg-white safe-bottom" aria-label="Main">
        <div className="mx-auto flex max-w-xl items-end px-2">
          <NavLink to="/" end className={tab}><Home size={22} />Feed</NavLink>
          <NavLink to="/explore" className={tab}><Compass size={22} />Explore</NavLink>
          <div className="flex flex-1 justify-center">
            <Link to="/log" aria-label="Log a wine" className="-mt-5 mb-1.5 flex h-14 w-14 items-center justify-center rounded-full bg-wine-700 text-cream shadow-lg shadow-wine-900/25 transition active:scale-95">
              <Plus size={28} />
            </Link>
          </div>
          <NavLink to="/cellar" className={tab}><Warehouse size={22} />Cellar</NavLink>
          <NavLink to="/profile" className={tab}><User size={22} />Profile</NavLink>
        </div>
      </nav>
    </div>
  )
}
