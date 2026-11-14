import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, limit,
  query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
  type DocumentData, type QueryDocumentSnapshot, type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { deleteImage, uploadImage } from './images'
import type {
  CellarInput, CellarItem, Checkin, CheckinInput, Store, UserProfile, Wine, WineSnap,
} from './types'
import { slug, snapOf } from './util'

type Snap = QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>

/** Document → plain object with its id; server timestamps become milliseconds. */
export function read<T>(s: Snap): T {
  const d = s.data({ serverTimestamps: 'estimate' }) ?? {}
  const out: Record<string, unknown> = { ...d, id: s.id }
  for (const k of ['createdAt', 'acceptedAt']) {
    const v = d[k]
    if (v && typeof v.toMillis === 'function') out[k] = v.toMillis()
  }
  return out as T
}

/* ───────────── Profiles ───────────── */

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/

export async function createProfile(uid: string, displayName: string, username: string, photoURL = '') {
  const uname = username.trim().toLowerCase()
  if (!USERNAME_RE.test(uname)) throw new Error('Usernames are 3–20 characters: letters, numbers, dots and underscores.')
  const nameRef = doc(db, 'usernames', uname)
  if ((await getDoc(nameRef)).exists()) throw new Error('That username is taken.')
  const batch = writeBatch(db)
  batch.set(nameRef, { uid })
  batch.set(doc(db, 'users', uid), {
    displayName: displayName.trim(), username: uname, photoURL, bio: '', createdAt: serverTimestamp(),
  })
  await batch.commit()
}

export async function updateProfileDoc(uid: string, data: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'photoURL'>>) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function uploadAvatar(uid: string, file: File) {
  return uploadImage(`users/${uid}/avatar_${Date.now()}.jpg`, file, 512)
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const s = await getDoc(doc(db, 'users', uid))
  return s.exists() ? read<UserProfile>(s) : null
}

/** Prefix search on username, and on display name (as typed and with capitalised words). */
export async function searchUsers(text: string): Promise<UserProfile[]> {
  const raw = text.trim().replace(/^@/, '')
  if (raw.length < 2) return []
  const users = collection(db, 'users')
  const prefix = (field: string, v: string) =>
    getDocs(query(users, where(field, '>=', v), where(field, '<=', v + '\uf8ff'), limit(12)))
  const capitalised = raw.replace(/(^|\s)\S/g, (c) => c.toUpperCase())
  const names = [...new Set([raw, capitalised])]
  const snaps = await Promise.all([prefix('username', raw.toLowerCase()), ...names.map((n) => prefix('displayName', n))])
  const out = new Map<string, UserProfile>()
  for (const s of snaps) for (const d of s.docs) out.set(d.id, read<UserProfile>(d))
  return [...out.values()].slice(0, 20)
}

/* ───────────── Friends ───────────── */

export const friendshipId = (a: string, b: string) => [a, b].sort().join('_')

export async function sendFriendRequest(me: string, other: string) {
  await setDoc(doc(db, 'friendships', friendshipId(me, other)), {
    users: [me, other].sort(), requestedBy: me, status: 'pending', createdAt: serverTimestamp(),
  })
}
export const acceptFriendRequest = (id: string) =>
  updateDoc(doc(db, 'friendships', id), { status: 'accepted', acceptedAt: serverTimestamp() })
export const removeFriendship = (id: string) => deleteDoc(doc(db, 'friendships', id))

/* ───────────── Wines & stores ───────────── */

/** Catalogue wines live in the app bundle until someone uses one; then they get a Firestore doc. */
export async function ensureWine(wine: Wine, uid: string) {
  const r = doc(db, 'wines', wine.id)
  if ((await getDoc(r)).exists()) return
  const { id: _id, ...data } = wine
  await setDoc(r, { ...data, createdBy: uid, createdAt: serverTimestamp() })
}

export type NewWine = Pick<Wine, 'name' | 'producer' | 'type' | 'grapes' | 'country' | 'region' | 'abv' | 'organic' | 'storeIds'>

export async function createWine(uid: string, data: NewWine, bottleFiles: File[]): Promise<Wine> {
  const r = doc(collection(db, 'wines'))
  const photos = await uploadBottlePhotos(r.id, uid, bottleFiles)
  const wine: Wine = { ...data, id: r.id, photos, ratingSum: 0, ratingCount: 0, createdBy: uid, source: 'user' }
  const { id: _id, ...rest } = wine
  await setDoc(r, { ...rest, createdAt: serverTimestamp() })
  return wine
}

export const updateWine = (id: string, data: Partial<NewWine>) => updateDoc(doc(db, 'wines', id), data)

async function uploadBottlePhotos(wineId: string, uid: string, files: File[]) {
  const stamp = Date.now()
  return Promise.all(files.map((f, i) => uploadImage(`wines/${wineId}/${uid}_${stamp}_${i}.jpg`, f)))
}

export async function addBottlePhotos(wine: Wine, uid: string, files: File[]) {
  await ensureWine(wine, uid)
  const urls = await uploadBottlePhotos(wine.id, uid, files)
  if (urls.length) await updateDoc(doc(db, 'wines', wine.id), { photos: arrayUnion(...urls) })
  return urls
}

