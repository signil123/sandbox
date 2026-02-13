// File: server/routes/pushRoutes.js
import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import { getPublicKey, subscribe, unsubscribe } from '../controllers/push.js'

const router = express.Router()

router.get('/public-key', getPublicKey)

router.use(verifyToken)
router.post('/subscribe', subscribe)
router.post('/unsubscribe', unsubscribe)

export default router
