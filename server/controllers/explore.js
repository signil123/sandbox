// File: server/controllers/explore.js
import { createError } from '../error.js'
import { Interest, NILPreference } from '../models/Content.js'
import Profile from '../models/Profile.js'
import { Connection } from '../models/Relationship.js'
import User from '../models/User.js'
import {
  canBeVisibleToAthletes,
  canViewFullAthleteProfiles,
  getUserEntitlements,
  isAdvisorOrAgent,
  isPremiumFilterAllowed,
  isStandardFilterAllowed,
} from '../utils/entitlements.js'
import { __matchingInternals, calculateMatchScore } from './matching.js'

// ═══════════════════════════════════════════════════════════════════════════
// EXPLORE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Helper to get target user types based on requester type
const getTargetUserTypes = (userType) => User.getTargetTypes(userType)

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const parseExperienceFilter = (value = '') => {
  const normalized = String(value).trim()
  if (!normalized) return null

  const matches = normalized.match(/\d+/g)
  if (!matches?.length) return null

  const values = matches.map(Number)
  return {
    min: values[0],
    max: values.length > 1 ? values[1] : null,
  }
}

const parseExperienceFilters = (value = '') =>
  String(value)
    .split(',')
    .map((entry) => parseExperienceFilter(entry))
    .filter(Boolean)

const FREE_ATHLETE_PREVIEW_LIMIT = 3

/**
 * Get Explore results - athletes see advisors/agents, advisors/agents see athletes
 * Supports: search, filters, sorting, pagination
 */
