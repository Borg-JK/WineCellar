import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createWine, updateWine } from '../lib/db'
import { errMsg, slug } from '../lib/util'
import { useApp, useMe } from '../state/AppContext'
import { PhotoPicker } from '../components/PhotoPicker'
import { draftFrom, draftToWine, WineFields } from '../components/WineFields'
import { ErrorNote, Spinner } from '../components/ui'

/**
 * Add a wine by hand, or edit one you added (route /wines/:id/edit). ?producer=<id> and ?name= prefill it.
 * ?from=<id> starts from another wine's details and saves the result as a new version; the original stays.
 */
export function WineForm() {
  const me = useMe()
  const nav = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const { wineMap, producerMap } = useApp()
  const existing = id ? wineMap.get(id) : undefined
  const pre = producerMap.get(params.get('producer') ?? '')
  const basedOn = !existing ? wineMap.get(params.get('from') ?? '') : undefined
  const [f, setF] = useState(() => draftFrom(existing ?? basedOn, existing || basedOn ? {} : {
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
      const next = params.get('next')
      const go = (wid: string) => nav(next === 'log' ? `/log/${wid}` : next === 'cellar' ? `/wines/${wid}?cellar=add` : `/wines/${wid}`, { replace: true })
      if (existing) {
        await updateWine(existing.id, data)
        go(existing.id)
      } else {
        const wine = await createWine(me.id, data, photos, basedOn?.photos)
        go(wine.id)
      }
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold">{existing ? 'Edit wine' : basedOn ? 'Edit details' : 'Add a wine'}</h1>
      {basedOn && <EditCopyNote />}
      <WineFields value={f} onChange={setF} />
      {!existing && (
        <div>
          <span className="label">Bottle photos</span>
          <p className="mb-2 text-xs text-ink/55">{basedOn ? 'Optional. The photos of the original are kept too.' : 'Front label first, so others recognise the bottle.'}</p>
          <PhotoPicker files={photos} onChange={setPhotos} max={4} />
        </div>
      )}
      <ErrorNote>{error}</ErrorNote>
      <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner />}{existing ? 'Save changes' : basedOn ? 'Save as my version' : 'Add wine'}</button>
    </form>
  )
}

/** Said wherever someone edits a wine they didn't add. */
export function EditCopyNote() {
  return (
    <p className="rounded-xl bg-wine-50 px-3.5 py-2.5 text-sm text-wine-800">
      Someone else added this wine, so your changes are saved as a new version. The original stays, and both show up in search.
    </p>
  )
}
