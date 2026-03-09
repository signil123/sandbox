import { createError } from '../error.js'
import { Interest, NILPreference } from '../models/Content.js'
import Profile from '../models/Profile.js'
import { Connection } from '../models/Relationship.js'
import User from '../models/User.js'
import { canBeVisibleToAthletes, getUserEntitlements, isAdvisorOrAgent } from '../utils/entitlements.js'

const MATCH_WEIGHTS = {
  serviceFit: 0.38,
  sportFit: 0.22,
  interestFit: 0.15,
  nilFit: 0.15,
  trustFit: 0.1,
}

const TOKEN_ALIASES = new Map([
  ['brand partnerships', 'brand partnerships'],
  ['brand partnerships and marketing', 'brand partnerships'],
  ['brand matching', 'brand partnerships'],
  ['branding', 'brand partnerships'],
  ['brand building', 'brand building'],
  ['content', 'content creation'],
  ['content strategy', 'content creation'],
  ['content creation', 'content creation'],
  ['social media', 'social media strategy'],
  ['social media growth', 'social media strategy'],
  ['social media strategy', 'social media strategy'],
  ['marketing', 'brand partnerships'],
  ['endorsements', 'endorsements'],
  ['sponsorship', 'sponsorships'],
  ['sponsorships', 'sponsorships'],
  ['event appearances', 'event appearances'],
  ['media training', 'media training'],
  ['speaking engagements', 'speaking engagements'],
  ['financial planning', 'financial planning'],
  ['tax planning', 'taxes'],
  ['tax help', 'taxes'],
  ['taxes', 'taxes'],
  ['legal', 'legal compliance'],
  ['legal advice', 'legal compliance'],
  ['legal compliance', 'legal compliance'],
  ['contract negotiation', 'contract negotiation'],
  ['contract review', 'contract review'],
  ['merchandising', 'merchandising'],
  ['charitable work', 'charitable work'],
])

const DEFAULT_BREAKDOWN = {
  overallMatch: 0,
  breakdown: {
    serviceFit: 0,
    sportFit: 0,
    interestFit: 0,
    nilFit: 0,
    trustFit: 0,
  },
}

const FREE_ATHLETE_PREVIEW_LIMIT = 3

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeToken = (value = '') => {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  return TOKEN_ALIASES.get(normalized) || normalized
}

const uniqueNormalized = (values = []) =>
  Array.from(
    new Set(
      values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => normalizeToken(value))
        .filter(Boolean)
    )
  )

const tokenizeFreeText = (value = '') =>
  normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 3)

const setFrom = (values = []) => new Set(uniqueNormalized(values))

const setOverlapScore = (left, right) => {
  if (!left.size || !right.size) {
    return { score: 0, hasSignal: false }
  }

  let overlap = 0
  for (const value of left) {
    if (right.has(value)) {
      overlap++
      continue
    }

    const partialMatch = Array.from(right).some(
      (candidate) => candidate.includes(value) || value.includes(candidate)
    )
    if (partialMatch) {
      overlap += 0.7
    }
  }

  const denominator = Math.max(left.size, right.size, 1)
  return {
    score: Math.min(1, overlap / denominator),
    hasSignal: true,
  }
}

const parseExperienceYears = (value = '') => {
  const normalized = normalizeText(value)
  if (!normalized) return null

  if (normalized.includes('10+')) return 10

  const matches = normalized.match(/\d+/g)
  if (!matches?.length) return null

  const numeric = matches.map(Number)
  return Math.max(...numeric)
}

const DEAL_SIZE_ORDER = [
  '50k-100k',
  '100k-250k',
  '250k-500k',
  '500k-1m',
  '1m-5m',
  '5m+',
]

const getDealBandIndex = (value) => {
  const normalized = normalizeToken(value)
  return DEAL_SIZE_ORDER.findIndex((band) => band === normalized)
}

const normalizeDealRange = (profile, nil) => {
  if (typeof nil?.minValue === 'number' || typeof nil?.maxValue === 'number') {
    return {
      min: typeof nil?.minValue === 'number' ? nil.minValue : 0,
      max:
        typeof nil?.maxValue === 'number'
          ? nil.maxValue
          : Number.MAX_SAFE_INTEGER,
      hasSignal: true,
    }
  }

  const bandIndex = getDealBandIndex(profile?.nilPreferences?.dealSize)
  if (bandIndex >= 0) {
    return {
      min: bandIndex,
      max: bandIndex,
      hasSignal: true,
      ordinal: true,
    }
  }

  return { min: 0, max: 0, hasSignal: false }
}

