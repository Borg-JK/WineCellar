import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { getProfile, read, syncVisibility } from '../lib/db'
import type { CellarItem, Checkin, Friendship, Producer, Store, UserProfile, Wine, WishlistItem } from '../lib/types'
import { producerIdOf } from '../lib/util'
import { SEED_PRODUCERS } from '../data/seedProducers'
import { SEED_WINES } from '../data/seedWines'
import { SEED_STORES } from '../data/seedStores'

interface AppState {
  user: User | null
  authReady: boolean
  /** undefined = still loading, null = signed in but no profile yet */
  profile: UserProfile | null | undefined
  friendships: Friendship[]
  friendIds: string[]
  /** Profiles of friends and of people with a pending request, by uid. */
  people: Map<string, UserProfile>
  wines: Wine[]
  wineMap: Map<string, Wine>
  stores: Store[]
  storeMap: Map<string, Store>
  /** Every known producer: the starter list, producers of catalogue and user wines, and ones users added. */
  producers: Producer[]
  producerMap: Map<string, Producer>
  myCheckins: Checkin[]
  /** False until the first snapshot of your own check-ins arrives. */
  myCheckinsLoaded: boolean
  feed: Checkin[]
  cellar: CellarItem[]
  wishlist: WishlistItem[]
}

const Ctx = createContext<AppState>(null!)
export const useApp = () => useContext(Ctx)

/** Signed-in user with a profile; only call below the auth gate. */
export function useMe() {
  const { profile } = useApp()
  return profile as UserProfile
}

