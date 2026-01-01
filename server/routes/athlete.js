// File: server/routes/athlete.js
import express from 'express'
import {
    addInterest,
    getAthleteInterests,
    getAthleteProfile,
    getAthleteUpcomingEvents,
    getConnectedAdvisors,
    getNILPreferences,
    getProfileCompletion,
    removeInterest,
    updateNILPreferences,
    updatePersonalInfo,
    updateSportsInfo,
} from '../controllers/athlete.js'
import {
    checkOwnershipOrAdmin,
    verifyToken,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// All athlete routes require authentication
router.use(verifyToken)

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get athlete profile (complete bundle with interests, NIL prefs, events)
router.get('/profile/:athleteId', getAthleteProfile)

// Get profile completion percentage
router.get('/profile/:athleteId/completion', getProfileCompletion)

// Update athlete personal information (name, phone, about me, social links, profile image)
router.put(
  '/profile/:athleteId/info',
  checkOwnershipOrAdmin('athleteId'),
  updatePersonalInfo
)

// Update athlete sports information (sport, school, position, class year, jersey, height, weight)
router.put(
  '/profile/:athleteId/sports',
  checkOwnershipOrAdmin('athleteId'),
  updateSportsInfo
)

// ═══════════════════════════════════════════════════════════════════════════
// INTERESTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get athlete interests
router.get('/interests/:athleteId', getAthleteInterests)

// Add interest
router.post(
  '/interests/:athleteId',
  checkOwnershipOrAdmin('athleteId'),
  addInterest
)

// Remove interest
router.delete(
  '/interests/:athleteId/:interestId',
  checkOwnershipOrAdmin('athleteId'),
  removeInterest
)

// ═══════════════════════════════════════════════════════════════════════════
// NIL PREFERENCES ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get NIL preferences
router.get('/nil-preferences/:athleteId', getNILPreferences)

// Update NIL preferences
router.put(
  '/nil-preferences/:athleteId',
  checkOwnershipOrAdmin('athleteId'),
  updateNILPreferences
)

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get upcoming events for athlete
router.get('/upcoming-events/:athleteId', getAthleteUpcomingEvents)

// Get connected advisors/agents
router.get(
  '/profile/:athleteId/advisors',
  checkOwnershipOrAdmin('athleteId'),
  getConnectedAdvisors
)

export default router
