import { useState, type FormEvent, type ReactNode } from 'react'
import type { CellarInput, CellarItem } from '../lib/types'
import { errMsg, today } from '../lib/util'
import { useApp } from '../state/AppContext'
import { ErrorNote, Field, Spinner } from './ui'

const num = (s: string) => (s.trim() === '' || isNaN(Number(s.replace(',', '.'))) ? null : Number(s.replace(',', '.')))

/** Bottle details for the cellar. `children` render at the top of the same form (used to add a new wine in one go). */
export function CellarForm({ initial, onSubmit, submitLabel, children }: { initial?: CellarItem; onSubmit: (v: CellarInput) => Promise<void>; submitLabel: string; children?: ReactNode }) {
  const { stores } = useApp()
  const [f, setF] = useState({
    quantity: String(initial?.quantity ?? 1),
    vintage: initial?.vintage ? String(initial.vintage) : '',
    storeName: initial?.storeName ?? '',
    price: initial?.price != null ? String(initial.price) : '',
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
      <ErrorNote>{error}</ErrorNote>
      <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}{submitLabel}</button>
    </form>
  )
}
