// File: server/routes/advisor.js
// File: server/routes/advisor.js
import express from 'express'
import {
    addAdvisorInterest,
    getAdvisorInterests,
    getAdvisorNILPreferences,
    getAdvisorProfile,
    getAdvisorRoster,
    getVerificationStatus,
    removeAdvisorInterest,
    updateAdvisorInfo,
    updateAdvisorNILPreferences,
    updateAdvisorProfessional,
} from '../controllers/advisor.js'
import {
    checkOwnershipOrAdmin,
    verifyToken,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// All advisor routes require authentication
router.use(verifyToken)

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get advisor profile (complete bundle)
router.get('/profile/:advisorId', getAdvisorProfile)

// Update advisor personal information
router.put(
  '/profile/:advisorId/info',
  checkOwnershipOrAdmin('advisorId'),
  updateAdvisorInfo
)

// Update advisor professional information
router.put(
  '/profile/:advisorId/professional',
  checkOwnershipOrAdmin('advisorId'),
  updateAdvisorProfessional
)

// ═══════════════════════════════════════════════════════════════════════════
// INTERESTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get advisor interests
router.get('/interests/:advisorId', getAdvisorInterests)

// Add interest
router.post(
  '/interests/:advisorId',
  checkOwnershipOrAdmin('advisorId'),
  addAdvisorInterest
)

// Remove interest
router.delete(
  '/interests/:advisorId/:interestId',
  checkOwnershipOrAdmin('advisorId'),
  removeAdvisorInterest
)

// ═══════════════════════════════════════════════════════════════════════════
// NIL PREFERENCES ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get NIL preferences
router.get('/nil-preferences/:advisorId', getAdvisorNILPreferences)

// Update NIL preferences
router.put(
  '/nil-preferences/:advisorId',
  checkOwnershipOrAdmin('advisorId'),
  updateAdvisorNILPreferences
)

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get verification status
router.get('/verification/:advisorId', getVerificationStatus)

// Get advisor roster (connected athletes)
router.get(
  '/roster/:advisorId',
  checkOwnershipOrAdmin('advisorId'),
  getAdvisorRoster
)

export default router