export const exploreUsers = async (req, res, next) => {
  try {
    const { userId } = req.params
    const {
      search = '',
      expertise = '',
      nilFocus = '',
      athleteNeeds = '',
      areasOfExpertise = '',
      school = '',
      location = '',
      locationPreference = '',
      education = '',
      gradeLevel = '',
      interest = '',
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

    const [currentUserInterests, currentUserNil] = await Promise.all([
      Interest.find({ user: userId }),
      NILPreference.findOne({ user: userId }),
    ])

    const currentUserData = {
      user,
      profile: userProfile,
      interests: currentUserInterests,
      nil: currentUserNil,
    }
    const entitlements = getUserEntitlements(user)

    if (isAdvisorOrAgent(user)) {
      const hasStandardFilter = Boolean(expertise || sportSpecializations)
      const effectiveAthleteNeeds = athleteNeeds || areasOfExpertise || nilFocus
      const hasPremiumFilter = Boolean(
        effectiveAthleteNeeds ||
        location ||
        locationPreference ||
        education ||
        gradeLevel ||
        interest ||
        experienceRange ||
        certifications ||
        school
      )

      if (hasStandardFilter && !isStandardFilterAllowed(user, 'explore')) {
        return res.status(403).json({
          success: false,
          status: 'fail',
          code: 'UPGRADE_REQUIRED',
          message: 'Upgrade to Growth or Pro to use standard athlete filters.',
        })
      }

      if (hasPremiumFilter && !isPremiumFilterAllowed(user, 'explore')) {
        return res.status(403).json({
          success: false,
          status: 'fail',
          code: 'UPGRADE_REQUIRED',
          message: 'Upgrade to Pro to use premium athlete filters.',
        })
      }
    }

    // Build query
    let query = {
      verified: true, // Only show verified users
      isPublic: true, // Only show public profiles
    }

    // Determine which users to show
    const targetUserTypes = getTargetUserTypes(user.userType)
    
    // Find users of target types
    const matchingTypeUsers = await User.find({
      userType: { $in: targetUserTypes },
      _id: { $ne: userId },
      isActive: true,
      isBlocked: { $ne: true },
    })
    const restrictedForAthleteIds = new Set(
      user.userType === 'athlete'
        ? matchingTypeUsers
            .filter((candidate) => !canBeVisibleToAthletes(candidate))
            .map((candidate) => candidate._id.toString())
        : []
    )

    const matchingTypeUserIds = matchingTypeUsers.map((candidate) => candidate._id)
    
    query.user = { $in: matchingTypeUserIds }

    // SEARCH FILTER
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i')
      const searchMatchingUsers = await User.find({
        _id: { $in: matchingTypeUserIds },
        name: searchRegex,
      })
      const userIdsFromName = searchMatchingUsers.map((u) => u._id)
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { user: { $in: userIdsFromName } },
            { title: searchRegex },
            { aboutMe: searchRegex },
            { bio: searchRegex },
            { school: searchRegex },
            { sport: searchRegex },
            { position: searchRegex },
            { location: searchRegex },
            { specialization: { $in: [searchRegex] } },
            { specialties: { $in: [searchRegex] } },
          ],
        },
      ]
    }

    // EXPERTISE/SPECIALIZATION FILTER
    if (expertise) {
      const expertiseArray = expertise.split(',')
      const expertiseRegexArray = expertiseArray.map((e) => new RegExp(e.trim(), 'i'))
      
      // Update: Expertise can be in Profile.specialization, Profile.specialties OR User.specialties
      const userIdsWithSpecs = await User.find({
        userType: { $in: targetUserTypes },
        _id: { $ne: userId },
        specialties: { $in: expertiseRegexArray }
      }).distinct('_id')

      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { specialization: { $in: expertiseRegexArray } },
            { specialties: { $in: expertiseRegexArray } },
            { user: { $in: userIdsWithSpecs } },
          ],
        },
      ]
    }

    // NIL FOCUS FILTER
    const effectiveAthleteNeeds = athleteNeeds || areasOfExpertise || nilFocus

    if (effectiveAthleteNeeds) {
      const nilArray = effectiveAthleteNeeds.split(',')
      const nilRegexArray = nilArray.map((n) => new RegExp(n.trim(), 'i'))
      
      // Find matching NIL preferences
      const nilDocs = await NILPreference.find({
        categories: { $in: nilRegexArray },
      })
      const matchingNILUserIds = nilDocs.map((doc) => doc.user)
      
      // Intersect with matchingTypeUserIds to maintain type restriction
      const filteredUserIds = matchingNILUserIds.filter(id => 
        matchingTypeUserIds.some(targetId => targetId.toString() === id.toString())
      )

      if (query.user && query.user.$in) {
        // If we already have user IDs (e.g. from search), we should intersect or combine?
        // Usually, multiple filters are additive (AND).
        // If they searched for "Alex" and NIL focus "Marketing", they should see "Alex" who does "Marketing".
        query.user.$in = query.user.$in.filter(id => 
          filteredUserIds.some(fid => fid.toString() === id.toString())
        )
      } else {
        query.user = { $in: filteredUserIds }
      }
    }

    if (school) {
      query.school = { $regex: new RegExp(school, 'i') }
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
      const educationRegexArray = education
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => new RegExp(escapeRegex(value), 'i'))
      if (educationRegexArray.length) {
        query.education = { $in: educationRegexArray }
      }
    }

    if (gradeLevel) {
      query.classYear = { $regex: new RegExp(gradeLevel, 'i') }
    }

    if (interest) {
      const interestRegexArray = interest
        .split(',')
        .map((item) => new RegExp(item.trim(), 'i'))
      query.$and = [...(query.$and || []), { 'nilPreferences.focusAreas': { $in: interestRegexArray } }]
    }

    // EXPERIENCE RANGE FILTER
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
    const parsedPage = parseInt(page, 10)
    const parsedLimit = parseInt(limit, 10)
    const skip = (parsedPage - 1) * parsedLimit
    let baseResults = await Profile.find(query).sort({ createdAt: -1 })

    if (experienceRange) {
      const ranges = parseExperienceFilters(experienceRange)
      if (ranges.length) {
        baseResults = baseResults.filter((profile) => {
          const years = __matchingInternals.parseExperienceYears(profile.experience)
          if (years === null) return false
          return ranges.some((range) => {
            if (range.max !== null) {
              return years >= range.min && years <= range.max
            }
            return years >= range.min
          })
        })
      }
    }

    const total = baseResults.length
    const results = baseResults.slice(skip, skip + parsedLimit)

    // Get full user data and calculate match scores
    const exploreResults = await Promise.all(
      results.map(async (profile) => {
        const exploreUser = await User.findById(profile.user)
        const interests = await Interest.find({ user: profile.user })
        const nil = await NILPreference.findOne({ user: profile.user })

        // Calculate match score
        const matchScore = await calculateMatchScore(userId, profile.user, currentUserData)
        const connectionStatus = await Connection.getConnectionStatus(userId, profile.user)
        const totalConnections = await Connection.find({
          $or: [{ user1: profile.user }, { user2: profile.user }],
          status: 'active',
        }).countDocuments()

        return {
          userId: profile.user,
          name: exploreUser.name,
          userType: exploreUser.userType,
          tier: exploreUser.tier || 'free',
          profile: profile, // Return the full profile object for consistency
          matchScore,
          connectionStatus,
          totalConnections,
          interests,
          nilPreferences: nil,
          ratings: profile.ratings || { averageRating: 0, totalReviews: 0 },
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
        (a, b) => new Date(b.profile?.createdAt || 0) - new Date(a.profile?.createdAt || 0)
      )
    }

    if (user.userType === 'athlete') {
      const tierWeight = { pro: 2, growth: 1, free: 0 }
      sorted = [...sorted].sort((a, b) => {
        const tierDelta = (tierWeight[b.tier] ?? 0) - (tierWeight[a.tier] ?? 0)
        if (tierDelta !== 0) return tierDelta
        return (b.matchScore || 0) - (a.matchScore || 0)
      })
    }

    const shouldBlurAthletes =
      isAdvisorOrAgent(user) &&
      user.userType !== 'athlete' &&
      entitlements.shouldBlurAthleteProfiles &&
      !canViewFullAthleteProfiles(user)

    let enrichedResults = sorted.map((entry) => ({
      ...entry,
      isBlurred: false,
      blurReason: null,
    }))

    if (restrictedForAthleteIds.size > 0) {
      enrichedResults = enrichedResults.map((entry) => {
        if (!restrictedForAthleteIds.has(entry.userId.toString())) {
          return entry
        }

        const maskedProfile = {
          ...entry.profile?.toObject?.(),
          aboutMe: '',
          bio: '',
          socialMedia: {},
          socialLinks: {},
          website: null,
        }

        return {
          ...entry,
          profile: maskedProfile,
          isBlurred: true,
          blurReason: 'upgrade_required',
        }
      })
    }

    if (shouldBlurAthletes) {
      const athleteIndices = enrichedResults
        .map((entry, index) => (entry.userType === 'athlete' ? index : -1))
        .filter((index) => index >= 0)

      // Keep previews deterministic: show the top N athletes in sorted order.
      const visibleAthleteIndices = new Set(
        athleteIndices.slice(0, Math.min(athleteIndices.length, FREE_ATHLETE_PREVIEW_LIMIT))
      )

      enrichedResults = enrichedResults.map((entry, index) => {
        if (entry.userType !== 'athlete' || visibleAthleteIndices.has(index)) {
          return entry
        }

        const maskedProfile = {
          ...entry.profile?.toObject?.(),
          aboutMe: '',
          bio: '',
          socialMedia: {},
          socialLinks: {},
        }

        return {
          ...entry,
          profile: maskedProfile,
          isBlurred: true,
          blurReason: 'upgrade_required',
        }
      })
    }

    res.status(200).json({
      status: 'success',
      results: enrichedResults.length,
      totalResults: total,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      data: {
        users: enrichedResults,
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

    // Trending only for target user types
    const targetUserTypes = getTargetUserTypes(user.userType)
    const matchingTypeUsers = await User.find({
      userType: { $in: targetUserTypes },
      _id: { $ne: userId },
      isActive: true,
      isBlocked: { $ne: true },
    })
    const matchingTypeUserIds = matchingTypeUsers
      .filter((candidate) => {
        if (user.userType !== 'athlete') return true
        return canBeVisibleToAthletes(candidate)
      })
      .map((candidate) => candidate._id)

    let query = { 
      verified: true, 
      isPublic: true,
      user: { $in: matchingTypeUserIds }
    }

    // Trending = highest rated with recent activity
    const trendingProfiles = await Profile.find(query)
      .sort({ 'ratings.averageRating': -1, updatedAt: -1 })
      .limit(parseInt(limit))

    const trending = await Promise.all(
      trendingProfiles.map(async (profile) => {
        const trendingUser = await User.findById(profile.user)
        const matchScore = await calculateMatchScore(userId, profile.user)
        const connectionStatus = await Connection.getConnectionStatus(userId, profile.user)
        const totalConnections = await Connection.find({
          $or: [{ user1: profile.user }, { user2: profile.user }],
          status: 'active',
        }).countDocuments()

        return {
          userId: profile.user,
          name: trendingUser.name,
          profile: profile,
          matchScore,
          connectionStatus,
          totalConnections,
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

    // Featured only for target user types
    const targetUserTypes = getTargetUserTypes(user.userType)
    const matchingTypeUsers = await User.find({ 
      userType: { $in: targetUserTypes },
      _id: { $ne: userId }
    })
    const matchingTypeUserIds = matchingTypeUsers
      .filter((candidate) => {
        if (user.userType !== 'athlete') return true
        return canBeVisibleToAthletes(candidate)
      })
      .map((candidate) => candidate._id)

    let query = {
      verified: true,
      isPublic: true,
      featured: true,
      user: { $in: matchingTypeUserIds }
    }

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

    // Similar only for target user types
    const targetUserTypes = getTargetUserTypes(user.userType)
    const matchingTypeUsers = await User.find({ 
      userType: { $in: targetUserTypes },
      _id: { $ne: userId }
    })
    const matchingTypeUserIds = matchingTypeUsers
      .filter((candidate) => {
        if (user.userType !== 'athlete') return true
        return canBeVisibleToAthletes(candidate)
      })
      .map((candidate) => candidate._id)

    // Find users with similar interests
    let query = { 
      verified: true, 
      isPublic: true, 
      user: { $in: matchingTypeUserIds } 
    }

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

    const targetUserTypes = User.getTargetTypes(user.userType)

    if (user.userType === 'athlete') {
      // Show expertise areas from advisors
      const advisorProfiles = await Profile.find({
        profileType: { $in: targetUserTypes },
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
        user: { $in: await User.find({ userType: { $in: targetUserTypes } }).distinct('_id') },
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
        profileType: { $in: targetUserTypes },
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
