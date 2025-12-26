import mongoose from 'mongoose'
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import ProfileView from '../models/ProfileView.js'
import User from '../models/User.js'

/**
 * Get or create user profile
 */
export const getOrCreateProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id

    let profile = await Profile.findOne({ user: userId }).populate(
      'user',
      '-password'
    )

    if (!profile) {
      const user = await User.findById(userId)
      if (!user) {
        return next(createError(404, 'User not found'))
      }

      profile = await Profile.create({
        user: userId,
        profileType: user.userType || 'athlete',
        isPublic: true,
      })

      profile = await profile.populate('user', '-password')
    }

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in getOrCreateProfile:', error)
    next(error)
  }
}

/**
 * Get user profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params

    const profile = await Profile.findOne({ user: userId }).populate(
      'user',
      '-password'
    )

    if (!profile) {
      return next(createError(404, 'Profile not found'))
    }

    if (!profile.isPublic && profile.user._id.toString() !== req.user.id) {
      return next(createError(403, 'This profile is private'))
    }

    // Profile View Tracking & Notification
    if (req.user && profile.user._id.toString() !== req.user.id) {
      const viewerId = req.user.id
      const ownerId = profile.user._id

      const lastView = await ProfileView.findOne({
        viewer: viewerId,
        profileOwner: ownerId,
      })

      const now = new Date()
      const dayInMs = 24 * 60 * 60 * 1000

      if (!lastView || now - lastView.lastViewedAt > dayInMs) {
        await ProfileView.findOneAndUpdate(
          { viewer: viewerId, profileOwner: ownerId },
          { lastViewedAt: now },
          { upsert: true, new: true }
        )

        // Create notification for owner
        await Notification.create({
          recipient: ownerId,
          sender: viewerId,
          type: 'profile_view',
          title: 'Someone viewed your profile',
          description: `${req.user.name} viewed your profile.`,
          relatedEntity: {
            entityType: 'user',
            entityId: viewerId,
          },
          priority: 'low',
        })
      }
    }

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    next(error)
  }
}

/**
 * Update user profile (basic info)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id
    const {
      bio,
      aboutMe,
      location,
      website,
      socialLinks,
      socialMedia,
      profileImage,
      photo,
      bannerImage,
      isPublic,
      contactVisible,
      themeColor,
      themeId,
      coverImage,
    } = req.body

    const updateData = {}

    if (bio !== undefined) updateData.bio = bio
    if (aboutMe !== undefined) updateData.aboutMe = aboutMe
    if (location !== undefined) updateData.location = location
    if (website !== undefined) updateData.website = website
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks
    if (socialMedia !== undefined) updateData.socialMedia = socialMedia
    if (profileImage !== undefined) updateData.profileImage = profileImage
    if (photo !== undefined) updateData.photo = photo
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (contactVisible !== undefined) updateData.contactVisible = contactVisible
    if (themeColor !== undefined) updateData.themeColor = themeColor
    if (themeId !== undefined) updateData.themeId = themeId
    if (coverImage !== undefined) updateData.coverImage = coverImage

    let profile = await Profile.findOne({ user: userId })

    if (!profile) {
      const user = await User.findById(userId)
      if (!user) {
        return next(createError(404, 'User not found'))
      }

      profile = await Profile.create({
        user: userId,
        profileType: user.userType || 'athlete',
        ...updateData,
      })
    } else {
      profile = await Profile.findOneAndUpdate({ user: userId }, updateData, {
        new: true,
        runValidators: true,
      })
    }

    profile = await profile.populate('user', '-password')

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in updateProfile:', error)
    next(error)
  }
}

/**
 * Update athlete-specific profile
 */
