import express from 'express'
import {
    deleteNotification,
    getNotifications,
    markAllAsRead,
    markAsRead,
} from '../controllers/notificationController.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(verifyToken)

router.get('/', getNotifications)
router.put('/mark-all-read', markAllAsRead)
router.put('/:id/read', markAsRead)
router.delete('/:id', deleteNotification)

export default router
