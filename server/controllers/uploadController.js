import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { createError } from '../error.js'

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, 'No file uploaded'))
    }

    const { filename, path: tempPath, mimetype } = req.file
    const uploadsDir = 'uploads'

    // If it's an image, compress it
    if (mimetype.startsWith('image/')) {
      const outputFilename = `${path.parse(filename).name}.webp`
      const outputPath = path.join(uploadsDir, outputFilename)

      await sharp(tempPath)
        .webp({ quality: 80 }) // Compress to WebP with 80% quality
        .toFile(outputPath)

      // Delete the original temp file
      fs.unlinkSync(tempPath)

      // Return the URL to the optimized image
      const fileUrl = `/uploads/${outputFilename}`
      
      res.status(200).json({
        status: 'success',
        message: 'File uploaded and optimized successfully',
        url: fileUrl,
      })
    } else {
      // For non-images (e.g. PDF), keep as is but move from temp if needed logic
      // Since multer diskStorage saves directly, we just return the path
      // However, our multer config will likely save to 'uploads/' directly.
      // If we use diskStorage destination 'uploads/', the file is already there.
      
      // Note: If we want consistent URLs, let's assume multer saved it to 'uploads/'
      const fileUrl = `/uploads/${filename}`

      res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        url: fileUrl,
      })
    }
  } catch (error) {
    console.error('Error in uploadFile:', error)
    // Clean up temp file if error occurs
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error("Failed to delete temp file:", unlinkError);
        }
    }
    next(error)
  }
}