export const updateAthleteProfile = async (req, res, next) => {
  try {
    const userId = req.user._id
    const {
      sport,
      school,
      position,
      classYear,
      jerseyNumber,
      height,
      weight,
      yearsActive,
      achievements,
      stats,
      name,
      aboutMe,
      email,
      phone,
      profileImage,
      photo,
      socialMedia,
    } = req.body

    const updateData = {}

    // Athletic fields
    if (sport !== undefined) updateData.sport = sport
    if (school !== undefined) updateData.school = school
    if (position !== undefined) updateData.position = position
    if (classYear !== undefined) updateData.classYear = classYear
    if (jerseyNumber !== undefined) updateData.jerseyNumber = jerseyNumber
    if (height !== undefined) updateData.height = height
    if (weight !== undefined) updateData.weight = weight
    if (yearsActive !== undefined) updateData.yearsActive = yearsActive
    if (achievements !== undefined) updateData.achievements = achievements
    if (stats !== undefined) updateData.stats = stats

    // Profile fields
    if (name !== undefined) {
      await User.findByIdAndUpdate(userId, { name }, { new: true })
    }
    if (aboutMe !== undefined) updateData.aboutMe = aboutMe
    if (email !== undefined) {
      await User.findByIdAndUpdate(userId, { email }, { new: true })
    }
    if (phone !== undefined) {
      await User.findByIdAndUpdate(userId, { phone }, { new: true })
    }
    if (profileImage !== undefined) updateData.profileImage = profileImage
    if (photo !== undefined) updateData.photo = photo
    if (socialMedia !== undefined) updateData.socialMedia = socialMedia

    let profile = await Profile.findOne({ user: userId })

    if (!profile) {
      const user = await User.findById(userId)
      if (!user) {
        return next(createError(404, 'User not found'))
      }

      profile = await Profile.create({
        user: userId,
        profileType: 'athlete',
        ...updateData,
      })
    }

    // Security Notification for name/email change
    if (name || email) {
      let changeDesc = []
      if (email) changeDesc.push('email')
      if (name) changeDesc.push('name')

      await Notification.create({
        recipient: userId,
        type: 'security_update',
        title: 'Security Update: Personal Information Changed',
        description: `Your ${changeDesc.join(
          ' and '
        )} has been successfully updated via profile settings.`,
        priority: 'high',
      })
    }

    profile = await profile.populate('user', '-password')

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in updateAthleteProfile:', error)
    next(error)
  }
}

/**
 * Update athlete interests (toggleable)
 */
export const updateAthleteInterests = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { interests } = req.body

    if (!interests || typeof interests !== 'object') {
      return next(createError(400, 'Interests object is required'))
    }

    // Validate interest keys
    const validInterests = [
      'brandPartnerships',
      'contentCreation',
      'eventAppearances',
      'socialMediaGrowth',
      'endorsements',
      'sponsorships',
      'merchandising',
      'charitableWork',
      'speakingEngagements',
      'mediaTraining',
    ]

    const updateData = {}
    for (const [key, value] of Object.entries(interests)) {
      if (validInterests.includes(key) && typeof value === 'boolean') {
        updateData[`interests.${key}`] = value
      }
    }

    let profile = await Profile.findOne({ user: userId })

    if (!profile) {
      const user = await User.findById(userId)
      if (!user) {
        return next(createError(404, 'User not found'))
      }

      profile = await Profile.create({
        user: userId,
        profileType: 'athlete',
        interests,
      })
    } else {
      profile = await Profile.findOneAndUpdate({ user: userId }, updateData, {
        new: true,
        runValidators: true,
      })
    }

    profile = await profile.populate('user', '-password')

    res.status(200).json({
      status: 'success',
      data: {
        profile,
        activeInterests: profile.activeInterests,
      },
    })
  } catch (error) {
    console.error('Error in updateAthleteInterests:', error)
    next(error)
  }
}

/**
 * Update NIL preferences for athlete
 */
