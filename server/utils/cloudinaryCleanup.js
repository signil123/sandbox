import cloudinary from '../config/cloudinary.js'

const CLOUDINARY_HOST = 'res.cloudinary.com'
const TRANSFORM_PREFIX = /^(c|w|h|g|q|f|dpr|e|l|t|fl|ar)_/

const isCloudinaryUrl = (url) => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes(CLOUDINARY_HOST)
  } catch {
    return false
  }
}

const extractResourceType = (pathname) => {
  const parts = pathname.split('/').filter(Boolean)
  const type = parts[1]
  if (type === 'image' || type === 'raw' || type === 'video') return type
  return 'image'
}

const extractPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null
  const parsed = new URL(url)
  const parts = parsed.pathname.split('/').filter(Boolean)
  const uploadIndex = parts.findIndex((p) => p === 'upload')
  if (uploadIndex === -1) return null

  let rest = parts.slice(uploadIndex + 1)
  while (rest.length && (rest[0].includes(',') || TRANSFORM_PREFIX.test(rest[0]))) {
    rest = rest.slice(1)
  }
  if (rest[0] && /^v\\d+$/.test(rest[0])) rest = rest.slice(1)
  if (!rest.length) return null

  const withExt = rest.join('/')
  return withExt.replace(/\\.[^/.]+$/, '')
}

export const deleteCloudinaryAsset = async (url) => {
  try {
    if (!isCloudinaryUrl(url)) return
    const publicId = extractPublicId(url)
    if (!publicId) return

    const resourceType = extractResourceType(new URL(url).pathname)
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (error) {
    console.error('Failed to delete Cloudinary asset:', error?.message || error)
  }
}
