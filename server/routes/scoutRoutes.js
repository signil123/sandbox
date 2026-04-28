import express from 'express'
import multer from 'multer'
import { chatWithScout } from '../controllers/scoutController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

router.use(verifyToken)
router.post('/chat', upload.single('file'), chatWithScout)

export default router
