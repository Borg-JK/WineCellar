import { useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup, signOut,
} from 'firebase/auth'
import { Wine as WineIcon } from 'lucide-react'
import { auth } from '../lib/firebase'
import { createProfile } from '../lib/db'
import { errMsg } from '../lib/util'
import { useApp } from '../state/AppContext'
import { ErrorNote, Field, Spinner } from '../components/ui'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-wine-800 px-5 py-10">
      <div className="mb-8 text-center text-cream">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream/10"><WineIcon size={34} strokeWidth={1.5} /></div>
        <h1 className="text-4xl font-bold tracking-tight">WineCellar</h1>
        <p className="mt-2 text-sm text-wine-200">Remember every bottle. Share it with friends.</p>
      </div>
      <div className="w-full max-w-sm rounded-3xl bg-cream p-6 shadow-2xl">{children}</div>
    </div>
  )
}

export function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError(''); setInfo('')
    try { await fn() } catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(() => mode === 'in' ? signInWithEmailAndPassword(auth, email, password) : createUserWithEmailAndPassword(auth, email, password))
  }
  const reset = () => {
    if (!email) return setError('Fill in your email first.')
    run(async () => { await sendPasswordResetEmail(auth, email); setInfo('Check your inbox for a reset link.') })
  }

  return (
    <Shell>
      <h2 className="mb-4 text-xl font-semibold">{mode === 'in' ? 'Welcome back' : 'Create your account'}</h2>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email"><input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        {info && <p className="rounded-xl bg-green-50 px-3.5 py-2.5 text-sm text-green-800">{info}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}{mode === 'in' ? 'Log in' : 'Sign up'}</button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-ink/40"><span className="h-px flex-1 bg-sand" />or<span className="h-px flex-1 bg-sand" /></div>
      <button className="btn btn-outline w-full" disabled={busy} onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}>Continue with Google</button>
      <div className="mt-5 flex justify-between text-sm">
        <button className="cursor-pointer font-semibold text-wine-700" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError('') }}>
          {mode === 'in' ? 'Create an account' : 'I already have an account'}
        </button>
        {mode === 'in' && <button className="cursor-pointer text-ink/55" onClick={reset}>Forgot password?</button>}
      </div>
    </Shell>
  )
}

/** First sign-in: pick a display name and a unique username. */
export function Onboarding() {
  const { user } = useApp()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await createProfile(user!.uid, displayName, username, user!.photoURL ?? '') } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <Shell>
      <h2 className="text-xl font-semibold">Set up your profile</h2>
      <p className="mb-4 mt-1 text-sm text-ink/60">Friends find you by your username.</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className="input" required maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></Field>
        <Field label="Username" hint="3–20 characters: letters, numbers, dots and underscores.">
          <input className="input" required autoCapitalize="none" autoCorrect="off" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} maxLength={20} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}Start pouring</button>
      </form>
      <button className="mt-4 w-full cursor-pointer text-center text-sm text-ink/50" onClick={() => signOut(auth)}>Use a different account</button>
    </Shell>
  )
}

export function SetupNeeded() {
  return (
    <Shell>
      <h2 className="text-xl font-semibold">Connect Firebase</h2>
      <p className="mt-2 text-sm text-ink/70">
        The app cannot find its Firebase settings. Copy <code>.env.example</code> to <code>.env.local</code>, fill in the six
        <code> VITE_FIREBASE_*</code> values from the Firebase console, and restart. On Vercel, add the same values under
        Settings → Environment Variables and redeploy. The README has the full steps.
      </p>
    </Shell>
  )
}
