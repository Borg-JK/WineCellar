import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { GlassWater, Lock, MapPin, Pencil, MessageCircle, RotateCcw, Send, ShoppingBag, Trash2, Utensils, Wine as WineIcon } from 'lucide-react'
import { db } from '../lib/firebase'
import { addComment, deleteCheckin, deleteComment, read, toggleCheers } from '../lib/db'
import type { Checkin, Comment } from '../lib/types'
import { cx, euro, servingLabel, timeAgo } from '../lib/util'
import { useMe } from '../state/AppContext'
import { Avatar, BottleImage, Lightbox, Score, TypeDot } from './ui'

export function CheckinCard({ c }: { c: Checkin }) {
  const me = useMe()
  const [showComments, setShowComments] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)
  const mine = c.uid === me.id
  const cheered = c.cheers.includes(me.id)
  const photos = [...c.momentPhotos, ...c.bottlePhotos]

  const remove = () => {
    if (confirm('Delete this check-in? This cannot be undone.')) deleteCheckin(c).catch((e) => alert(e.message))
  }

  return (
    <article className="card fade-in overflow-hidden">
      <header className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/u/${c.uid}`}><Avatar src={c.userPhoto} name={c.userName} /></Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            <Link to={`/u/${c.uid}`} className="font-semibold">{mine ? 'You' : c.userName}</Link>
            {c.withNames.length > 0 && <span className="text-ink/60"> with {c.withNames.join(', ')}</span>}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-ink/50">
            {timeAgo(c.createdAt)}
            {c.occasion && <span>· {c.occasion}</span>}
            {c.editedAt && <span>· edited</span>}
            {c.private && <Lock size={11} aria-label="Only you can see this" />}
          </p>
        </div>
        {mine && <Link to={`/checkins/${c.id}/edit`} aria-label="Edit check-in" className="btn btn-ghost !p-2 text-ink/50"><Pencil size={16} /></Link>}
        {mine && <button onClick={remove} aria-label="Delete check-in" className="btn btn-ghost !p-2 text-ink/40"><Trash2 size={16} /></button>}
      </header>

      {c.momentPhotos.length > 0 && (
        <div className="no-scrollbar flex snap-x snap-mandatory gap-1 overflow-x-auto">
          {c.momentPhotos.map((p) => (
            <img key={p} src={p} alt="" loading="lazy" onClick={() => setZoom(p)}
              className={cx('h-72 shrink-0 cursor-zoom-in snap-center object-cover', c.momentPhotos.length === 1 ? 'w-full' : 'w-[85%]')} />
          ))}
        </div>
      )}

      <Link to={`/wines/${c.wineId}`} className="mx-4 mt-3 flex items-center gap-3 rounded-xl bg-cream p-3">
        <BottleImage src={c.bottlePhotos[0] || c.wine.photo} type={c.wine.type} className="h-20 w-14 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-ink/50">{c.wine.producer}</p>
          <p className="font-display text-lg font-semibold leading-tight">{c.wine.name}{c.vintage ? ` ${c.vintage}` : ''}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-ink/60">
            <TypeDot type={c.wine.type} /> {c.wine.type}{c.wine.country && ` · ${c.wine.country}`}
          </p>
          {c.rating > 0 && <p className="mt-1.5"><Score value={c.rating} /></p>}
        </div>
      </Link>

      <div className="space-y-2.5 px-4 pt-3">
        {c.notes && <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{c.notes}</p>}
        {c.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{c.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
          {c.serving === 'glass' && <span className="inline-flex items-center gap-1 font-medium text-wine-700"><GlassWater size={13} /> {servingLabel(c)}{c.price ? ` · ${euro(c.price)} a glass` : ''}</span>}
          {c.storeName && <span className="inline-flex items-center gap-1"><ShoppingBag size={13} /> {c.storeName}{c.price && c.serving !== 'glass' ? ` · ${euro(c.price)}` : ''}</span>}
          {c.pairing && <span className="inline-flex items-center gap-1"><Utensils size={13} /> {c.pairing}</span>}
          {c.location && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {c.location}</span>}
          {c.buyAgain && <span className="inline-flex items-center gap-1 font-medium text-wine-600"><RotateCcw size={13} /> Would buy again</span>}
        </div>
        {c.momentPhotos.length === 0 && c.bottlePhotos.length > 1 && (
          <div className="flex gap-1.5">{c.bottlePhotos.slice(1).map((p) => <img key={p} src={p} alt="" onClick={() => setZoom(p)} className="h-16 w-16 cursor-zoom-in rounded-lg object-cover" />)}</div>
        )}
      </div>

      <footer className="mt-3 flex items-center gap-1 border-t border-sand px-2 py-1.5">
        <button onClick={() => toggleCheers(c, me.id)} aria-pressed={cheered}
          className={cx('btn !px-3 !py-2', cheered ? 'text-wine-700' : 'text-ink/55')}>
          <WineIcon size={18} fill={cheered ? 'currentColor' : 'none'} /> {c.cheers.length > 0 ? c.cheers.length : ''} Cheers
        </button>
        <button onClick={() => setShowComments((s) => !s)} className="btn !px-3 !py-2 text-ink/55">
          <MessageCircle size={18} /> {c.commentCount > 0 ? c.commentCount : ''} Comment{c.commentCount === 1 ? '' : 's'}
        </button>
        {photos.length > 0 && <span className="ml-auto pr-2 text-xs text-ink/40">{photos.length} photo{photos.length > 1 ? 's' : ''}</span>}
      </footer>
      {showComments && <Comments checkinId={c.id} />}
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </article>
  )
}

function Comments({ checkinId }: { checkinId: string }) {
  const me = useMe()
  const [items, setItems] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => onSnapshot(
    query(collection(db, 'checkins', checkinId, 'comments'), orderBy('createdAt', 'asc')),
    (s) => setItems(s.docs.map((d) => read<Comment>(d))),
    (e) => console.error('[comments]', e.message),
  ), [checkinId])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    try { await addComment(checkinId, me, text); setText('') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3 border-t border-sand bg-cream/60 p-4">
      {items.map((m) => (
        <div key={m.id} className="flex gap-2.5">
          <Avatar src={m.userPhoto} name={m.userName} size={28} />
          <div className="min-w-0 flex-1 text-sm">
            <p><Link to={`/u/${m.uid}`} className="font-semibold">{m.userName}</Link> <span className="text-xs text-ink/45">{timeAgo(m.createdAt)}</span></p>
            <p className="whitespace-pre-wrap">{m.text}</p>
          </div>
          {m.uid === me.id && <button aria-label="Delete comment" onClick={() => deleteComment(checkinId, m.id)} className="self-start p-1 text-ink/35"><Trash2 size={14} /></button>}
        </div>
      ))}
      <form onSubmit={send} className="flex gap-2">
        <input className="input !rounded-full !py-2" placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
        <button className="btn btn-primary !p-2.5" aria-label="Send" disabled={!text.trim() || busy}><Send size={16} /></button>
      </form>
    </div>
  )
}
