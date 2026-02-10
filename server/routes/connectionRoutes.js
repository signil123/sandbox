// File: server/routes/connectionRoutes.js
import express from 'express'
import {
    acceptConnectionRequest,
    cancelConnectionRequest,
    declineConnectionRequest,
    getPendingRequests,
    getRequestsSummary,
    getSentRequests,
    getPublicConnections,
    getUserConnections,
    removeConnection,
    sendConnectionRequest,
} from '../controllers/connectionRequest.js'
import {
    checkOwnershipOrAdmin,
    verifyToken,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// All connection routes require authentication
router.use(verifyToken)

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTION REQUEST ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Send connection request
// POST /api/connections/send/:userId/:targetUserId
// Body: { message: "optional 150 char message" }
router.post(
  '/send/:userId/:targetUserId',
  checkOwnershipOrAdmin('userId'),
  sendConnectionRequest
)

// Get pending requests (received)
router.get(
  '/pending/:userId',
  checkOwnershipOrAdmin('userId'),
  getPendingRequests
)

// Get sent requests
router.get('/sent/:userId', checkOwnershipOrAdmin('userId'), getSentRequests)

// Accept connection request
router.put(
  '/accept/:userId/:requestId',
  checkOwnershipOrAdmin('userId'),
  acceptConnectionRequest
)

// Decline connection request
router.put(
  '/decline/:userId/:requestId',
  checkOwnershipOrAdmin('userId'),
  declineConnectionRequest
)

// Cancel sent connection request
router.delete(
  '/cancel/:userId/:requestId',
  checkOwnershipOrAdmin('userId'),
  cancelConnectionRequest
)

// Get requests summary (counts)
router.get(
  '/summary/:userId',
  checkOwnershipOrAdmin('userId'),
  getRequestsSummary
)

// Get user's network (active connections)
router.get(
  '/network/:userId',
  checkOwnershipOrAdmin('userId'),
  getUserConnections
)

// Get public network (active connections, limited fields)
router.get('/public/:userId', getPublicConnections)

// Remove active connection (unfollow)
router.delete(
  '/remove/:userId/:connectionId',
  checkOwnershipOrAdmin('userId'),
  removeConnection
)

export default router
