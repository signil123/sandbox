// File: server/controllers/matching.js
// File: server/controllers/matching.js
import { createError } from '../error.js'
import { Interest, NILPreference } from '../models/Content.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'

// ═══════════════════════════════════════════════════════════════════════════
// MATCHING ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate match percentage between two users
 * Factors:
 * - Shared interests (30%)
 * - NIL focus alignment (25%)
 * - Sport/expertise match (25%)
 * - Verification status (20%)
 */
export const calculateMatchScore = async (userId1, userId2) => {
  try {
    const [
      user1,
      user2,
      profile1,
      profile2,
      interests1,
      interests2,
      nil1,
      nil2,
    ] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2),
      Profile.findOne({ user: userId1 }),
      Profile.findOne({ user: userId2 }),
      Interest.find({ user: userId1 }),
      Interest.find({ user: userId2 }),
      NILPreference.findOne({ user: userId1 }),
      NILPreference.findOne({ user: userId2 }),
    ])

    if (!profile1 || !profile2) {
      return 0
    }

    let score = 0
    const weights = {
      interests: 0.4,
      nil: 0.3,
      expertise: 0.3,
    }

    // 1. SHARED INTERESTS (30%)
    const interestScore = calculateInterestScore(interests1, interests2)
    score += interestScore * weights.interests * 100

    // 2. NIL FOCUS ALIGNMENT (25%)
    const nilScore = calculateNILScore(nil1, nil2)
    score += nilScore * weights.nil * 100

    // 3. SPORT/EXPERTISE MATCH (25%)
    const expertiseScore = calculateExpertiseScore(
      profile1,
      profile2,
      user1,
      user2
    )
    score += expertiseScore * weights.expertise * 100

    // 4. VERIFICATION STATUS (0% - Removed)

    return Math.round(Math.min(100, score))
  } catch (error) {
    console.error('Error calculating match score:', error)
    return 0
  }
}

// Calculate interest overlap (0-1)
const calculateInterestScore = (interests1, interests2) => {
  if (!interests1.length || !interests2.length) return 0

  const categories1 = new Set(interests1.map((i) => i.category.toLowerCase()))
  const categories2 = new Set(interests2.map((i) => i.category.toLowerCase()))

  let matches = 0
  for (const cat of categories1) {
    if (categories2.has(cat)) {
      matches++
    }
  }

  return matches / Math.max(categories1.size, categories2.size)
}

// Calculate NIL preference alignment (0-1)
const calculateNILScore = (nil1, nil2) => {
  if (!nil1 || !nil2) return 0.5 // Neutral if not set

  let score = 0
  let factors = 0

  // Check category overlap
  if (nil1.categories && nil2.categories) {
    const categories1 = new Set(nil1.categories)
    const categories2 = new Set(nil2.categories)
    let categoryMatches = 0
    for (const cat of categories1) {
      if (categories2.has(cat)) categoryMatches++
    }
    score +=
      categoryMatches /
      Math.max(1, Math.max(categories1.size, categories2.size))
    factors++
  }

  // Check value range compatibility
  if (nil1.minValue && nil2.maxValue && nil1.maxValue && nil2.minValue) {
    const overlap =
      Math.min(nil1.maxValue, nil2.maxValue) -
      Math.max(nil1.minValue, nil2.minValue)
    if (overlap > 0) {
      score += 0.5 // Ranges overlap
      factors++
    }
  }

  return factors > 0 ? score / factors : 0.5
}

// Calculate expertise/sport match (0-1)
const calculateExpertiseScore = (profile1, profile2, user1, user2) => {
  const athleteProfile = user1.userType === 'athlete' ? profile1 : profile2
  const advisorProfile = user1.userType === 'athlete' ? profile2 : profile1
  const athleteUser = user1.userType === 'athlete' ? user1 : user2
  const advisorUser = user1.userType === 'athlete' ? user2 : user1

  if (!advisorProfile.specialization && !advisorUser.specialties) return 0.5

  let score = 0

  // 1. Sport match (0.2)
  if (athleteProfile.sport) {
    const athleteSportLower = athleteProfile.sport.toLowerCase()
    const advisorSpecs = [
      ...(advisorProfile.specialization || []),
      ...(advisorUser.specialties || []),
    ].map((s) => s.toLowerCase())

    if (advisorSpecs.some((s) => s.includes(athleteSportLower))) {
      score += 0.2
    } else {
      score += 0.05
    }
  } else {
    score += 0.1
  }

  // 2. Expertise overlap (0.5)
  // Check overlap between athleteUser.nilNeeds and advisorUser.specialties
  if (athleteUser.nilNeeds?.length > 0 && advisorUser.specialties?.length > 0) {
    const needs = new Set(athleteUser.nilNeeds.map((n) => n.toLowerCase()))
    const specs = new Set(advisorUser.specialties.map((s) => s.toLowerCase()))
    let matches = 0
    for (const need of needs) {
      if (specs.has(need)) matches++
    }
    const overlapRatio = matches / Math.max(1, needs.size)
    score += overlapRatio * 0.5
  } else {
    score += 0.2
  }

  // 3. Experience relevance (0.3)
  const experienceStr = advisorProfile.experience || advisorUser.experience
  if (experienceStr) {
    const yearsMatch = parseInt(experienceStr) || 0
    // If it's a range like "10+ years" or "5-10 years", parseInt gets the first number
    score += Math.min(0.3, yearsMatch / 20)
  } else {
    score += 0.1
  }

  return Math.min(1, score)
}

