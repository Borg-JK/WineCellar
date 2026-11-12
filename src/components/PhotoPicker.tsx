import { useEffect, useMemo, useRef } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'

/** Pick photos from the camera or the library. Keeps the chosen files in the parent's state. */
export function PhotoPicker({ files, onChange, max = 6 }: { files: File[]; onChange: (f: File[]) => void; max?: number }) {
  const cam = useRef<HTMLInputElement>(null)
  const lib = useRef<HTMLInputElement>(null)
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])

  const add = (list: FileList | null) => {
    if (list) onChange([...files, ...Array.from(list)].slice(0, max))
    if (cam.current) cam.current.value = ''
    if (lib.current) lib.current.value = ''
  }
  const full = files.length >= max

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
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => add(e.target.files)} />
      <input ref={lib} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
    </div>
  )
}
