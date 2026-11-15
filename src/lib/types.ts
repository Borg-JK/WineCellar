export const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'champagne', 'orange', 'dessert', 'fortified'] as const
export type WineType = (typeof WINE_TYPES)[number]

export interface Wine {
  id: string
  name: string
  producer: string
  /** Slug of the producer's name; also the id of its `producers` doc. Older wines derive it from `producer`. */
  producerId?: string
  type: WineType
  grapes: string[]
  country: string
  region: string
  abv?: number | null
  organic?: boolean
  /** Bottle photos: used to recognise the wine. */
  photos: string[]
  storeIds: string[]
  ratingSum: number
  ratingCount: number
  createdBy: string
  source: 'catalog' | 'user'
}

export interface WineSnap {
  id: string
  name: string
  producer: string
  type: WineType
  country: string
  photo: string
}

export interface Producer {
  id: string
  name: string
  country: string
  region: string
  createdBy?: string
  source: 'catalog' | 'user'
}

export interface Store {
  id: string
  name: string
  kind: 'supermarket' | 'chain' | 'specialist' | 'online' | 'other'
  address?: string
  area?: string
  website?: string
  note?: string
  createdBy?: string
}

export interface UserProfile {
  id: string
  displayName: string
  username: string
  photoURL: string
  bio: string
}

export interface Friendship {
  id: string
  users: string[]
  requestedBy: string
  status: 'pending' | 'accepted'
}

/** A whole bottle (or your share of one), or one or more glasses at a bar or restaurant. */
export type Serving = 'bottle' | 'glass'

export interface Checkin {
  id: string
  uid: string
  userName: string
  userPhoto: string
  wineId: string
  wine: WineSnap
  rating: number
  vintage: number | null
  storeId: string
  storeName: string
  /** Per bottle, or per glass when `serving` is 'glass'. */
  price: number | null
  serving: Serving
  /** Number of glasses; only set when `serving` is 'glass'. */
  glasses: number | null
  notes: string
  tags: string[]
  occasion: string
  pairing: string
  location: string
  withUids: string[]
  withNames: string[]
  buyAgain: boolean
  private: boolean
  /** Photos of the moment (people, table, view), as opposed to bottle photos. */
  momentPhotos: string[]
  bottlePhotos: string[]
  drankAt: string
  createdAt: number
  /** Set when the owner changed the check-in after posting it. */
  editedAt?: number
  visibleTo: string[]
  cheers: string[]
  commentCount: number
}

export type CheckinInput = Pick<
  Checkin,
  | 'rating' | 'vintage' | 'storeId' | 'storeName' | 'price' | 'serving' | 'glasses' | 'notes' | 'tags' | 'occasion'
  | 'pairing' | 'location' | 'withUids' | 'withNames' | 'buyAgain' | 'private' | 'drankAt'
>

export interface Comment {
  id: string
  uid: string
  userName: string
  userPhoto: string
  text: string
  createdAt: number
}

export interface CellarItem {
  id: string
  wineId: string
  wine: WineSnap
  vintage: number | null
  quantity: number
  storeName: string
  price: number | null
  purchasedAt: string
  drinkFrom: number | null
  drinkBy: number | null
  location: string
  notes: string
  createdAt: number
}

export type CellarInput = Omit<CellarItem, 'id' | 'wineId' | 'wine' | 'createdAt'>

export interface WishlistItem {
  id: string
  wine: WineSnap
  createdAt: number
}

export const FLAVOUR_TAGS = [
  'fruity', 'dry', 'sweet', 'crisp', 'full-bodied', 'light', 'oaky', 'tannic', 'spicy', 'earthy',
  'floral', 'mineral', 'buttery', 'smooth', 'acidic', 'jammy', 'herbal', 'smoky', 'citrus', 'berries',
]

export const OCCASIONS = ['Dinner at home', 'Restaurant', 'Borrel', 'Party', 'Date night', 'Tasting', 'Picnic', 'Holiday', 'Just because']
