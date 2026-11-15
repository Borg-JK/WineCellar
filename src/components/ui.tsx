import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Wine as WineIcon, X, Loader2, Minus, Plus } from 'lucide-react'
import type { WineType } from '../lib/types'
import { cx, fmtScore, fromTen, isUsablePhoto, toTen, TYPE_COLOUR } from '../lib/util'

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.4 }
  return src ? (
    <img src={src} alt="" style={style} className="shrink-0 rounded-full object-cover" />
  ) : (
    <div style={style} className="flex shrink-0 items-center justify-center rounded-full bg-wine-100 font-display font-semibold text-wine-700">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

/** A rating shown as a score out of 10, e.g. "8.25/10". Takes the stored 0–5 value. */
export function Score({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <span aria-label={`${fmtScore(value)} out of 10`}
      className={cx('inline-flex items-baseline rounded-md bg-wine-700 font-semibold tabular-nums text-cream', size === 'sm' ? 'px-1 text-[11px]' : 'px-1.5 py-px text-sm')}>
      {fmtScore(value)}<span className="ml-px text-[0.75em] font-medium opacity-70">/10</span>
    </span>
  )
}

const STEP = 0.25

/** Slide to a score from 0 to 10 in steps of 0.25; − and + fine-tune it. 0 means no score. Reports the stored 0–5 value. */
export function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const current = toTen(value)
  const setTen = (n: number) => onChange(fromTen(Math.min(10, Math.max(0, Math.round(n / STEP) * STEP))))
  const stepBtn = 'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-sand bg-white text-ink/60 disabled:opacity-30'
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-display text-3xl font-semibold tabular-nums text-wine-700" aria-live="polite">
          {value ? <>{fmtScore(value)}<span className="text-base text-ink/45">/10</span></> : <span className="text-base font-normal text-ink/45">Slide to score</span>}
        </p>
        {value > 0 && <button type="button" className="text-sm font-semibold text-ink/50" onClick={() => onChange(0)}>Clear</button>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="0.25 lower" className={stepBtn} disabled={current <= 0} onClick={() => setTen(current - STEP)}><Minus size={18} /></button>
        <div className="min-w-0 flex-1">
          <input type="range" min={0} max={10} step={STEP} value={current} aria-label="Score out of 10"
            aria-valuetext={value ? `${fmtScore(value)} out of 10` : 'No score'}
            onChange={(e) => setTen(Number(e.target.value))}
            className="score-range" style={{ '--fill': `${current * 10}%` } as CSSProperties} />
          <div className="mt-1 flex justify-between px-[3px] text-[11px] tabular-nums text-ink/40" aria-hidden>
            {[0, 2, 4, 6, 8, 10].map((n) => <span key={n}>{n}</span>)}
          </div>
        </div>
        <button type="button" aria-label="0.25 higher" className={stepBtn} disabled={current >= 10} onClick={() => setTen(current + STEP)}><Plus size={18} /></button>
      </div>
    </div>
  )
}

export function BottleImage({ src, type, className }: { src?: string; type: WineType; className?: string }) {
  return isUsablePhoto(src) ? (
    <img src={src} alt="" loading="lazy" className={cx('object-cover', className)} />
  ) : (
    <div className={cx('flex items-center justify-center', className)} style={{ background: `${TYPE_COLOUR[type]}22` }}>
      <WineIcon style={{ color: TYPE_COLOUR[type] }} className="h-1/2 w-1/2 opacity-70" strokeWidth={1.5} />
    </div>
  )
}

export function TypeDot({ type }: { type: WineType }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: TYPE_COLOUR[type] }} />
}

export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cx('animate-spin', className)} size={18} />

export function FullSpinner() {
  return <div className="flex h-full min-h-[50vh] items-center justify-center text-wine-400"><Loader2 className="animate-spin" size={28} /></div>
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wine-50 text-wine-500">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-1.5 max-w-xs text-sm text-ink/60">{children}</div>
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-wine-900/50" onClick={onClose} />
      <div className="fade-in relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="btn btn-ghost !p-2"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-3" onClick={onClose}>
      <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
      <button aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white"><X size={22} /></button>
    </div>
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-800">{children}</p>
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  )
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="flex rounded-full bg-sand p-1" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} onClick={() => onChange(o.id)}
          className={cx('flex-1 cursor-pointer rounded-full px-3 py-2 text-sm font-semibold transition', value === o.id ? 'bg-white text-wine-800 shadow-sm' : 'text-ink/55')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
