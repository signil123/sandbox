// File: server/routes/messageRoutes.js
import express from 'express'
import {
    archiveConversation,
    blockUser,
    getConversations,
    getMessages,
    sendMessage,
    startConversation,
    updateSettings
} from '../controllers/message.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// All message routes require authentication
router.use(verifyToken)

// Start or get conversation
router.post('/conversations', startConversation)

// Get all conversations for current user
router.get('/conversations', getConversations)

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', getMessages)

// Send a message
router.post('/conversations/:conversationId/messages', sendMessage)

// Update user settings (privacy, etc)
router.put('/settings', updateSettings)

// Archive/Delete conversation
router.delete('/conversations/:conversationId', archiveConversation)

// Block user
router.post('/conversations/:conversationId/block', blockUser)

export default router
