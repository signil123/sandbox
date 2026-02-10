import express from 'express'
import multer from 'multer'
import { uploadFile } from '../controllers/uploadController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Multer Config
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false)
  }
}

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
})

// Routes
router.post('/', verifyToken, upload.single('file'), uploadFile)

export default router
