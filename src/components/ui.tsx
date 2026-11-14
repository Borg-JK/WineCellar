import { useEffect, type ReactNode } from 'react'
import { Star, Wine as WineIcon, X, Loader2 } from 'lucide-react'
import type { WineType } from '../lib/types'
import { cx, TYPE_COLOUR } from '../lib/util'

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

/** Read-only stars, supports halves. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-sand" fill="currentColor" strokeWidth={0} />
            <span className="absolute overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-gold" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** Tap the left or right half of a star for half points. */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="relative h-11 w-11">
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="relative h-9 w-9">
                <Star size={36} className="absolute text-sand" fill="currentColor" strokeWidth={0} />
                <span className="absolute overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, value - (i - 1))) * 100}%` }}>
                  <Star size={36} className="text-gold" fill="currentColor" strokeWidth={0} />
                </span>
              </span>
            </span>
            <button type="button" aria-label={`${i - 0.5} stars`} className="absolute inset-y-0 left-0 w-1/2 cursor-pointer" onClick={() => onChange(value === i - 0.5 ? 0 : i - 0.5)} />
            <button type="button" aria-label={`${i} stars`} className="absolute inset-y-0 right-0 w-1/2 cursor-pointer" onClick={() => onChange(value === i ? 0 : i)} />
          </span>
        ))}
      </div>
      <span className="font-display text-2xl font-semibold tabular-nums text-wine-700">{value ? value.toFixed(1) : '–'}</span>
    </div>
  )
}

export function BottleImage({ src, type, className }: { src?: string; type: WineType; className?: string }) {
  return src ? (
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