export const updateNILPreferences = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { dealSize, timeline, focusAreas } = req.body

    const updateData = {
      'nilPreferences.dealSize': dealSize || '250k-500k',
      'nilPreferences.timeline': timeline || 'medium',
      'nilPreferences.focusAreas': focusAreas || [
        'Brand Partnerships',
        'Content Creation',
      ],
    }

    let profile = await Profile.findOne({ user: userId })

    if (!profile) {
      const user = await User.findById(userId)
      if (!user) {
        return next(createError(404, 'User not found'))
      }

      profile = await Profile.create({
        user: userId,
        profileType: 'athlete',
        nilPreferences: {
          dealSize: dealSize || '250k-500k',
          timeline: timeline || 'medium',
          focusAreas: focusAreas || ['Brand Partnerships', 'Content Creation'],
        },
      })
    } else {
      profile = await Profile.findOneAndUpdate({ user: userId }, updateData, {
        new: true,
        runValidators: true,
      })
    }

    profile = await profile.populate('user', '-password')

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in updateNILPreferences:', error)
    next(error)
  }
}

/**
 * Update advisor-specific profile
 */
export const updateAdvisorProfile = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { specialization, experience, certifications, clients } = req.body

    const updateData = {}

    if (specialization !== undefined) updateData.specialization = specialization
    if (experience !== undefined) updateData.experience = experience
    if (certifications !== undefined) updateData.certifications = certifications
    if (clients !== undefined) updateData.clients = clients

    let profile = await Profile.findOne({ user: userId })

    if (!profile) {
      const user = await User.findById(userId)
      if (!user) {
        return next(createError(404, 'User not found'))
      }

      profile = await Profile.create({
        user: userId,
        profileType: 'advisor',
        ...updateData,
      })
    } else {
      profile = await Profile.findOneAndUpdate({ user: userId }, updateData, {
        new: true,
        runValidators: true,
      })
    }

    profile = await profile.populate('user', '-password')

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in updateAdvisorProfile:', error)
    next(error)
  }
}

/**
 * Get profile by username/user ID
 */
export const getProfileByUserId = async (req, res, next) => {
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
      (!req.user || profile.user._id.toString() !== req.user._id.toString())
    ) {
      return next(createError(403, 'This profile is private'))
    }

    // Profile View Tracking & Notification
    if (req.user && profile.user._id.toString() !== req.user.id) {
      const viewerId = req.user.id
      const ownerId = profile.user._id

      const lastView = await ProfileView.findOne({
        viewer: viewerId,
        profileOwner: ownerId,
      })

      const now = new Date()
      const dayInMs = 24 * 60 * 60 * 1000

      if (!lastView || now - lastView.lastViewedAt > dayInMs) {
        await ProfileView.findOneAndUpdate(
          { viewer: viewerId, profileOwner: ownerId },
          { lastViewedAt: now },
          { upsert: true, new: true }
        )

        // Create notification for owner
        await Notification.create({
          recipient: ownerId,
          sender: viewerId,
          type: 'profile_view',
          title: 'Someone viewed your profile',
          description: `${req.user.name} viewed your profile.`,
          relatedEntity: {
            entityType: 'user',
            entityId: viewerId,
          },
          priority: 'low',
        })
      }
    }

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in getProfileByUserId:', error)
    next(error)
  }
}

/**
 * Get all advisors with filtering and pagination
 */
export const getAllAdvisors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    const { specialization, sortBy } = req.query

    const filter = {
      profileType: 'advisor',
      isPublic: true,
      verified: true,
    }

    if (specialization) {
      filter.specialization = { $in: [specialization] }
    }

    const sortOptions = {}
    if (sortBy === 'rating') {
      sortOptions['ratings.averageRating'] = -1
    } else if (sortBy === 'clients') {
      sortOptions.clients = -1
    } else {
      sortOptions.createdAt = -1
    }

    const advisors = await Profile.find(filter)
      .populate('user', '-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const totalAdvisors = await Profile.countDocuments(filter)

    res.status(200).json({
      status: 'success',
      results: advisors.length,
      totalResults: totalAdvisors,
      totalPages: Math.ceil(totalAdvisors / limit),
      currentPage: page,
      data: { advisors },
    })
  } catch (error) {
    console.error('Error in getAllAdvisors:', error)
    next(error)
  }
}

/**
 * Get recommended advisors for athlete
 */
