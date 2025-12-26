// File: server/controllers/explore.js
import { createError } from '../error.js'
import { Interest, NILPreference } from '../models/Content.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'
import { calculateMatchScore } from './matching.js'

// ═══════════════════════════════════════════════════════════════════════════
// EXPLORE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Explore results - athletes see advisors, advisors see athletes
 * Supports: search, filters, sorting, pagination
 */
export const exploreUsers = async (req, res, next) => {
  try {
    const { userId } = req.params
    const {
      search = '',
      expertise = '',
      nilFocus = '',
      location = '',
      locationPreference = '',
      education = '',
      experienceRange = '',
      certifications = '',
      sportSpecializations = '',
      sortBy = 'bestMatch',
      page = 1,
      limit = 12,
    } = req.query

    // Get user and verify
    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const userProfile = await Profile.findOne({ user: userId })
    if (!userProfile) {
      return next(createError(404, 'User profile not found'))
    }

    // Build query
    let query = {
      verified: true, // Only show verified users
      isPublic: true, // Only show public profiles
    }

    // Determine which users to show
    // Show all users except self
    query.user = { $ne: userId }

    // SEARCH FILTER
    if (search) {
      const searchRegex = new RegExp(search, 'i')
      const matchingUsers = await User.find({ name: searchRegex })
      const userIds = matchingUsers.map((u) => u._id)
      query.user = { $in: userIds, ...query.user }
    }

    // EXPERTISE/SPECIALIZATION FILTER
    if (expertise) {
      const expertiseArray = expertise.split(',')
      const expertiseRegexArray = expertiseArray.map((e) => new RegExp(e.trim(), 'i'))
      
      // Update: Expertise can be in Profile.specialization, Profile.specialties OR User.specialties
      const userIdsWithSpecs = await User.find({
        specialties: { $in: expertiseRegexArray }
      }).distinct('_id')

      query.$or = [
        { specialization: { $in: expertiseRegexArray } },
        { specialties: { $in: expertiseRegexArray } },
        { user: { $in: userIdsWithSpecs } }
      ]
    }

    // NIL FOCUS FILTER
    if (nilFocus) {
      const nilArray = nilFocus.split(',')
      const nilRegexArray = nilArray.map((n) => new RegExp(n.trim(), 'i'))
      const nilDocs = await NILPreference.find({
        categories: { $in: nilRegexArray },
      })
      const userIds = nilDocs.map((doc) => doc.user)
      if (query.user && query.user.$in) {
        query.user.$in = [...new Set([...query.user.$in, ...userIds])]
      } else {
        query.user = { $in: userIds, ...query.user }
      }
    }

    // LOCATION FILTER
    if (location) {
      const locationRegex = new RegExp(location, 'i')
      if (query.$or) {
        // Find existing $or and add to it or nest it?
        // Actually, let's just make a top-level $and if needed.
        query.location = { $regex: locationRegex }
      } else {
        query.location = { $regex: locationRegex }
      }
    }

    // LOCATION PREFERENCE FILTER
    if (locationPreference) {
      query.locationPreference = locationPreference
    }

    // EDUCATION FILTER
    if (education) {
      query.education = { $regex: new RegExp(education, 'i') }
    }

    // EXPERIENCE RANGE FILTER
    if (experienceRange) {
      const [min, max] = experienceRange.split('-').map(Number)
      if (max) {
        query.experience = { $gte: min, $lte: max }
      } else {
        query.experience = { $gte: min }
      }
    }

    // CERTIFICATIONS FILTER
    if (certifications) {
      const certArray = certifications.split(',').map(c => new RegExp(c.trim(), 'i'))
      query.certifications = { $in: certArray }
    }

    // SPORT SPECIALIZATIONS FILTER
    if (sportSpecializations) {
      const sportArray = sportSpecializations.split(',').map(s => new RegExp(s.trim(), 'i'))
      query.sport = { $in: sportArray }
    }

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const results = await Profile.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await Profile.countDocuments(query)

    // Get full user data and calculate match scores
    const exploreResults = await Promise.all(
      results.map(async (profile) => {
        const exploreUser = await User.findById(profile.user)
        const interests = await Interest.find({ user: profile.user })
        const nil = await NILPreference.findOne({ user: profile.user })

        // Calculate match score
        const matchScore = await calculateMatchScore(userId, profile.user)

        return {
          userId: profile.user,
          name: exploreUser.name,
          userType: exploreUser.userType,
          profile: profile, // Return the full profile object for consistency
          matchScore,
          interests,
          nilPreferences: nil,
        }
      })
    )

    // SORT
    let sorted = exploreResults
    if (sortBy === 'bestMatch') {
      sorted = sorted.sort((a, b) => b.matchScore - a.matchScore)
    } else if (sortBy === 'mostActive') {
      sorted = sorted.sort(
        (a, b) =>
          (b.ratings?.totalReviews || 0) - (a.ratings?.totalReviews || 0)
      )
    } else if (sortBy === 'highestRated') {
      sorted = sorted.sort(
        (a, b) =>
          (b.ratings?.averageRating || 0) - (a.ratings?.averageRating || 0)
      )
    } else if (sortBy === 'newest') {
      sorted = sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    }

    res.status(200).json({
      status: 'success',
      results: sorted.length,
      totalResults: total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        users: sorted,
      },
    })
  } catch (error) {
    console.error('Error in exploreUsers:', error)
    next(error)
  }
}

