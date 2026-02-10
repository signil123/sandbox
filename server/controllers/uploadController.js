import { createError } from '../error.js'
import cloudinary from '../config/cloudinary.js'

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file uploaded'))
    }

    // Safety: verify Cloudinary credentials are present at runtime
    const cloudinaryCfg = cloudinary.config()
    if (!cloudinaryCfg.api_key || !cloudinaryCfg.cloud_name || !cloudinaryCfg.api_secret) {
      console.error('Cloudinary config missing at runtime:', cloudinaryCfg)
      return next(createError(500, 'Cloudinary credentials missing on server'))
    }

    const { mimetype } = req.file
    const isImage = mimetype?.startsWith('image/')

    const uploadOptions = isImage
      ? {
          resource_type: 'image',
          folder: 'signil',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          use_filename: true,
          unique_filename: true,
        }
      : {
          resource_type: 'raw',
          folder: 'signil',
          use_filename: true,
          unique_filename: true,
        }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )

      stream.end(req.file.buffer)
    })

    res.status(200).json({
      status: 'success',
      message: isImage
        ? 'File uploaded and optimized successfully'
        : 'File uploaded successfully',
      url: uploadResult.secure_url,
    })
  } catch (error) {
    console.error('Error in uploadFile:', error)
    next(error)
  }
}
