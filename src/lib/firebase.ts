import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** False until the VITE_FIREBASE_* variables are set; the app then shows a setup screen. */
export const configured = Boolean(cfg.apiKey && cfg.projectId)

const app: FirebaseApp | null = configured ? initializeApp(cfg) : null

export const auth = (app ? getAuth(app) : null) as Auth
export const db = (app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null) as Firestore
export const storage = (app ? getStorage(app) : null) as FirebaseStorage