const calculateRangeCompatibility = (leftProfile, leftNil, rightProfile, rightNil) => {
  const left = normalizeDealRange(leftProfile, leftNil)
  const right = normalizeDealRange(rightProfile, rightNil)

  if (!left.hasSignal || !right.hasSignal) {
    return { score: 0, hasSignal: false }
  }

  if (left.ordinal || right.ordinal) {
    const distance = Math.abs(left.min - right.min)
    return {
      score: Math.max(0, 1 - distance / Math.max(DEAL_SIZE_ORDER.length - 1, 1)),
      hasSignal: true,
    }
  }

  const overlap = Math.min(left.max, right.max) - Math.max(left.min, right.min)
  const span = Math.max(left.max, right.max) - Math.min(left.min, right.min)

  return {
    score: overlap > 0 && span > 0 ? overlap / span : 0,
    hasSignal: true,
  }
}

const extractInterestTokens = (interestDocs = [], profile = {}) => {
  const docCategories = (interestDocs || []).flatMap((entry) => [
    entry.category,
    ...(entry.subcategories || []),
  ])

  const profileInterestFlags = Object.entries(profile.interests || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) =>
      key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (char) => char.toUpperCase())
        .trim()
    )

  return setFrom([...docCategories, ...profileInterestFlags])
}

const extractNilTokens = (profile = {}, nil = {}) =>
  setFrom([
    ...(profile.nilPreferences?.focusAreas || []),
    ...(nil.categories || []),
    ...(nil.preferredBrand || []),
  ])

const extractSportsTokens = (user = {}, profile = {}) =>
  setFrom([
    user.sport,
    profile.sport,
    profile.position,
    ...(profile.specialization || []).filter((value) =>
      /(football|basketball|baseball|soccer|tennis|track|volleyball|golf|swimming|hockey|wrestling|softball|lacrosse)/i.test(
        value
      )
    ),
  ])

const extractServiceNeedTokens = (user = {}, profile = {}, nil = {}, interests = []) =>
  setFrom([
    ...(user.nilNeeds || []),
    ...(user.specialties || []),
    ...(profile.specialties || []),
    ...(profile.specialization || []),
    ...(profile.nilPreferences?.focusAreas || []),
    ...(nil.categories || []),
    ...Array.from(extractInterestTokens(interests, profile)),
    profile.title,
  ])

const calculateTrustScore = (profile = {}, user = {}) => {
  const signals = []

  if (typeof profile.verified === 'boolean' || typeof user.isVerified === 'boolean') {
    signals.push(profile.verified || user.isVerified ? 1 : 0.35)
  }

  const averageRating = Number(profile.ratings?.averageRating || profile.rating || 0)
  if (averageRating > 0) {
    signals.push(Math.min(1, averageRating / 5))
  }

  const totalReviews = Number(profile.ratings?.totalReviews || 0)
  if (totalReviews > 0) {
    signals.push(Math.min(1, totalReviews / 20))
  }

  if (!signals.length) {
    return { score: 0, hasSignal: false }
  }

  return {
    score: signals.reduce((sum, value) => sum + value, 0) / signals.length,
    hasSignal: true,
  }
}

const buildUserBundle = async (userId) => {
  const [user, profile, interests, nil] = await Promise.all([
    User.findById(userId),
    Profile.findOne({ user: userId }),
    Interest.find({ user: userId }),
    NILPreference.findOne({ user: userId }),
  ])

  return { user, profile, interests, nil }
}

