import express from 'express'
import mongoose from 'mongoose'
import {
  deleteProfile,
  getAllAdvisors,
  getAthleteProfileBundle,
  getOrCreateProfile,
  getProfileByUserId,
  getProfileCompletion,
  getRecommendedAdvisors,
  updateAdvisorProfile,
  updateAthleteInterests,
  updateAthleteProfile,
  updateNILPreferences,
  updateProfile,
} from '../controllers/profileController.js'
import { createError } from '../error.js'
import {
  checkOwnershipOrAdmin,
  restrictTo,
  verifyToken,
} from '../middleware/authMiddleware.js'
import Profile from '../models/Profile.js'

const router = express.Router()

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get public profile by user ID
router.get('/public/:userId', getProfileByUserId)

// Get all advisors with filtering
router.get('/advisors', getAllAdvisors)

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================
router.use(verifyToken)

// Get or create profile for current user
router.get('/me', (req, res, next) => {
  req.params.userId = req.user._id
  getOrCreateProfile(req, res, next)
})

// Get complete athlete profile bundle (single request)
router.get('/me/bundle', getAthleteProfileBundle)

// Get profile completion
router.get('/me/completion', getProfileCompletion)

// Get recommended advisors for athlete
router.get('/recommendations/advisors', getRecommendedAdvisors)

// Update basic profile info
router.put('/me/basic', updateProfile)

// Update athlete-specific profile
router.put('/me/athlete', updateAthleteProfile)

// Update athlete interests (toggleable)
router.put('/me/interests', updateAthleteInterests)

// Update NIL preferences (athlete)
router.put('/me/nil-preferences', updateNILPreferences)

// Update advisor-specific profile
router.put('/me/advisor', updateAdvisorProfile)

// Get profile for specific user (with privacy check)
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(createError(400, 'Invalid user ID'))
    }

    const profile = await Profile.findOne({ user: userId }).populate(
      'user',
      '-password'
    )

    if (!profile) {
      return next(createError(404, 'Profile not found'))
    }

    if (
      !profile.isPublic &&
      profile.user._id.toString() !== req.user._id.toString()
    ) {
      return next(createError(403, 'This profile is private'))
    }

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    next(error)
  }
})

// Delete profile
router.delete('/:userId', checkOwnershipOrAdmin('userId'), deleteProfile)

// ============================================
// ADMIN ROUTES
// ============================================
router.use(restrictTo('admin'))

router.get('/admin/all', getAllAdvisors)

export default router