export const checkinDefaults = (c: Checkin): Checkin => ({
  ...c,
  tags: c.tags ?? [], momentPhotos: c.momentPhotos ?? [], bottlePhotos: c.bottlePhotos ?? [],
  cheers: c.cheers ?? [], visibleTo: c.visibleTo ?? [], withUids: c.withUids ?? [], withNames: c.withNames ?? [],
  notes: c.notes ?? '', storeName: c.storeName ?? '', commentCount: c.commentCount ?? 0,
  serving: c.serving ?? 'bottle', glasses: c.glasses ?? null,
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [friendshipsLoaded, setFriendshipsLoaded] = useState(false)
  const [people, setPeople] = useState<Map<string, UserProfile>>(new Map())
  const [dbWines, setDbWines] = useState<Wine[]>([])
  const [dbStores, setDbStores] = useState<Store[]>([])
  const [dbProducers, setDbProducers] = useState<Producer[]>([])
  const [myCheckins, setMyCheckins] = useState<Checkin[]>([])
  const [myCheckinsLoaded, setMyCheckinsLoaded] = useState(false)
  const [rawFeed, setRawFeed] = useState<Checkin[]>([])
  const [cellar, setCellar] = useState<CellarItem[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true) }), [])

  const uid = user?.uid
  useEffect(() => {
    setProfile(undefined); setFriendships([]); setFriendshipsLoaded(false); setMyCheckins([])
    setMyCheckinsLoaded(false); setRawFeed([]); setCellar([]); setWishlist([]); setPeople(new Map())
    if (!uid) return
    const log = (what: string) => (e: Error) => console.error(`[${what}]`, e.message)
    const byNewest = <T extends { createdAt: number }>(a: T, b: T) => b.createdAt - a.createdAt
    const checkins = collection(db, 'checkins')

    // The ordered feed query needs a composite index. Until it exists, fall back to an unordered one.
    let feedUnsub = onSnapshot(
      query(checkins, where('visibleTo', 'array-contains', uid), orderBy('createdAt', 'desc'), limit(100)),
      (s) => setRawFeed(s.docs.map((d) => checkinDefaults(read<Checkin>(d)))),
      (e) => {
        log('feed (ordered)')(e)
        feedUnsub = onSnapshot(
          query(checkins, where('visibleTo', 'array-contains', uid), limit(300)),
          (s) => setRawFeed(s.docs.map((d) => checkinDefaults(read<Checkin>(d))).sort(byNewest)),
          log('feed'),
        )
      },
    )

    const unsubs = [
      onSnapshot(doc(db, 'users', uid), (s) => setProfile(s.exists() ? read<UserProfile>(s) : null), (e) => { log('profile')(e); setProfile(null) }),
      onSnapshot(query(collection(db, 'friendships'), where('users', 'array-contains', uid)), (s) => {
        setFriendships(s.docs.map((d) => read<Friendship>(d))); setFriendshipsLoaded(true)
      }, log('friendships')),
      onSnapshot(collection(db, 'wines'), (s) => setDbWines(s.docs.map((d) => {
        const w = read<Wine>(d)
        return { ...w, grapes: w.grapes ?? [], photos: w.photos ?? [], storeIds: w.storeIds ?? [], ratingSum: w.ratingSum ?? 0, ratingCount: w.ratingCount ?? 0 }
      })), log('wines')),
      onSnapshot(collection(db, 'stores'), (s) => setDbStores(s.docs.map((d) => read<Store>(d))), log('stores')),
      onSnapshot(collection(db, 'producers'), (s) => setDbProducers(s.docs.map((d) => ({ ...read<Producer>(d), source: 'user' as const }))), log('producers')),
      onSnapshot(query(checkins, where('uid', '==', uid)), (s) => {
        setMyCheckins(s.docs.map((d) => checkinDefaults(read<Checkin>(d))).sort(byNewest)); setMyCheckinsLoaded(true)
      }, log('my check-ins')),
      onSnapshot(collection(db, 'users', uid, 'cellar'), (s) => setCellar(s.docs.map((d) => read<CellarItem>(d)).sort(byNewest)), log('cellar')),
      onSnapshot(collection(db, 'users', uid, 'wishlist'), (s) => setWishlist(s.docs.map((d) => read<WishlistItem>(d)).sort(byNewest)), log('wishlist')),
    ]
    return () => { feedUnsub(); unsubs.forEach((u) => u()) }
  }, [uid])

  const friendIds = useMemo(
    () => friendships.filter((f) => f.status === 'accepted').map((f) => f.users.find((u) => u !== uid)!).sort(),
    [friendships, uid],
  )

  // Load the profiles behind every friendship (accepted or pending).
  const otherIds = useMemo(() => friendships.map((f) => f.users.find((u) => u !== uid)!).sort().join(','), [friendships, uid])
  useEffect(() => {
    if (!otherIds) return
    let live = true
    Promise.all(otherIds.split(',').map((id) => getProfile(id).catch(() => null))).then((ps) => {
      if (live) setPeople(new Map(ps.filter((p): p is UserProfile => !!p).map((p) => [p.id, p])))
    })
    return () => { live = false }
  }, [otherIds])

  // Keep who-can-see-what in line with the friend list.
  const friendKey = friendIds.join(',')
  useEffect(() => {
    if (!uid || !friendshipsLoaded || !myCheckinsLoaded) return
    syncVisibility(uid, friendIds, myCheckins).catch((e) => console.error('[visibility]', e.message))
  }, [uid, friendKey, friendshipsLoaded, myCheckinsLoaded, myCheckins])

  const wines = useMemo(() => {
    const m = new Map<string, Wine>(SEED_WINES.map((w) => [w.id, w]))
    // A catalogue wine copied to Firestore keeps its bundled bottle photo after any user photos.
    for (const w of dbWines) {
      const seed = m.get(w.id)
      m.set(w.id, seed?.photos.length ? { ...w, photos: [...new Set([...w.photos, ...seed.photos])] } : w)
    }
    return [...m.values()].sort((a, b) => `${a.producer} ${a.name}`.localeCompare(`${b.producer} ${b.name}`))
  }, [dbWines])
  const wineMap = useMemo(() => new Map(wines.map((w) => [w.id, w])), [wines])

  const producers = useMemo(() => {
    const m = new Map<string, Producer>(SEED_PRODUCERS.map((p) => [p.id, p]))
    for (const w of wines) {
      const id = producerIdOf(w)
      const known = m.get(id)
      if (!known) m.set(id, { id, name: w.producer, country: w.country, region: w.region, source: 'catalog' })
      else if (!known.country && w.country) m.set(id, { ...known, country: w.country, region: known.region || w.region })
    }
    for (const p of dbProducers) m.set(p.id, { ...m.get(p.id), ...p })
    return [...m.values()].filter((p) => p.id).sort((a, b) => a.name.localeCompare(b.name))
  }, [wines, dbProducers])
  const producerMap = useMemo(() => new Map(producers.map((p) => [p.id, p])), [producers])

  const stores = useMemo(() => [...SEED_STORES, ...dbStores], [dbStores])
  const storeMap = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores])

  // Only show people I am actually friends with, whatever their check-ins claim.
  const feed = useMemo(() => {
    const ok = new Set([uid, ...friendIds])
    return rawFeed.filter((c) => ok.has(c.uid))
  }, [rawFeed, friendKey, uid])

  const value: AppState = {
    user, authReady, profile, friendships, friendIds, people, wines, wineMap, stores, storeMap, producers, producerMap,
    myCheckins, myCheckinsLoaded, feed, cellar, wishlist,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
