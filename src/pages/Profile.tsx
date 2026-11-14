import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Camera, LogOut, Pencil, Users, Wine as WineIcon } from 'lucide-react'
import { auth, db } from '../lib/firebase'
import { getProfile, read, updateProfileDoc, uploadAvatar } from '../lib/db'
import { computeBadges, computeStats } from '../lib/stats'
import type { Checkin, UserProfile, Wine, WineSnap } from '../lib/types'
import { cx, errMsg, euro, fmtScore, TYPE_COLOUR } from '../lib/util'
import { checkinDefaults, useApp, useMe } from '../state/AppContext'
import { CheckinCard } from '../components/CheckinCard'
import { WineRow } from '../components/WineCard'
import { Avatar, Empty, ErrorNote, Field, FullSpinner, Sheet, Spinner, Score, Tabs } from '../components/ui'
import { FriendButton } from './Friends'

export function Profile() {
  const { uid } = useParams()
  const me = useMe()
  const { myCheckins, feed, friendIds, people, wineMap, cellar } = useApp()
  const isMe = !uid || uid === me.id
  const isFriend = !!uid && friendIds.includes(uid)

  const [other, setOther] = useState<UserProfile | null | undefined>(undefined)
  const [theirs, setTheirs] = useState<Checkin[] | null>(null)
  const [tab, setTab] = useState<'activity' | 'wines' | 'stats' | 'badges'>('activity')
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (isMe) return
    setOther(people.get(uid!) ?? undefined); setTheirs(null)
    getProfile(uid!).then(setOther).catch(() => setOther(null))
  }, [uid, isMe])

  // A friend's full history; falls back to what is already in the feed.
  useEffect(() => {
    if (isMe || !isFriend) return
    getDocs(query(collection(db, 'checkins'), where('visibleTo', 'array-contains', me.id), where('uid', '==', uid)))
      .then((s) => setTheirs(s.docs.map((d) => read<Checkin>(d)).sort((a, b) => b.createdAt - a.createdAt)))
      .catch(() => setTheirs(null))
  }, [uid, isMe, isFriend, me.id])

  const person = isMe ? me : other
  const checkins = useMemo(
    () => (isMe ? myCheckins : (theirs ?? feed.filter((c) => c.uid === uid)).map(checkinDefaults)),
    [isMe, myCheckins, theirs, feed, uid],
  )
  const stats = useMemo(() => computeStats(checkins, wineMap), [checkins, wineMap])
  const badges = useMemo(() => computeBadges(checkins, wineMap, isMe ? friendIds.length : 0, isMe ? cellar : null).filter((b) => isMe || b.id !== 'social'), [checkins, wineMap, friendIds.length, cellar, isMe])

  if (person === undefined) return <FullSpinner />
  if (person === null) return <Empty icon={<WineIcon size={26} />} title="User not found" />

  const maxType = Math.max(1, ...stats.byType.map(([, n]) => n))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {isMe ? (
          <button type="button" aria-label={me.photoURL ? 'Change profile photo' : 'Add a profile photo'} onClick={() => setEditOpen(true)} className="relative shrink-0 cursor-pointer">
            <Avatar src={person.photoURL} name={person.displayName} size={76} />
            <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-cream bg-wine-700 p-1.5 text-white"><Camera size={13} /></span>
          </button>
        ) : <Avatar src={person.photoURL} name={person.displayName} size={76} />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{person.displayName}</h1>
          <p className="text-sm text-ink/55">@{person.username}</p>
          {person.bio && <p className="mt-1 text-sm">{person.bio}</p>}
        </div>
      </div>
      {isMe ? (
        <div className="flex gap-2">
          <button className="btn btn-outline flex-1 whitespace-nowrap" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit profile</button>
          <Link to="/friends" aria-label={`Friends: ${friendIds.length}`} className="btn btn-outline whitespace-nowrap"><Users size={16} /> {friendIds.length}</Link>
          <button className="btn btn-ghost !px-3" aria-label="Log out" title="Log out" onClick={() => signOut(auth)}><LogOut size={18} /></button>
        </div>
      ) : <FriendButton other={person.id} />}

      {!isMe && !isFriend ? (
        <Empty icon={<WineIcon size={26} />} title="Friends only">Become friends to see what {person.displayName} has been drinking.</Empty>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[[stats.total, 'check-ins'], [stats.uniqueWines, 'wines'], [stats.avg ? `${fmtScore(stats.avg)}` : '–', 'avg /10'], [badges.filter((b) => b.earned).length, 'badges']].map(([n, l]) => (
              <div key={l} className="card px-1 py-3"><p className="font-display text-xl font-semibold text-wine-700">{n}</p><p className="text-[11px] text-ink/55">{l}</p></div>
            ))}
          </div>
          <Tabs value={tab} onChange={setTab} options={[{ id: 'activity', label: 'Activity' }, { id: 'wines', label: 'Wines' }, { id: 'stats', label: 'Taste' }, { id: 'badges', label: 'Badges' }]} />

          {tab === 'activity' && (checkins.length === 0
            ? <Empty icon={<WineIcon size={26} />} title="No check-ins yet" />
            : <div className="space-y-4">{checkins.slice(0, 50).map((c) => <CheckinCard key={c.id} c={c} />)}</div>)}

          {tab === 'wines' && <TastedWines checkins={checkins} isMe={isMe} />}

          {tab === 'stats' && (stats.total === 0 ? <Empty icon={<WineIcon size={26} />} title="Log a few wines first">Your taste profile builds itself from your check-ins.</Empty> : (
            <div className="space-y-4">
              <section className="card space-y-2.5 p-4">
                <h2 className="text-lg font-semibold">By type</h2>
                {stats.byType.map(([t, n]) => (
                  <div key={t} className="flex items-center gap-3 text-sm">
                    <span className="w-20 capitalize">{t}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full" style={{ width: `${(n / maxType) * 100}%`, background: TYPE_COLOUR[t] }} /></div>
                    <span className="w-6 text-right tabular-nums text-ink/60">{n}</span>
                  </div>
                ))}
              </section>
              <div className="grid grid-cols-2 gap-3">
                <TopList title="Top grapes" rows={stats.topGrapes} />
                <TopList title="Top countries" rows={stats.topCountries} />
              </div>
              <TopList title="Favourite stores" rows={stats.topStores} />
              {stats.best && (
                <section className="card p-4">
                  <h2 className="text-lg font-semibold">Highest rated</h2>
                  <p className="mt-1 text-sm">{stats.best.wine.producer} {stats.best.wine.name}</p>
                  <p className="mt-1.5"><Score value={stats.best.rating} /></p>
                </section>
              )}
              {isMe && stats.spent > 0 && <p className="px-1 text-sm text-ink/60">Total spent on logged bottles: <b className="text-ink">{euro(stats.spent)}</b></p>}
            </div>
          ))}

          {tab === 'badges' && (
            <div className="grid grid-cols-2 gap-2.5">
              {badges.map((b) => (
                <div key={b.id} className={cx('card p-3.5', !b.earned && 'opacity-55')}>
                  <p className={cx('text-3xl', !b.earned && 'grayscale')}>{b.emoji}</p>
                  <p className="mt-1.5 font-semibold leading-tight">{b.name}</p>
                  <p className="mt-0.5 text-xs text-ink/60">{b.how}</p>
                  <p className={cx('mt-1.5 text-xs font-semibold', b.earned ? 'text-green-700' : 'text-ink/45')}>{b.earned ? 'Earned' : b.progress}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {isMe && <EditProfile open={editOpen} onClose={() => setEditOpen(false)} />}
    </div>
  )
}

type WineSort = 'recent' | 'rating' | 'count' | 'name'

/** Every wine in these check-ins once, with how often, how good and when last. */
function TastedWines({ checkins, isMe }: { checkins: Checkin[]; isMe: boolean }) {
  const { wineMap } = useApp()
  const [sort, setSort] = useState<WineSort>('recent')
  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const m = new Map<string, { wine: Wine | WineSnap; times: number; rated: number; sum: number; best: number; last: string; glass: number }>()
    for (const c of checkins) {
      const r = m.get(c.wineId) ?? { wine: wineMap.get(c.wineId) ?? c.wine, times: 0, rated: 0, sum: 0, best: 0, last: '', glass: 0 }
      r.times++
      if (c.rating > 0) { r.rated++; r.sum += c.rating; r.best = Math.max(r.best, c.rating) }
      const when = c.drankAt || new Date(c.createdAt).toISOString().slice(0, 10)
      if (when > r.last) r.last = when
      if (c.serving === 'glass') r.glass++
      m.set(c.wineId, r)
    }
    const avg = (r: { rated: number; sum: number }) => (r.rated ? r.sum / r.rated : 0)
    const list = [...m.entries()].map(([id, r]) => ({ id, ...r, avg: avg(r) }))
    const needle = q.trim().toLowerCase()
    const shown = needle ? list.filter((r) => `${r.wine.producer} ${r.wine.name} ${r.wine.type} ${r.wine.country}`.toLowerCase().includes(needle)) : list
    const by: Record<WineSort, (a: typeof list[number], b: typeof list[number]) => number> = {
      recent: (a, b) => b.last.localeCompare(a.last),
      rating: (a, b) => b.avg - a.avg || b.times - a.times,
      count: (a, b) => b.times - a.times || b.last.localeCompare(a.last),
      name: (a, b) => `${a.wine.producer} ${a.wine.name}`.localeCompare(`${b.wine.producer} ${b.wine.name}`),
    }
    return { total: list.length, shown: shown.sort(by[sort]) }
  }, [checkins, wineMap, sort, q])

  if (rows.total === 0) return <Empty icon={<WineIcon size={26} />} title="No wines yet">{isMe ? 'Every wine you log shows up here.' : 'Nothing logged yet.'}</Empty>
  const date = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input className="input flex-1" type="search" placeholder={`Search ${rows.total} wine${rows.total === 1 ? '' : 's'}`} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-auto" aria-label="Sort wines" value={sort} onChange={(e) => setSort(e.target.value as WineSort)}>
          <option value="recent">Recent</option>
          <option value="rating">Best rated</option>
          <option value="count">Most often</option>
          <option value="name">A–Z</option>
        </select>
      </div>
      <p className="px-1 text-xs text-ink/50">{rows.total} different wine{rows.total === 1 ? '' : 's'} tasted</p>
      {rows.shown.map((r) => (
        <WineRow key={r.id} wine={r.wine} to={`/wines/${r.id}`} hideRating sub={
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-wine-700">
            {r.avg > 0 && <Score value={r.avg} size="sm" />}
            <span>{r.times}×{r.glass > 0 && r.glass === r.times ? ' by the glass' : ''}</span>
            {r.last && <span className="text-ink/50">last {date(r.last)}</span>}
          </p>
        } />
      ))}
    </div>
  )
}

function TopList({ title, rows }: { title: string; rows: [string, number][] }) {
  if (rows.length === 0) return null
  return (
    <section className="card p-4">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <ol className="space-y-1 text-sm">
        {rows.map(([k, n]) => <li key={k} className="flex justify-between gap-2"><span className="truncate">{k}</span><span className="tabular-nums text-ink/50">{n}</span></li>)}
      </ol>
    </section>
  )
}

function EditProfile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe()
  const [displayName, setDisplayName] = useState(me.displayName)
  const [bio, setBio] = useState(me.bio)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : me.photoURL), [file, me.photoURL])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const photoURL = file ? await uploadAvatar(me.id, file) : me.photoURL
      await updateProfileDoc(me.id, { displayName: displayName.trim(), bio: bio.trim(), photoURL })
      setFile(null); onClose()
    } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit profile">
      <form onSubmit={submit} className="space-y-4">
        <button type="button" onClick={() => input.current?.click()} className="relative mx-auto block cursor-pointer">
          <Avatar src={preview} name={displayName} size={88} />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-wine-700 p-2 text-white"><Camera size={14} /></span>
        </button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Field label="Name"><input className="input" required maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></Field>
        <Field label="Bio"><input className="input" maxLength={120} placeholder="Riesling evangelist" value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        <p className="text-xs text-ink/50">New name and photo show on check-ins you log from now on.</p>
        <ErrorNote>{error}</ErrorNote>
        <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}Save</button>
      </form>
    </Sheet>
  )
}
