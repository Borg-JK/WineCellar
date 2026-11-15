import { useState, type FormEvent, type ReactNode } from 'react'
import type { CellarInput, CellarItem } from '../lib/types'
import { sameCellarEntry } from '../lib/db'
import { errMsg, lastPurchase, today } from '../lib/util'
import { useApp } from '../state/AppContext'
import { ErrorNote, Field, Spinner } from './ui'

const num = (s: string) => (s.trim() === '' || isNaN(Number(s.replace(',', '.'))) ? null : Number(s.replace(',', '.')))

/**
 * Bottle details for the cellar. `children` render at the top of the same form (used to add a new wine in one go).
 * For a new entry, `wineId` fills in year, store and price from your last purchase of that wine and
 * says when the bottles will join an entry you already have.
 */
export function CellarForm({ initial, onSubmit, submitLabel, children, wineId }: { initial?: CellarItem; onSubmit: (v: CellarInput) => Promise<void>; submitLabel: string; children?: ReactNode; wineId?: string }) {
  const { stores, cellar, myCheckins } = useApp()
  const last = !initial && wineId ? lastPurchase(wineId, cellar, myCheckins) : null
  const base = initial ?? last
  const [f, setF] = useState({
    quantity: String(initial?.quantity ?? 1),
    vintage: base?.vintage ? String(base.vintage) : '',
    storeName: base?.storeName ?? '',
    price: base?.price != null ? String(base.price).replace('.', ',') : '',
    purchasedAt: initial?.purchasedAt ?? today(),
    drinkFrom: initial?.drinkFrom ? String(initial.drinkFrom) : '',
    drinkBy: initial?.drinkBy ? String(initial.drinkBy) : '',
    location: initial?.location ?? '',
    notes: initial?.notes ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const year = num(f.vintage)
    if (year != null && (year < 1900 || year > new Date().getFullYear() + 1)) return setError('That year looks off. Use four digits, e.g. 2019.')
    setBusy(true); setError('')
    try {
      await onSubmit({
        quantity: Math.max(1, Math.round(num(f.quantity) ?? 1)),
        vintage: num(f.vintage), storeName: f.storeName.trim(), price: num(f.price), purchasedAt: f.purchasedAt,
        drinkFrom: num(f.drinkFrom), drinkBy: num(f.drinkBy), location: f.location.trim(), notes: f.notes.trim(),
      })
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {children}
      {children && <h3 className="pt-2 text-lg font-semibold">Your bottles</h3>}
      {last && <p className="text-xs text-ink/55">Year, store and price filled in from your last bottle of this wine.</p>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bottles"><input className="input" type="number" min={1} inputMode="numeric" value={f.quantity} onChange={set('quantity')} required /></Field>
        <Field label="Year (vintage)"><input className="input" inputMode="numeric" pattern="[0-9]*" maxLength={4} placeholder="e.g. 2019" value={f.vintage} onChange={set('vintage')} /></Field>
        <Field label="Bought at">
          <input className="input" list="store-names" placeholder="Store" value={f.storeName} onChange={set('storeName')} />
          <datalist id="store-names">{stores.map((s) => <option key={s.id} value={s.name} />)}</datalist>
        </Field>
        <Field label="Price per bottle (€)"><input className="input" inputMode="decimal" placeholder="0,00" value={f.price} onChange={set('price')} /></Field>
        <Field label="Drink from (year)"><input className="input" type="number" inputMode="numeric" value={f.drinkFrom} onChange={set('drinkFrom')} /></Field>
        <Field label="Drink by (year)"><input className="input" type="number" inputMode="numeric" value={f.drinkBy} onChange={set('drinkBy')} /></Field>
      </div>
      <Field label="Bought on"><input className="input" type="date" value={f.purchasedAt} onChange={set('purchasedAt')} /></Field>
      <Field label="Where is it stored?"><input className="input" placeholder="Wine rack, top shelf, fridge…" value={f.location} onChange={set('location')} /></Field>
      <Field label="Notes"><input className="input" placeholder="Saving it for…" value={f.notes} onChange={set('notes')} /></Field>
      {!initial && wineId && (() => {
        const match = sameCellarEntry(cellar, wineId, num(f.vintage))
        return match && <p className="rounded-xl bg-wine-50 px-3.5 py-2.5 text-sm text-wine-800">You already have {match.quantity} of {match.vintage ?? 'this wine'} at home. These bottles will be added to them.</p>
      })()}
      <ErrorNote>{error}</ErrorNote>
      <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}{submitLabel}</button>
    </form>
  )
}
