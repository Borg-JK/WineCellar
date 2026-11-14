import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createWine, updateWine } from '../lib/db'
import { errMsg, slug } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { PhotoPicker } from '../components/PhotoPicker'
import { draftFrom, draftToWine, WineFields } from '../components/WineFields'
import { ErrorNote, Spinner } from '../components/ui'

/** Add a wine by hand, or edit one you added (route /wines/:id/edit). ?producer=<id> and ?name= prefill it. */
export function WineForm() {
  const me = useMe()
  const nav = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const { wineMap, producerMap } = useApp()
  const existing = id ? wineMap.get(id) : undefined
  const pre = producerMap.get(params.get('producer') ?? '')
  const [f, setF] = useState(() => draftFrom(existing, existing ? {} : {
    name: params.get('name') ?? '',
    ...(pre ? { producer: pre.name, country: pre.country, region: pre.region } : {}),
  }))
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const data = await draftToWine(f, me.id, producerMap.has(slug(f.producer)))
      if (existing) {
        await updateWine(existing.id, data)
        nav(`/wines/${existing.id}`, { replace: true })
      } else {
        const wine = await createWine(me.id, data, photos)
        const next = params.get('next')
        nav(next === 'log' ? `/log/${wine.id}` : next === 'cellar' ? `/wines/${wine.id}?cellar=add` : `/wines/${wine.id}`, { replace: true })
      }
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold">{existing ? 'Edit wine' : 'Add a wine'}</h1>
      <WineFields value={f} onChange={setF} />
      {!existing && (
        <div>
          <span className="label">Bottle photos</span>
          <p className="mb-2 text-xs text-ink/55">Front label first, so others recognise the bottle.</p>
          <PhotoPicker files={photos} onChange={setPhotos} max={4} />
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>
      <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}{existing ? 'Save changes' : 'Add wine'}</button>
    </form>
  )
}
