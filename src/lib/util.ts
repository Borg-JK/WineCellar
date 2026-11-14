import type { Checkin, Wine, WineSnap, WineType } from './types'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

export const today = () => new Date().toISOString().slice(0, 10)

export function timeAgo(ms: number) {
  const s = Math.max(0, (Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const euro = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n)

export const TYPE_COLOUR: Record<WineType, string> = {
  red: '#7a2439',
  white: '#e3cf7a',
  rosé: '#eba3a9',
  sparkling: '#d9c9a3',
  champagne: '#c9a55c',
  orange: '#d98a3d',
  dessert: '#c79a2b',
  fortified: '#4a2a1a',
}

/** Champagne is its own type, but counts as sparkling for badges. */
export const isBubbly = (t: WineType) => t === 'sparkling' || t === 'champagne'

/** What a check-in cost: the bottle price, or price per glass × glasses. */
export const checkinCost = (c: Pick<Checkin, 'price' | 'serving' | 'glasses'>) =>
  c.price == null ? 0 : c.serving === 'glass' ? c.price * (c.glasses || 1) : c.price

export const servingLabel = (c: Pick<Checkin, 'serving' | 'glasses'>) =>
  c.serving === 'glass' ? ((c.glasses ?? 1) > 1 ? `${c.glasses} glasses` : 'A glass') : ''

export const snapOf = (w: Wine, fallbackPhoto = ''): WineSnap => ({
  id: w.id,
  name: w.name,
  producer: w.producer,
  type: w.type,
  country: w.country,
  photo: w.photos[0] ?? fallbackPhoto,
})

/**
 * Ratings are stored as 0.5–5 (half stars, so old data keeps working) and shown out of 10.
 * 0 means "no rating".
 */
export const toTen = (stored: number) => stored * 2
export const fromTen = (score: number) => score / 2
export const fmtScore = (stored: number) => {
  const s = toTen(stored)
  return Number.isInteger(s) ? String(s) : s.toFixed(1)
}

export const avgRating = (w: Pick<Wine, 'ratingSum' | 'ratingCount'>) =>
  w.ratingCount > 0 ? w.ratingSum / w.ratingCount : 0

export const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Every word of the query must appear somewhere in the wine's text. */
export function matchesWine(w: Wine, q: string) {
  const hay = fold([w.name, w.producer, w.country, w.region, w.type, ...w.grapes].join(' '))
  return fold(q).split(/\s+/).filter(Boolean).every((t) => hay.includes(t))
}

/** A producer's id: the slug of its name, so "Château Musar" and "chateau musar" are the same producer. */
export const producerIdOf = (w: { producer: string; producerId?: string }) => w.producerId || slug(w.producer)

export const errMsg = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e)
  if (m.includes('auth/invalid-credential')) return 'Wrong email or password.'
  if (m.includes('auth/email-already-in-use')) return 'There is already an account with that email.'
  if (m.includes('auth/weak-password')) return 'Use a password of at least 6 characters.'
  if (m.includes('auth/popup-closed-by-user')) return 'Sign-in was cancelled.'
  if (m.includes('storage/')) return 'Photo upload failed. Check that Firebase Storage is enabled and its rules are deployed.'
  if (m.includes('permission')) return 'Permission denied. Check that the Firestore rules from this repo are deployed.'
  return m.replace('Firebase: ', '')
}
