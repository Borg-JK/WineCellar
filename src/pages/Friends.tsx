import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Search, Share2, UserPlus, Users, X } from 'lucide-react'
import { acceptFriendRequest, friendshipId, removeFriendship, searchUsers, sendFriendRequest } from '../lib/db'
import type { Friendship, UserProfile } from '../lib/types'
import { errMsg } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { Avatar, Empty } from '../components/ui'

function Person({ p, children }: { p: UserProfile; children?: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <Link to={`/u/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={p.photoURL} name={p.displayName} size={44} />
        <div className="min-w-0"><p className="truncate font-semibold">{p.displayName}</p><p className="truncate text-xs text-ink/55">@{p.username}</p></div>
      </Link>
      {children}
    </div>
  )
}

/** The right button for my relationship with this person. */
export function FriendButton({ other }: { other: string }) {
  const me = useMe()
  const { friendships } = useApp()
  const f: Friendship | undefined = friendships.find((x) => x.id === friendshipId(me.id, other))
  const act = (fn: () => Promise<unknown>) => fn().catch((e) => alert(errMsg(e)))
  if (other === me.id) return null
  if (!f) return <button className="btn btn-primary !py-2" onClick={() => act(() => sendFriendRequest(me.id, other))}><UserPlus size={16} /> Add</button>
  if (f.status === 'accepted') return <button className="btn btn-outline !py-2" onClick={() => confirm('Remove this friend?') && act(() => removeFriendship(f.id))}><Check size={16} /> Friends</button>
  if (f.requestedBy === me.id) return <button className="btn btn-soft !py-2" onClick={() => act(() => removeFriendship(f.id))}>Requested</button>
  return (
    <div className="flex gap-1.5">
      <button className="btn btn-primary !py-2" onClick={() => act(() => acceptFriendRequest(f.id))}>Accept</button>
      <button className="btn btn-outline !p-2" aria-label="Decline" onClick={() => act(() => removeFriendship(f.id))}><X size={16} /></button>
    </div>
  )
}

/** Share a link to my profile; whoever opens it can send me a request in one tap. */
function InviteButton() {
  const me = useMe()
  const [copied, setCopied] = useState(false)
  const invite = async () => {
    const url = `${window.location.origin}/u/${me.id}`
    const text = `Add me on WineCellar, I'm @${me.username}`
    try {
      if (navigator.share) return await navigator.share({ title: 'WineCellar', text, url })
      await navigator.clipboard.writeText(`${text}: ${url}`)
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch { /* share sheet closed */ }
  }
  return (
    <button type="button" className="btn btn-soft w-full" onClick={invite}>
      <Share2 size={17} /> {copied ? 'Link copied' : 'Invite friends with a link'}
    </button>
  )
}

export function Friends() {
  const me = useMe()
  const { friendships, friendIds, people } = useApp()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<UserProfile[]>([])
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return }
    const t = setTimeout(() => searchUsers(q).then((r) => { setResults(r.filter((p) => p.id !== me.id)); setSearched(true) }).catch(() => {}), 250)
    return () => clearTimeout(t)
  }, [q, me.id])

  const other = (f: Friendship) => people.get(f.users.find((u) => u !== me.id)!)
  const incoming = friendships.filter((f) => f.status === 'pending' && f.requestedBy !== me.id)
  const outgoing = friendships.filter((f) => f.status === 'pending' && f.requestedBy === me.id)

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Friends</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input className="input !pl-10" type="search" autoCapitalize="none" placeholder="Search by name or @username" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {results.map((p) => <Person key={p.id} p={p}><FriendButton other={p.id} /></Person>)}
        {searched && results.length === 0 && <p className="px-1 text-sm text-ink/55">Nobody found. Try the start of their name or username, or send them an invite link.</p>}
        <InviteButton />
        <p className="px-1 text-xs text-ink/50">Your username is <b>@{me.username}</b>. Friends can also search for that.</p>
      </section>

      {incoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Requests</h2>
          {incoming.map((f) => other(f) && <Person key={f.id} p={other(f)!}><FriendButton other={other(f)!.id} /></Person>)}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Your friends <span className="text-sm font-normal text-ink/50">· {friendIds.length}</span></h2>
        {friendIds.length === 0 && <Empty icon={<Users size={28} />} title="No friends yet">Search for a username above to send a request.</Empty>}
        {friendIds.map((id) => people.get(id) && <Person key={id} p={people.get(id)!}><FriendButton other={id} /></Person>)}
      </section>

      {outgoing.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Sent</h2>
          {outgoing.map((f) => other(f) && <Person key={f.id} p={other(f)!}><FriendButton other={other(f)!.id} /></Person>)}
        </section>
      )}
    </div>
  )
}
