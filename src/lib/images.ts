import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

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
    return blob ?? file
  } catch {
    return file // unsupported format: upload as is
  }
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