export const getRecommendedAdvisors = async (req, res, next) => {
  try {
    const userId = req.user._id
    const limit = parseInt(req.query.limit) || 10

    const recommendedAdvisors = await Profile.find({
      profileType: 'advisor',
      isPublic: true,
      verified: true,
      user: { $ne: userId },
    })
      .populate('user', '-password')
      .limit(limit)

    res.status(200).json({
      status: 'success',
      data: { advisors: recommendedAdvisors },
    })
  } catch (error) {
    console.error('Error in getRecommendedAdvisors:', error)
    next(error)
  }
}

/**
 * Delete profile
 */
export const deleteProfile = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return next(createError(403, 'You can only delete your own profile'))
    }

    const profile = await Profile.findOneAndDelete({ user: userId })

    if (!profile) {
      return next(createError(404, 'Profile not found'))
    }

    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (error) {
    console.error('Error in deleteProfile:', error)
    next(error)
  }
}

/**
 * Helper function to check if interests have any true values
 */
const hasActiveInterests = (interests) => {
  if (!interests) return false
  const interestsObj = interests.toObject ? interests.toObject() : interests
  return Object.values(interestsObj).some((v) => v === true)
}

/**
 * Helper function to check if NIL preferences are set
 */
const hasNILPreferences = (nilPreferences) => {
  if (!nilPreferences) return false
  return (
    nilPreferences.dealSize &&
    nilPreferences.timeline &&
    nilPreferences.focusAreas?.length > 0
  )
}

/**
 * Get profile completion percentage (includes interests and NIL preferences)
 */
export const getProfileCompletion = async (req, res, next) => {
  try {
    const userId = req.user._id

    const user = await User.findById(userId)
    const profile = await Profile.findOne({ user: userId })

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const completedFields = []
    const missingFields = []

    // Define all fields to check based on profile type
    const fieldChecks = {
      // User fields (common)
      name: { value: user.name, weight: 10, label: 'Name' },
      email: { value: user.email, weight: 10, label: 'Email' },
      phone: { value: user.phone, weight: 5, label: 'Phone Number' },

      // Profile fields (common)
      profileImage: {
        value: profile?.profileImage || profile?.photo,
        weight: 10,
        label: 'Profile Photo',
      },
      aboutMe: {
        value: profile?.aboutMe || profile?.bio,
        weight: 10,
        label: 'About Me',
      },
      socialMedia: {
        value:
          profile?.socialMedia &&
          Object.values(profile.socialMedia).some((v) => v),
        weight: 5,
        label: 'Social Media',
      },
    }

    // Athlete-specific fields
    if (!profile || profile.profileType === 'athlete') {
      Object.assign(fieldChecks, {
        sport: { value: profile?.sport, weight: 10, label: 'Sport' },
        school: { value: profile?.school, weight: 10, label: 'School' },
        position: { value: profile?.position, weight: 5, label: 'Position' },
        classYear: {
          value: profile?.classYear,
          weight: 5,
          label: 'Class Year',
        },
        interests: {
          value: hasActiveInterests(profile?.interests),
          weight: 10,
          label: 'Interests',
        },
        nilPreferences: {
          value: hasNILPreferences(profile?.nilPreferences),
          weight: 10,
          label: 'NIL Preferences',
        },
      })
    }

    // Advisor-specific fields
    if (profile?.profileType === 'advisor') {
      Object.assign(fieldChecks, {
        specialization: {
          value: profile?.specialization?.length > 0,
          weight: 15,
          label: 'Specialization',
        },
        experience: {
          value: profile?.experience,
          weight: 10,
          label: 'Experience',
        },
        certifications: {
          value: profile?.certifications?.length > 0,
          weight: 5,
          label: 'Certifications',
        },
      })
    }

    // Calculate completion
    let totalWeight = 0
    let earnedWeight = 0

    for (const [key, check] of Object.entries(fieldChecks)) {
      totalWeight += check.weight

      if (check.value) {
        earnedWeight += check.weight
        completedFields.push(key)
      } else {
        missingFields.push({ field: key, label: check.label })
      }
    }

    const completionPercentage = Math.round((earnedWeight / totalWeight) * 100)

    res.status(200).json({
      status: 'success',
      data: {
        completionPercentage,
        completedFields,
        missingFields,
        totalFields: Object.keys(fieldChecks).length,
      },
    })
  } catch (error) {
    console.error('Error in getProfileCompletion:', error)
    next(error)
  }
}

