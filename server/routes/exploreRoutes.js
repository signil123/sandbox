// File: server/routes/exploreRoutes.js
// File: server/routes/exploreRoutes.js
import express from 'express'
import {
  exploreUsers,
  getExploreFilters,
  getFeaturedUsers,
  getSimilarUsers,
  getTrendingUsers,
} from '../controllers/explore.js'
import { getMatchDetails, getRecommendations } from '../controllers/matching.js'
import { verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// All explore routes require authentication
router.use(verifyToken)

// ═══════════════════════════════════════════════════════════════════════════
// EXPLORE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Main explore - search & filter with sorting
// GET /api/explore/:userId?search=name&expertise=legal&sortBy=bestMatch&page=1&limit=12
router.get('/users/:userId', exploreUsers)

// Get explore filter options (expertise, NIL focus, etc.)
router.get('/filters/:userId', getExploreFilters)

// Get trending users
router.get('/trending/:userId', getTrendingUsers)

// Get featured users
router.get('/featured/:userId', getFeaturedUsers)

// Get similar users based on interests
router.get('/similar/:userId', getSimilarUsers)

// ═══════════════════════════════════════════════════════════════════════════
// MATCHING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get personalized recommendations
router.get('/recommendations/:userId', getRecommendations)

// Get detailed match breakdown with specific user
router.get('/match/:userId/:targetUserId', getMatchDetails)

export default router