export async function createStore(uid: string, data: Omit<Store, 'id' | 'createdBy'>): Promise<string> {
  const r = doc(db, 'stores', `${slug(data.name)}-${Math.random().toString(36).slice(2, 6)}`)
  await setDoc(r, { ...data, createdBy: uid, createdAt: serverTimestamp() })
  return r.id
}

/* ───────────── Check-ins ───────────── */

export async function createCheckin(opts: {
  me: UserProfile
  wine: Wine
  input: CheckinInput
  friendIds: string[]
  bottleFiles: File[]
  momentFiles: File[]
  fromCellar?: CellarItem
}) {
  const { me, wine, input, friendIds, bottleFiles, momentFiles, fromCellar } = opts
  await ensureWine(wine, me.id)
  const r = doc(collection(db, 'checkins'))
  const [bottlePhotos, momentPhotos] = await Promise.all([
    uploadBottlePhotos(wine.id, me.id, bottleFiles),
    Promise.all(momentFiles.map((f, i) => uploadImage(`users/${me.id}/checkins/${r.id}/${i}.jpg`, f))),
  ])
  await setDoc(r, {
    ...input,
    uid: me.id,
    userName: me.displayName,
    userPhoto: me.photoURL,
    wineId: wine.id,
    wine: snapOf(wine, bottlePhotos[0]),
    bottlePhotos,
    momentPhotos,
    visibleTo: input.private ? [me.id] : [me.id, ...friendIds],
    cheers: [],
    commentCount: 0,
    createdAt: serverTimestamp(),
  })
  const wineUpdate: DocumentData = {}
  if (input.rating > 0) {
    wineUpdate.ratingSum = increment(input.rating)
    wineUpdate.ratingCount = increment(1)
  }
  if (bottlePhotos.length) wineUpdate.photos = arrayUnion(...bottlePhotos)
  if (input.storeId) wineUpdate.storeIds = arrayUnion(input.storeId)
  if (Object.keys(wineUpdate).length) await updateDoc(doc(db, 'wines', wine.id), wineUpdate)
  if (fromCellar) await changeCellarQuantity(me.id, fromCellar, -1)
  return r.id
}

export async function deleteCheckin(c: Checkin) {
  await deleteDoc(doc(db, 'checkins', c.id))
  if (c.rating > 0) {
    await updateDoc(doc(db, 'wines', c.wineId), { ratingSum: increment(-c.rating), ratingCount: increment(-1) }).catch(() => {})
  }
  await Promise.all(c.momentPhotos.map(deleteImage))
}

export const toggleCheers = (c: Checkin, uid: string) =>
  updateDoc(doc(db, 'checkins', c.id), { cheers: c.cheers.includes(uid) ? arrayRemove(uid) : arrayUnion(uid) })

export async function addComment(checkinId: string, me: UserProfile, text: string) {
  await addDoc(collection(db, 'checkins', checkinId, 'comments'), {
    uid: me.id, userName: me.displayName, userPhoto: me.photoURL, text: text.trim(), createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'checkins', checkinId), { commentCount: increment(1) })
}

export async function deleteComment(checkinId: string, commentId: string) {
  await deleteDoc(doc(db, 'checkins', checkinId, 'comments', commentId))
  await updateDoc(doc(db, 'checkins', checkinId), { commentCount: increment(-1) }).catch(() => {})
}

/**
 * Keep `visibleTo` on my check-ins equal to "me + my current friends", so new
 * friends see older check-ins and removed friends lose access.
 */
export async function syncVisibility(uid: string, friendIds: string[], mine: Checkin[]) {
  const want = [uid, ...friendIds].sort().join(',')
  const stale = mine.filter((c) => !c.private && [...c.visibleTo].sort().join(',') !== want).slice(0, 400)
  if (!stale.length) return
  const batch = writeBatch(db)
  for (const c of stale) batch.update(doc(db, 'checkins', c.id), { visibleTo: [uid, ...friendIds] })
  await batch.commit()
}

/* ───────────── Cellar & wishlist ───────────── */

export async function addToCellar(uid: string, wine: Wine, input: CellarInput) {
  await ensureWine(wine, uid)
  await addDoc(collection(db, 'users', uid, 'cellar'), {
    ...input, wineId: wine.id, wine: snapOf(wine), createdAt: serverTimestamp(),
  })
}

export const updateCellarItem = (uid: string, id: string, input: Partial<CellarInput>) =>
  updateDoc(doc(db, 'users', uid, 'cellar', id), input)

export const removeCellarItem = (uid: string, id: string) => deleteDoc(doc(db, 'users', uid, 'cellar', id))

export async function changeCellarQuantity(uid: string, item: CellarItem, delta: number) {
  if (item.quantity + delta <= 0) return removeCellarItem(uid, item.id)
  return updateDoc(doc(db, 'users', uid, 'cellar', item.id), { quantity: increment(delta) })
}

export async function toggleWishlist(uid: string, wine: Wine, on: boolean) {
  const r = doc(db, 'users', uid, 'wishlist', wine.id)
  if (!on) return deleteDoc(r)
  await ensureWine(wine, uid)
  const snap: WineSnap = snapOf(wine)
  await setDoc(r, { wine: snap, createdAt: serverTimestamp() })
}

export const removeFromWishlist = (uid: string, wineId: string) => deleteDoc(doc(db, 'users', uid, 'wishlist', wineId))
