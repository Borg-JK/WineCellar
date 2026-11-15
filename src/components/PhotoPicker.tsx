import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Check, Download, ImagePlus, X } from 'lucide-react'

/**
 * Photos taken with the in-app camera. A browser never puts these in the phone's photo library
 * by itself (library picks are already there), so these are the ones offered for saving.
 */
const fromCamera = new WeakSet<File>()
const savedToPhone = new WeakSet<File>()

/**
 * Hand photos to the phone. On phones the share sheet opens with "Save Image" (iPhone) or
 * "Save to Photos / Gallery" (Android); elsewhere the files are downloaded.
 * Returns false when the person closed the share sheet without picking anything.
 */
async function saveToPhone(files: File[]) {
  const named = files.map((f, i) =>
    f.name && f.name !== 'image.jpg' ? f : new File([f], `wine-${Date.now()}-${i + 1}.jpg`, { type: f.type || 'image/jpeg' }))
  if (navigator.canShare?.({ files: named })) {
    try {
      await navigator.share({ files: named })
      return true
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false
      // Share failed for another reason: fall through to a download.
    }
  }
  for (const f of named) {
    const url = URL.createObjectURL(f)
    const a = Object.assign(document.createElement('a'), { href: url, download: f.name })
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
  return true
}

/** Pick photos from the camera or the library. Keeps the chosen files in the parent's state. */
export function PhotoPicker({ files, onChange, max = 6 }: { files: File[]; onChange: (f: File[]) => void; max?: number }) {
  const cam = useRef<HTMLInputElement>(null)
  const lib = useRef<HTMLInputElement>(null)
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  const [, rerender] = useState(0)

  const add = (list: FileList | null, camera: boolean) => {
    if (list) {
      const picked = Array.from(list)
      if (camera) picked.forEach((f) => fromCamera.add(f))
      onChange([...files, ...picked].slice(0, max))
    }
    if (cam.current) cam.current.value = ''
    if (lib.current) lib.current.value = ''
  }
  const full = files.length >= max
  const unsaved = files.filter((f) => fromCamera.has(f) && !savedToPhone.has(f))
  const anySaved = files.some((f) => savedToPhone.has(f))

  const save = async () => {
    if (await saveToPhone(unsaved)) {
      unsaved.forEach((f) => savedToPhone.add(f))
      rerender((n) => n + 1)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={u} className="relative h-20 w-20">
            <img src={u} alt="" className="h-full w-full rounded-xl object-cover" />
            <button type="button" aria-label="Remove photo" onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-1 text-white shadow"><X size={12} /></button>
          </div>
        ))}
        {!full && (
          <>
            <button type="button" onClick={() => cam.current?.click()} className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-wine-300 bg-wine-50 text-xs font-medium text-wine-700">
              <Camera size={20} /> Camera
            </button>
            <button type="button" onClick={() => lib.current?.click()} className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-sand bg-white text-xs font-medium text-ink/60">
              <ImagePlus size={20} /> Library
            </button>
          </>
        )}
      </div>
      {unsaved.length > 0 ? (
        <button type="button" onClick={save} className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-wine-700">
          <Download size={15} /> Save {unsaved.length > 1 ? `${unsaved.length} photos` : 'photo'} to your phone
        </button>
      ) : anySaved && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink/55"><Check size={15} /> Saved to your phone</p>
      )}
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => add(e.target.files, true)} />
      <input ref={lib} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files, false)} />
    </div>
  )
}