// Calculate verification bonus (0-1)
const calculateVerificationScore = (profile1, profile2) => {
  let score = 0

  if (profile1.verified) score += 0.5
  if (profile2.verified) score += 0.5

  return Math.min(1, score)
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH MATCHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate match scores between user and array of potential matches
 */
export const calculateBatchMatches = async (userId, potentialMatches) => {
  try {
    const matches = await Promise.all(
      potentialMatches.map(async (potentialUser) => {
        const score = await calculateMatchScore(userId, potentialUser._id)
        return {
          user: potentialUser,
          matchScore: score,
        }
      })
    )

    return matches.sort((a, b) => b.matchScore - a.matchScore)
  } catch (error) {
    console.error('Error calculating batch matches:', error)
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPLORE RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get personalized recommendations for a user
 * For athletes: show advisors/agents ranked by match
 * For advisors: show athletes ranked by match
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { limit = 10 } = req.query

    // Get user and profile
    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const profile = await Profile.findOne({ user: userId })
    if (!profile) {
      return next(createError(404, 'Profile not found'))
    }

    // Determine recommendation type
    let query = {}

    if (user.userType === 'athlete') {
      // Athletes see verified advisors/agents
      query = {
        profileType: { $in: ['advisor', 'agent'] },
        verified: true,
        isPublic: true,
      }
    } else {
      // Advisors/agents see athletes
      query = {
        profileType: 'athlete',
        isPublic: true,
      }
    }

    // Get potential matches
    const potentialMatches = await User.find({
      _id: { $ne: userId },
    }).limit(parseInt(limit) * 2) // Get more to filter

    // Calculate match scores
    const recommendations = await calculateBatchMatches(
      userId,
      potentialMatches
    )

    // Fetch full profile data for top matches
    const topMatches = await Promise.all(
      recommendations.slice(0, limit).map(async (match) => {
        const matchProfile = await Profile.findOne({ user: match.user._id })
        const interests = await Interest.find({ user: match.user._id })
        const nil = await NILPreference.findOne({ user: match.user._id })

        return {
          userId: match.user._id,
          name: match.user.name,
          email: match.user.email,
          userType: match.user.userType,
          matchScore: match.matchScore,
          isBestMatch: match.matchScore >= 90,
          profile: matchProfile,
          interests,
          nilPreferences: nil,
        }
      })
    )

    res.status(200).json({
      status: 'success',
      results: topMatches.length,
      data: {
        recommendations: topMatches,
      },
    })
  } catch (error) {
    console.error('Error in getRecommendations:', error)
    next(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCH DETAILS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get detailed match breakdown between two specific users
 */
export const getMatchDetails = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.params

    const [
      user1,
      user2,
      profile1,
      profile2,
      interests1,
      interests2,
      nil1,
      nil2,
    ] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId),
      Profile.findOne({ user: userId }),
      Profile.findOne({ user: targetUserId }),
      Interest.find({ user: userId }),
      Interest.find({ user: targetUserId }),
      NILPreference.findOne({ user: userId }),
      NILPreference.findOne({ user: targetUserId }),
    ])

    if (!user1 || !user2) {
      return next(createError(404, 'User not found'))
    }

    // Calculate individual scores
    const interestScore = calculateInterestScore(interests1, interests2)
    const nilScore = calculateNILScore(nil1, nil2)
    const expertiseScore = calculateExpertiseScore(
      profile1,
      profile2,
      user1,
      user2
    )

    // Calculate overall score
    const overallScore =
      interestScore * 0.4 * 100 +
      nilScore * 0.3 * 100 +
      expertiseScore * 0.3 * 100

    res.status(200).json({
      status: 'success',
      data: {
        overallMatch: Math.round(Math.min(100, overallScore)),
        breakdown: {
          interests: Math.round(interestScore * 100),
          nil: Math.round(nilScore * 100),
          expertise: Math.round(expertiseScore * 100),
          verification: Math.round(verificationScore * 100),
        },
        user1: {
          name: user1.name,
          type: user1.userType,
          profile: profile1,
          interests: interests1,
          nil: nil1,
        },
        user2: {
          name: user2.name,
          type: user2.userType,
          profile: profile2,
          interests: interests2,
          nil: nil2,
        },
      },
    })
  } catch (error) {
    console.error('Error in getMatchDetails:', error)
    next(error)
  }
}