const calculateRoleAwareBreakdown = (leftBundle, rightBundle) => {
  const { user: user1, profile: profile1, interests: interests1, nil: nil1 } = leftBundle
  const { user: user2, profile: profile2, interests: interests2, nil: nil2 } = rightBundle

  if (!user1 || !user2 || !profile1 || !profile2) {
    return DEFAULT_BREAKDOWN
  }

  const allowedTargets = User.getTargetTypes(user1.userType)
  if (!allowedTargets.includes(user2.userType)) {
    return DEFAULT_BREAKDOWN
  }

  const athleteBundle = user1.userType === 'athlete' ? leftBundle : rightBundle
  const advisorBundle = user1.userType === 'athlete' ? rightBundle : leftBundle

  const athleteInterestTokens = extractInterestTokens(
    athleteBundle.interests,
    athleteBundle.profile
  )
  const advisorInterestTokens = extractInterestTokens(
    advisorBundle.interests,
    advisorBundle.profile
  )
  const athleteNilTokens = extractNilTokens(athleteBundle.profile, athleteBundle.nil)
  const advisorNilTokens = extractNilTokens(advisorBundle.profile, advisorBundle.nil)
  const athleteSports = extractSportsTokens(athleteBundle.user, athleteBundle.profile)
  const advisorSports = extractSportsTokens(advisorBundle.user, advisorBundle.profile)
  const athleteNeeds = extractServiceNeedTokens(
    athleteBundle.user,
    athleteBundle.profile,
    athleteBundle.nil,
    athleteBundle.interests
  )
  const advisorServices = extractServiceNeedTokens(
    advisorBundle.user,
    advisorBundle.profile,
    advisorBundle.nil,
    advisorBundle.interests
  )

  const serviceFit = setOverlapScore(athleteNeeds, advisorServices)
  const sportFit = setOverlapScore(athleteSports, advisorSports)
  const interestFit = setOverlapScore(athleteInterestTokens, advisorInterestTokens)

  const nilTokenFit = setOverlapScore(athleteNilTokens, advisorNilTokens)
  const nilRangeFit = calculateRangeCompatibility(
    athleteBundle.profile,
    athleteBundle.nil,
    advisorBundle.profile,
    advisorBundle.nil
  )

  const nilSignals = [nilTokenFit, nilRangeFit].filter((entry) => entry.hasSignal)
  const nilFit = nilSignals.length
    ? {
        score:
          nilSignals.reduce((sum, entry) => sum + entry.score, 0) /
          nilSignals.length,
        hasSignal: true,
      }
    : { score: 0, hasSignal: false }

  const trustFit = calculateTrustScore(advisorBundle.profile, advisorBundle.user)

  const scoredFactors = {
    serviceFit,
    sportFit,
    interestFit,
    nilFit,
    trustFit,
  }

  const activeWeights = Object.entries(scoredFactors)
    .filter(([, value]) => value.hasSignal)
    .reduce((sum, [key]) => sum + MATCH_WEIGHTS[key], 0)

  if (!activeWeights) {
    return DEFAULT_BREAKDOWN
  }

  let weightedScore = 0
  for (const [key, value] of Object.entries(scoredFactors)) {
    if (!value.hasSignal) continue
    weightedScore += (value.score * MATCH_WEIGHTS[key]) / activeWeights
  }

  return {
    overallMatch: Math.round(Math.min(100, weightedScore * 100)),
    breakdown: {
      serviceFit: Math.round((serviceFit.score || 0) * 100),
      sportFit: Math.round((sportFit.score || 0) * 100),
      interestFit: Math.round((interestFit.score || 0) * 100),
      nilFit: Math.round((nilFit.score || 0) * 100),
      trustFit: Math.round((trustFit.score || 0) * 100),
    },
  }
}

export const calculateMatchScore = async (
  userId1,
  userId2,
  currentUserData = null
) => {
  try {
    const leftBundle =
      currentUserData && currentUserData.user?._id?.toString() === userId1.toString()
        ? currentUserData
        : await buildUserBundle(userId1)

    const rightBundle = await buildUserBundle(userId2)
    return calculateRoleAwareBreakdown(leftBundle, rightBundle).overallMatch
  } catch (error) {
    console.error('Error calculating match score:', error)
    return 0
  }
}

