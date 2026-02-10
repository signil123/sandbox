const CLOUDINARY_HOST = 'res.cloudinary.com'
const CLOUDINARY_UPLOAD_SEGMENT = '/upload/'
const CLOUDINARY_TRANSFORM = 'f_auto,q_auto'

export const isRemoteUrl = (path) => /^https?:\/\//i.test(path || '')

export const isCloudinaryUrl = (url) => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes(CLOUDINARY_HOST)
  } catch {
    return false
  }
}

export const getCloudinaryOptimizedUrl = (url) => {
  if (!isCloudinaryUrl(url)) return url
  if (url.includes('/raw/upload/') || url.includes('/video/upload/')) return url
  const uploadIndex = url.indexOf(CLOUDINARY_UPLOAD_SEGMENT)
  if (uploadIndex === -1) return url

  const afterUpload = url.slice(uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length)
  const firstSegment = afterUpload.split('/')[0]
  const hasTransform = /\b(f_|q_|c_|w_|h_|g_|ar_|dpr_|e_|l_|t_|fl_)\b|,/.test(firstSegment)

  if (hasTransform) return url

  return url.replace(
    CLOUDINARY_UPLOAD_SEGMENT,
    `${CLOUDINARY_UPLOAD_SEGMENT}${CLOUDINARY_TRANSFORM}/`
  )
}

export const getImageUrl = (path) => {
  if (!path) return null
  if (isRemoteUrl(path)) return getCloudinaryOptimizedUrl(path)

  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '')
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

export const getBannerStyle = ({ bannerImage, themeId, getThemeById, fallback }) => {
  if (bannerImage) {
    if (
      bannerImage.startsWith('linear-gradient') ||
      bannerImage.startsWith('radial-gradient') ||
      bannerImage.startsWith('url')
    ) {
      return { background: bannerImage }
    }

    if (bannerImage.startsWith('/') || bannerImage.includes('uploads')) {
      const url = getImageUrl(bannerImage)
      return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }

    if (isRemoteUrl(bannerImage)) {
      const url = getImageUrl(bannerImage)
      return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }

    if (getThemeById) {
      const theme = getThemeById(bannerImage)
      if (theme?.style) return theme.style
    }

    return { background: bannerImage }
  }

  if (themeId && getThemeById) {
    const theme = getThemeById(themeId)
    if (theme?.style) return theme.style
  }

  return fallback || { background: 'linear-gradient(135deg, #163146 0%, #986a41 100%)' }
}
