import express from 'express'
import { chatWithScout } from '../controllers/scoutController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken)
router.post('/chat', chatWithScout)

export default router