export const calculateBatchMatches = async (
  userId,
  potentialMatches,
  currentUserData = null
) => {
  try {
    const matches = await Promise.all(
      potentialMatches.map(async (potentialUser) => {
        const score = await calculateMatchScore(
          userId,
          potentialUser._id,
          currentUserData
        )

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

export const getRecommendations = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { limit = 6 } = req.query

    const currentUserData = await buildUserBundle(userId)
    if (!currentUserData.user) {
      return next(createError(404, 'User not found'))
    }

    if (!currentUserData.profile) {
      return next(createError(404, 'Profile not found'))
    }

    const targetUserTypes = User.getTargetTypes(currentUserData.user.userType)

    const potentialMatches = await User.find({
      _id: { $ne: userId },
      userType: { $in: targetUserTypes },
      isActive: true,
      isBlocked: { $ne: true },
    }).limit(parseInt(limit, 10) * 4)

    const filteredPotentialMatches =
      currentUserData.user.userType === 'athlete'
        ? potentialMatches.filter((candidate) => canBeVisibleToAthletes(candidate))
        : potentialMatches

    let recommendations = await calculateBatchMatches(
      userId,
      filteredPotentialMatches,
      currentUserData
    )

    if (currentUserData.user.userType === 'athlete') {
      const tierWeight = { pro: 2, growth: 1, free: 0 }
      recommendations = [...recommendations].sort((a, b) => {
        const tierDelta = (tierWeight[b.user?.tier] ?? 0) - (tierWeight[a.user?.tier] ?? 0)
        if (tierDelta !== 0) return tierDelta
        return (b.matchScore || 0) - (a.matchScore || 0)
      })
    }

    const topMatches = await Promise.all(
      recommendations.slice(0, parseInt(limit, 10)).map(async (match) => {
        const [matchProfile, interests, nil, connectionStatus, totalConnections] =
          await Promise.all([
            Profile.findOne({ user: match.user._id }),
            Interest.find({ user: match.user._id }),
            NILPreference.findOne({ user: match.user._id }),
            Connection.getConnectionStatus(userId, match.user._id),
            Connection.find({
              $or: [{ user1: match.user._id }, { user2: match.user._id }],
              status: 'active',
            }).countDocuments(),
          ])

        return {
          userId: match.user._id,
          name: match.user.name,
          email: match.user.email,
          userType: match.user.userType,
          matchScore: match.matchScore,
          isBestMatch: match.matchScore >= 90,
          connectionStatus,
          totalConnections,
          profile: matchProfile,
          interests,
          nilPreferences: nil,
          ratings: matchProfile?.ratings || { averageRating: 0, totalReviews: 0 },
        }
      })
    )

    const shouldBlurAthletesForRequester =
      isAdvisorOrAgent(currentUserData.user) &&
      getUserEntitlements(currentUserData.user).shouldBlurAthleteProfiles

    let visibleAthleteCount = 0

    const enrichedMatches = topMatches.map((match) => {
      const isAthleteMatch = match.userType === 'athlete'
      const shouldKeepVisible =
        !shouldBlurAthletesForRequester ||
        !isAthleteMatch ||
        visibleAthleteCount < FREE_ATHLETE_PREVIEW_LIMIT

      if (isAthleteMatch && shouldKeepVisible) {
        visibleAthleteCount += 1
      }

      const shouldBlur = !shouldKeepVisible
      if (!shouldBlur) {
        return {
          ...match,
          isBlurred: false,
          blurReason: null,
        }
      }

      return {
        ...match,
        profile: match.profile
          ? {
              ...match.profile.toObject?.(),
              aboutMe: '',
              bio: '',
              socialMedia: {},
              socialLinks: {},
              website: null,
            }
          : match.profile,
        isBlurred: true,
        blurReason: 'upgrade_required',
      }
    })

    res.status(200).json({
      status: 'success',
      results: enrichedMatches.length,
      data: {
        recommendations: enrichedMatches,
      },
    })
  } catch (error) {
    console.error('Error in getRecommendations:', error)
    next(error)
  }
}

export const getMatchDetails = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.params

    const [leftBundle, rightBundle] = await Promise.all([
      buildUserBundle(userId),
      buildUserBundle(targetUserId),
    ])

    if (!leftBundle.user || !rightBundle.user) {
      return next(createError(404, 'User not found'))
    }

    const result = calculateRoleAwareBreakdown(leftBundle, rightBundle)

    res.status(200).json({
      status: 'success',
      data: {
        overallMatch: result.overallMatch,
        breakdown: result.breakdown,
        user1: {
          name: leftBundle.user.name,
          type: leftBundle.user.userType,
          profile: leftBundle.profile,
          interests: leftBundle.interests,
          nil: leftBundle.nil,
        },
        user2: {
          name: rightBundle.user.name,
          type: rightBundle.user.userType,
          profile: rightBundle.profile,
          interests: rightBundle.interests,
          nil: rightBundle.nil,
        },
      },
    })
  } catch (error) {
    console.error('Error in getMatchDetails:', error)
    next(error)
  }
}

export const __matchingInternals = {
  normalizeText,
  normalizeToken,
  tokenizeFreeText,
  parseExperienceYears,
  calculateRoleAwareBreakdown,
}
