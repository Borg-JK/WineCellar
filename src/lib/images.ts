import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

/** Formats every browser can show, so an original can be uploaded as-is when re-encoding fails. */
const VIEWABLE = /^image\/(jpeg|png|webp|gif)$/

/** Downscale to at most `max` px on the long side and re-encode as JPEG, so phone photos stay small. */
export async function compress(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality))
    if (blob) return blob
  } catch {
    // This browser cannot decode the file (e.g. HEIC outside Safari).
  }
  // Uploading the original only helps if other people's browsers can show it and it fits the 5 MB storage rule.
  if (!VIEWABLE.test(file.type)) throw new Error('This photo format cannot be used here. Pick a JPEG or PNG photo instead.')
  if (file.size >= 5 * 1024 * 1024) throw new Error('This photo is too large (over 5 MB). Pick a smaller one.')
  return file
}

export async function uploadImage(path: string, file: File, max = 1600) {
  const blob = await compress(file, max)
  const r = ref(storage, path)
  await uploadBytes(r, blob, { contentType: blob.type || 'image/jpeg' })
  return getDownloadURL(r)
}

export async function deleteImage(url: string) {
  try {
    await deleteObject(ref(storage, url))
  } catch {
    /* already gone or not ours */
  }
}