/**
 * Get trending users in Explore
 */
export const getTrendingUsers = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { limit = 8 } = req.query

    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    let query = { verified: true, isPublic: true }

    // Show all users except self
    query.user = { $ne: userId }

    // Trending = highest rated with recent activity
    const trendingProfiles = await Profile.find(query)
      .sort({ 'ratings.averageRating': -1, updatedAt: -1 })
      .limit(parseInt(limit))

    const trending = await Promise.all(
      trendingProfiles.map(async (profile) => {
        const trendingUser = await User.findById(profile.user)
        const matchScore = await calculateMatchScore(userId, profile.user)

        return {
          userId: profile.user,
          name: trendingUser.name,
          profile: profile,
          matchScore,
        }
      })
    )

    res.status(200).json({
      status: 'success',
      results: trending.length,
      data: {
        trending,
      },
    })
  } catch (error) {
    console.error('Error in getTrendingUsers:', error)
    next(error)
  }
}

/**
 * Get featured users in Explore (hand-picked or newly verified)
 */
export const getFeaturedUsers = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { limit = 6 } = req.query

    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    let query = {
      verified: true,
      isPublic: true,
      featured: true, // Added field in Profile schema
    }

    // Show all users except self
    query.user = { $ne: userId }

    const featuredProfiles = await Profile.find(query)
      .sort({ 'ratings.averageRating': -1 })
      .limit(parseInt(limit))

    const featured = await Promise.all(
      featuredProfiles.map(async (profile) => {
        const featuredUser = await User.findById(profile.user)
        const matchScore = await calculateMatchScore(userId, profile.user)

        return {
          userId: profile.user,
          name: featuredUser.name,
          profile: profile,
          matchScore,
        }
      })
    )

    res.status(200).json({
      status: 'success',
      results: featured.length,
      data: {
        featured,
      },
    })
  } catch (error) {
    console.error('Error in getFeaturedUsers:', error)
    next(error)
  }
}

/**
 * Get similar users based on interests/NIL
 */
export const getSimilarUsers = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { limit = 10 } = req.query

    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Get user's interests and NIL prefs
    const userInterests = await Interest.find({ user: userId })
    const userNIL = await NILPreference.findOne({ user: userId })

    // Find users with similar interests
    let query = { verified: true, isPublic: true, user: { $ne: userId } }

    // Show all users (already filtered by $ne)

    // Get candidates
    const candidates = await Profile.find(query).limit(parseInt(limit) * 3)

    // Calculate similarity scores
    const similarUsers = await Promise.all(
      candidates.map(async (profile) => {
        const candUser = await User.findById(profile.user)
        const candInterests = await Interest.find({ user: profile.user })
        const candNIL = await NILPreference.findOne({ user: profile.user })

        // Calculate interest overlap
        const userInterestCats = new Set(userInterests.map((i) => i.category))
        const candInterestCats = new Set(candInterests.map((i) => i.category))
        let overlap = 0
        for (const cat of userInterestCats) {
          if (candInterestCats.has(cat)) overlap++
        }
        const interestSimilarity =
          overlap /
          Math.max(1, Math.max(userInterestCats.size, candInterestCats.size))

        return {
          userId: profile.user,
          name: candUser.name,
          profile: profile,
          similarity: Math.round(interestSimilarity * 100),
        }
      })
    )

    const sorted = similarUsers
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    res.status(200).json({
      status: 'success',
      results: sorted.length,
      data: {
        similarUsers: sorted,
      },
    })
  } catch (error) {
    console.error('Error in getSimilarUsers:', error)
    next(error)
  }
}

/**
 * Get Explore filter options based on current user type
 */
export const getExploreFilters = async (req, res, next) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    let filters = {}

    if (user.userType === 'athlete') {
      // Show expertise areas from advisors
      const advisorProfiles = await Profile.find({
        profileType: { $in: ['advisor', 'agent'] },
        verified: true,
      })
      const expertise = new Set()
      advisorProfiles.forEach((p) => {
        if (p.specialization) {
          p.specialization.forEach((s) => expertise.add(s))
        }
      })
      filters.expertise = Array.from(expertise).sort()

      // NIL categories from advisors
      const advisorNIL = await NILPreference.find({
        categories: { $exists: true, $not: { $size: 0 } },
      })
      const nilCategories = new Set()
      advisorNIL.forEach((n) => {
        if (n.categories) n.categories.forEach((c) => nilCategories.add(c))
      })
      filters.nilFocus = Array.from(nilCategories).sort()
    } else {
      // Show sports and positions from athletes
      const athleteProfiles = await Profile.find({
        profileType: 'athlete',
        isPublic: true,
      })
      const sports = new Set()
      const positions = new Set()
      athleteProfiles.forEach((p) => {
        if (p.sport) sports.add(p.sport)
        if (p.position) positions.add(p.position)
      })
      filters.sports = Array.from(sports).sort()
      filters.positions = Array.from(positions).sort()
    }

    // Common filters
    filters.sortOptions = [
      { value: 'bestMatch', label: 'Best Match' },
      { value: 'mostActive', label: 'Most Active' },
      { value: 'highestRated', label: 'Highest Rated' },
      { value: 'newest', label: 'Newest' },
    ]

    res.status(200).json({
      status: 'success',
      data: { filters },
    })
  } catch (error) {
    console.error('Error in getExploreFilters:', error)
    next(error)
  }
}
