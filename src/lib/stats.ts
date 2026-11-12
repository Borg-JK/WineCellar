import type { CellarItem, Checkin, Wine, WineType } from './types'

export interface Stats {
  total: number
  uniqueWines: number
  avg: number
  spent: number
  byType: [WineType, number][]
  topGrapes: [string, number][]
  topCountries: [string, number][]
  topStores: [string, number][]
  best: Checkin | null
}

const top = (m: Map<string, number>, n = 5) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
const bump = (m: Map<string, number>, k: string) => k && m.set(k, (m.get(k) ?? 0) + 1)

export function computeStats(checkins: Checkin[], wines: Map<string, Wine>): Stats {
  const types = new Map<string, number>(), grapes = new Map<string, number>()
  const countries = new Map<string, number>(), stores = new Map<string, number>()
  let sum = 0, rated = 0, spent = 0
  let best: Checkin | null = null
  for (const c of checkins) {
    bump(types, c.wine.type)
    bump(countries, c.wine.country)
    bump(stores, c.storeName)
    for (const g of wines.get(c.wineId)?.grapes ?? []) bump(grapes, g)
    if (c.rating > 0) { sum += c.rating; rated++ }
    if (c.price) spent += c.price
    if (c.rating > 0 && (!best || c.rating > best.rating)) best = c
  }
  return {
    total: checkins.length,
    uniqueWines: new Set(checkins.map((c) => c.wineId)).size,
    avg: rated ? sum / rated : 0,
    spent,
    byType: top(types, 7) as [WineType, number][],
    topGrapes: top(grapes),
    topCountries: top(countries),
    topStores: top(stores, 3),
    best,
  }
}

export interface Badge { id: string; emoji: string; name: string; how: string; earned: boolean; progress: string }

export function computeBadges(checkins: Checkin[], wines: Map<string, Wine>, friendCount: number, cellar: CellarItem[] | null): Badge[] {
  const n = checkins.length
  const countries = new Set(checkins.map((c) => c.wine.country).filter(Boolean)).size
  const grapes = new Set(checkins.flatMap((c) => wines.get(c.wineId)?.grapes ?? [])).size
  const types = new Set(checkins.map((c) => c.wine.type))
  const colours = ['red', 'white', 'rosé', 'sparkling'].filter((t) => types.has(t as WineType)).length
  const notes = checkins.filter((c) => c.notes.trim().length >= 20).length
  const moments = checkins.filter((c) => c.momentPhotos.length > 0).length
  const stores = new Set(checkins.map((c) => c.storeName).filter(Boolean)).size
  const bubbles = checkins.filter((c) => c.wine.type === 'sparkling').length
  const shared = checkins.filter((c) => c.withUids.length > 0).length
  const bottles = cellar?.reduce((s, i) => s + i.quantity, 0) ?? 0
  const b = (id: string, emoji: string, name: string, how: string, have: number, need: number): Badge =>
    ({ id, emoji, name, how, earned: have >= need, progress: `${Math.min(have, need)}/${need}` })
  const list = [
    b('first', '🍷', 'First sip', 'Log your first wine', n, 1),
    b('ten', '🥂', 'Regular', 'Log 10 wines', n, 10),
    b('fifty', '🎓', 'Sommelier in training', 'Log 50 wines', n, 50),
    b('globe', '🌍', 'Globetrotter', 'Drink wines from 5 countries', countries, 5),
    b('grapes', '🍇', 'Grape explorer', 'Try 10 different grapes', grapes, 10),
    b('colours', '🌈', 'Full spectrum', 'Log a red, white, rosé and sparkling', colours, 4),
    b('critic', '✍️', 'Critic', 'Write 10 proper tasting notes', notes, 10),
    b('moments', '📸', 'Moment keeper', 'Add moment photos to 5 check-ins', moments, 5),
    b('local', '🛍️', 'Local hero', 'Buy from 5 different stores', stores, 5),
    b('bubbles', '🍾', 'Bubbles', 'Log 3 sparkling wines', bubbles, 3),
    b('together', '🫶', 'Better together', 'Tag friends in 5 check-ins', shared, 5),
    b('social', '👋', 'Good company', 'Have 3 friends', friendCount, 3),
  ]
  if (cellar) list.push(b('cellar', '🗄️', 'Cellar master', 'Keep 12 bottles at home', bottles, 12))
  return list
}
