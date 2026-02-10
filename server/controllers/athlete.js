// File: server/controllers/athlete.js
import { createError } from '../error.js'
import { Interest, NILPreference } from '../models/Content.js'
import { Event, Invitation } from '../models/Event.js'
import Profile from '../models/Profile.js'
import { Connection } from '../models/Relationship.js'
import User from '../models/User.js'
import { deleteCloudinaryAsset } from '../utils/cloudinaryCleanup.js'

// ═══════════════════════════════════════════════════════════════════════════
// ATHLETE PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET - Complete athlete profile bundle
export const getAthleteProfile = async (req, res, next) => {
  try {
    const { athleteId } = req.params

    // Verify user exists and is an athlete
    const user = await User.findById(athleteId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (user.userType !== 'athlete') {
      return next(createError(400, 'User is not an athlete'))
    }

    // Get athlete profile
    const profile = await Profile.findOne({ user: athleteId })
    if (!profile) {
      return next(createError(404, 'Athlete profile not found'))
    }

    // Get profile bundle
    const profileBundle = await profile.getAthleteProfileBundle()

    res.status(200).json({
      status: 'success',
      data: {
        athlete: profileBundle,
      },
    })
  } catch (error) {
    console.error('Error in getAthleteProfile:', error)
    next(error)
  }
}

// GET - Profile completion percentage
export const getProfileCompletion = async (req, res, next) => {
  try {
    const { athleteId } = req.params

    const profile = await Profile.findOne({ user: athleteId })
    if (!profile) {
      return next(createError(404, 'Athlete profile not found'))
    }

    // Calculate fresh completion
    const completionPercentage = profile.calculateCompletion()

    res.status(200).json({
      status: 'success',
      data: {
        completion: completionPercentage,
        completionDetails: {
          profileImage: !!profile.profileImage,
          sport: !!profile.sport,
          school: !!profile.school,
          position: !!profile.position,
          classYear: !!profile.classYear,
          aboutMe: !!profile.aboutMe,
          phone: !!profile.phone,
          socialLinks:
            Object.values(profile.socialLinks || {}).filter(Boolean).length > 0,
        },
      },
    })
  } catch (error) {
    console.error('Error in getProfileCompletion:', error)
    next(error)
  }
}

// PUT - Update personal information
export const updatePersonalInfo = async (req, res, next) => {
  try {
    const { athleteId } = req.params
    const { name, phone, profileImage, bannerImage, aboutMe, socialLinks } =
      req.body

    // Ownership check done by checkOwnershipOrAdmin middleware ✓

    // Get athlete profile
    let profile = await Profile.findOne({ user: athleteId })
    if (!profile) {
      return next(createError(404, 'Athlete profile not found'))
    }

    // Validate phone if provided
    if (phone && !/^[\d+\-\s()]+$/.test(phone)) {
      return next(createError(400, 'Invalid phone number format'))
    }

    // Update user name if provided
    if (name) {
      await User.findByIdAndUpdate(
        athleteId,
        { name: name.trim() },
        { new: true, runValidators: true }
      )
    }

    // Update profile fields
    if (phone) profile.phone = phone
    if (profileImage) {
      if (profile.profileImage && profileImage !== profile.profileImage) {
        await deleteCloudinaryAsset(profile.profileImage)
      }
      profile.profileImage = profileImage
    }
    if (bannerImage) {
      if (profile.bannerImage && bannerImage !== profile.bannerImage) {
        await deleteCloudinaryAsset(profile.bannerImage)
      }
      profile.bannerImage = bannerImage
    }
    if (aboutMe) profile.aboutMe = aboutMe.trim()
    if (socialLinks) {
      profile.socialLinks = {
        ...profile.socialLinks,
        ...socialLinks,
      }
    }

    // Calculate completion
    profile.calculateCompletion()
    await profile.save()

    // Return updated profile bundle
    const profileBundle = await profile.getAthleteProfileBundle()

    res.status(200).json({
      status: 'success',
      data: {
        athlete: profileBundle,
      },
    })
  } catch (error) {
    console.error('Error in updatePersonalInfo:', error)
    next(error)
  }
}

// PUT - Update sports information
export const updateSportsInfo = async (req, res, next) => {
  try {
    const { athleteId } = req.params
    const { sport, school, position, classYear, jerseyNumber, height, weight } =
      req.body

    // Ownership check done by checkOwnershipOrAdmin middleware ✓

    // Validate classYear
    if (
      classYear &&
      !['freshman', 'sophomore', 'junior', 'senior'].includes(classYear)
    ) {
      return next(
        createError(
          400,
          'Invalid class year. Must be freshman, sophomore, junior, or senior'
        )
      )
    }

    // Get athlete profile
    let profile = await Profile.findOne({ user: athleteId })
    if (!profile) {
      return next(createError(404, 'Athlete profile not found'))
    }

    // Update sports fields
    if (sport) profile.sport = sport
    if (school) profile.school = school
    if (position) profile.position = position
    if (classYear) profile.classYear = classYear
    if (jerseyNumber) profile.jerseyNumber = jerseyNumber
    if (height) profile.height = height
    if (weight) profile.weight = weight

    // Calculate completion
    profile.calculateCompletion()
    await profile.save()

    // Return updated profile bundle
    const profileBundle = await profile.getAthleteProfileBundle()

    res.status(200).json({
      status: 'success',
      data: {
        athlete: profileBundle,
      },
    })
  } catch (error) {
    console.error('Error in updateSportsInfo:', error)
    next(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERESTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET - Get all interests
export const getAthleteInterests = async (req, res, next) => {
  try {
    const { athleteId } = req.params

    const interests = await Interest.find({ user: athleteId })

    res.status(200).json({
      status: 'success',
      results: interests.length,
      data: {
        interests,
      },
    })
  } catch (error) {
    console.error('Error in getAthleteInterests:', error)
    next(error)
  }
}

// POST - Add interest
export const addInterest = async (req, res, next) => {
  try {
    const { athleteId } = req.params
    const { category, subcategories, level } = req.body

    // Ownership check done by checkOwnershipOrAdmin middleware ✓

    // Validate input
    if (!category) {
      return next(createError(400, 'Category is required'))
    }

    // Check for duplicate interest
    const existingInterest = await Interest.findOne({
      user: athleteId,
      category,
    })

    if (existingInterest) {
      return next(createError(400, `You already have interest in ${category}`))
    }

    // Create new interest
    const newInterest = await Interest.create({
      user: athleteId,
      category,
      subcategories: subcategories || [],
      level: level || 'intermediate',
    })

    res.status(201).json({
      status: 'success',
      data: {
        interest: newInterest,
      },
    })
  } catch (error) {
    console.error('Error in addInterest:', error)
    next(error)
  }
}

// DELETE - Remove interest
export const removeInterest = async (req, res, next) => {
  try {
    const { athleteId, interestId } = req.params

    // Ownership check done by checkOwnershipOrAdmin middleware ✓

    // Verify interest belongs to athlete
    const interest = await Interest.findById(interestId)
    if (!interest || interest.user.toString() !== athleteId) {
      return next(createError(404, 'Interest not found'))
    }

    // Delete interest
    await Interest.findByIdAndDelete(interestId)

    res.status(200).json({
      status: 'success',
      message: 'Interest removed successfully',
    })
  } catch (error) {
    console.error('Error in removeInterest:', error)
    next(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NIL PREFERENCES ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET - Get NIL preferences
export const getNILPreferences = async (req, res, next) => {
  try {
    const { athleteId } = req.params

    const nilPref = await NILPreference.findOne({ user: athleteId })

    if (!nilPref) {
      return next(createError(404, 'NIL preferences not found'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        nilPreferences: nilPref,
      },
    })
  } catch (error) {
    console.error('Error in getNILPreferences:', error)
    next(error)
  }
}

// PUT - Update NIL preferences
export const updateNILPreferences = async (req, res, next) => {
  try {
    const { athleteId } = req.params
    const {
      categories,
      minValue,
      maxValue,
      preferredBrand,
      excludedBrand,
      allowPhotoshoot,
      allowVideo,
      allowSocial,
      allowTestimonial,
      allowExclusive,
      geo_restrictions,
      additionalNotes,
      isPublic,
    } = req.body

    // Ownership check done by checkOwnershipOrAdmin middleware ✓

    // Validate min/max values
    if (minValue && maxValue && minValue > maxValue) {
      return next(
        createError(400, 'Minimum value cannot be greater than maximum value')
      )
    }

    // Find or create NIL preferences
    let nilPref = await NILPreference.findOne({ user: athleteId })

    if (!nilPref) {
      nilPref = await NILPreference.create({
        user: athleteId,
        categories: categories || [],
        minValue: minValue || 0,
        maxValue: maxValue || 0,
        preferredBrand: preferredBrand || [],
        excludedBrand: excludedBrand || [],
        allowPhotoshoot: allowPhotoshoot || false,
        allowVideo: allowVideo || false,
        allowSocial: allowSocial || true,
        allowTestimonial: allowTestimonial || false,
        allowExclusive: allowExclusive || false,
        geo_restrictions: geo_restrictions || [],
        additionalNotes: additionalNotes || '',
        isPublic: isPublic !== undefined ? isPublic : false,
      })
    } else {
      // Update existing
      if (categories) nilPref.categories = categories
      if (minValue !== undefined) nilPref.minValue = minValue
      if (maxValue !== undefined) nilPref.maxValue = maxValue
      if (preferredBrand) nilPref.preferredBrand = preferredBrand
      if (excludedBrand) nilPref.excludedBrand = excludedBrand
      if (allowPhotoshoot !== undefined)
        nilPref.allowPhotoshoot = allowPhotoshoot
      if (allowVideo !== undefined) nilPref.allowVideo = allowVideo
      if (allowSocial !== undefined) nilPref.allowSocial = allowSocial
      if (allowTestimonial !== undefined)
        nilPref.allowTestimonial = allowTestimonial
      if (allowExclusive !== undefined) nilPref.allowExclusive = allowExclusive
      if (geo_restrictions) nilPref.geo_restrictions = geo_restrictions
      if (additionalNotes) nilPref.additionalNotes = additionalNotes
      if (isPublic !== undefined) nilPref.isPublic = isPublic

      await nilPref.save()
    }

    res.status(200).json({
      status: 'success',
      data: {
        nilPreferences: nilPref,
      },
    })
  } catch (error) {
    console.error('Error in updateNILPreferences:', error)
    next(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET - Get athlete's upcoming events
export const getAthleteUpcomingEvents = async (req, res, next) => {
  try {
    const { athleteId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Get invitations for athlete with accepted status
    const invitations = await Invitation.find({
      invitee: athleteId,
      status: 'accepted',
    })
      .populate('event')
      .skip(skip)
      .limit(limit)
      .sort({ 'event.startDate': 1 })

    // Filter for upcoming events only
    const upcomingEvents = invitations
      .filter((inv) => inv.event && inv.event.startDate > new Date())
      .map((inv) => inv.event)

    res.status(200).json({
      status: 'success',
      results: upcomingEvents.length,
      data: {
        events: upcomingEvents,
      },
    })
  } catch (error) {
    console.error('Error in getAthleteUpcomingEvents:', error)
    next(error)
  }
}

/**
 * Get connected advisors/agents for athlete
 */
export const getConnectedAdvisors = async (req, res, next) => {
  try {
    const { athleteId } = req.params
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Find connections
    const connections = await Connection.find({
      $or: [{ user1: athleteId }, { user2: athleteId }],
      status: 'active',
    })
      .populate('user1', 'name email userType')
      .populate('user2', 'name email userType')

    // Filter for advisors/agents and format
    const advisors = await Promise.all(
      connections
        .map((conn) => (conn.user1._id.toString() === athleteId ? conn.user2 : conn.user1))
        .filter((user) => ['advisor', 'agent'].includes(user.userType))
        .map(async (user) => {
          const profile = await Profile.findOne({ user: user._id }).select(
            'profileImage title location specialization experience certifications rating'
          )
          return {
            userId: user._id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            profileImage: profile?.profileImage,
            title: profile?.title,
            location: profile?.location,
            specialization: profile?.specialization,
            experience: profile?.experience,
            certifications: profile?.certifications,
            rating: profile?.rating,
          }
        })
    )

    // Pagination
    const totalResults = advisors.length
    const paginatedAdvisors = advisors.slice(skip, skip + parseInt(limit))

    res.status(200).json({
      status: 'success',
      results: paginatedAdvisors.length,
      totalResults,
      totalPages: Math.ceil(totalResults / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        advisors: paginatedAdvisors,
      },
    })
  } catch (error) {
    console.error('Error in getConnectedAdvisors:', error)
    next(error)
  }
}
