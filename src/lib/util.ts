import type { CellarItem, Checkin, Wine, WineSnap, WineType } from './types'

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

/** "14 Nov" for a YYYY-MM-DD date, with the year added when it isn't this year. */
export function fmtDay(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return iso
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
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

/** Bundled Open Food Facts photos lived under /bottles/; they are gone, and old references to them are ignored. */
export const isUsablePhoto = (url: string | undefined | null): url is string => !!url && !url.startsWith('/bottles/')

/** `newestPhoto` (a bottle photo just taken) wins over the wine's current main photo. */
export const snapOf = (w: Wine, newestPhoto = ''): WineSnap => ({
  id: w.id,
  name: w.name,
  producer: w.producer,
  type: w.type,
  country: w.country,
  photo: newestPhoto || w.photos.find(isUsablePhoto) || '',
})

/**
 * Ratings are stored as 0.5–5 (half stars, so old data keeps working) and shown out of 10.
 * 0 means "no rating".
 */
export const toTen = (stored: number) => stored * 2
export const fromTen = (score: number) => score / 2
export const fmtScore = (stored: number) => {
  // Scores go in steps of 0.25 (7, 7.25, 7.5…); averages are rounded to two decimals.
  return String(Number(toTen(stored).toFixed(2)))
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

/**
 * What you paid and where, the last time you bought this wine: your newest cellar entry,
 * else your newest check-in of a bottle. Used to fill in forms so you don't type it again.
 */
export function lastPurchase(wineId: string, cellar: CellarItem[], checkins: Checkin[]) {
  const inCellar = cellar.filter((c) => c.wineId === wineId).sort((a, b) => b.createdAt - a.createdAt)[0]
  if (inCellar) return { vintage: inCellar.vintage, storeName: inCellar.storeName, price: inCellar.price, from: 'cellar' as const }
  const logged = checkins.filter((c) => c.wineId === wineId && c.serving !== 'glass' && (c.storeName || c.price != null))
    .sort((a, b) => b.createdAt - a.createdAt)[0]
  if (logged) return { vintage: logged.vintage, storeName: logged.storeName, price: logged.price, from: 'checkin' as const }
  return null
}

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