/**
 * Get complete athlete profile bundle (single request for frontend)
 * Includes: profile data, interests, NIL preferences, completion percentage
 */
export const getAthleteProfileBundle = async (req, res, next) => {
  try {
    const userId = req.user._id

    // Get user and profile
    const user = await User.findById(userId).select('-password')
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    let profile = await Profile.findOne({ user: userId })

    // Create profile if doesn't exist
    if (!profile) {
      profile = await Profile.create({
        user: userId,
        profileType: user.userType || 'athlete',
        isPublic: true,
      })
    }

    // Calculate completion
    const completedFields = []
    const missingFields = []

    const fieldChecks = {
      name: { value: user.name, weight: 10, label: 'Name' },
      email: { value: user.email, weight: 10, label: 'Email' },
      phone: { value: user.phone, weight: 5, label: 'Phone Number' },
      profileImage: {
        value: profile.profileImage || profile.photo,
        weight: 10,
        label: 'Profile Photo',
      },
      aboutMe: {
        value: profile.aboutMe || profile.bio,
        weight: 10,
        label: 'About Me',
      },
      socialMedia: {
        value:
          profile.socialMedia &&
          Object.values(profile.socialMedia).some((v) => v),
        weight: 5,
        label: 'Social Media',
      },
      sport: { value: profile.sport, weight: 10, label: 'Sport' },
      school: { value: profile.school, weight: 10, label: 'School' },
      position: { value: profile.position, weight: 5, label: 'Position' },
      classYear: { value: profile.classYear, weight: 5, label: 'Class Year' },
      interests: {
        value: hasActiveInterests(profile.interests),
        weight: 10,
        label: 'Interests',
      },
      nilPreferences: {
        value: hasNILPreferences(profile.nilPreferences),
        weight: 10,
        label: 'NIL Preferences',
      },
    }

    let totalWeight = 0
    let earnedWeight = 0

    for (const [key, check] of Object.entries(fieldChecks)) {
      totalWeight += check.weight
      if (check.value) {
        earnedWeight += check.weight
        completedFields.push(key)
      } else {
        missingFields.push({ field: key, label: check.label })
      }
    }

    const completionPercentage = Math.round((earnedWeight / totalWeight) * 100)

    // Build the bundle
    const bundle = {
      // Identity
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
      },

      // Profile details
      profile: {
        id: profile._id,
        profileImage: profile.profileImage,
        photo: profile.photo,
        bannerImage: profile.bannerImage,
        aboutMe: profile.aboutMe || profile.bio,
        school: profile.school,
        sport: profile.sport,
        position: profile.position,
        classYear: profile.classYear,
        jerseyNumber: profile.jerseyNumber,
        height: profile.height,
        weight: profile.weight,
        achievements: profile.achievements,
        stats: profile.stats,
        socialMedia: profile.socialMedia,
        contactVisible: profile.contactVisible,
        isPublic: profile.isPublic,
        themeColor: profile.themeColor,
        themeId: profile.themeId,
        coverImage: profile.coverImage,
      },

      // Interests (toggleable)
      interests: profile.interests || {},
      activeInterests: profile.activeInterests || [],

      // NIL Preferences
      nilPreferences: profile.nilPreferences || {
        dealSize: '250k-500k',
        timeline: 'medium',
        focusAreas: ['Brand Partnerships', 'Content Creation'],
      },

      // Profile completion
      completion: {
        percentage: completionPercentage,
        completedFields,
        missingFields,
      },
    }

    res.status(200).json({
      status: 'success',
      data: bundle,
    })
  } catch (error) {
    console.error('Error in getAthleteProfileBundle:', error)
    next(error)
  }
}
