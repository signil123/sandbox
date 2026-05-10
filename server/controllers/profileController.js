import mongoose from 'mongoose'
import { createError } from '../error.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import { ProfileView } from '../models/ProfileView.js'
import { Connection, ConnectionRequest } from '../models/Relationship.js'
import User from '../models/User.js'
import { deleteCloudinaryAsset } from '../utils/cloudinaryCleanup.js'
import {
  canBeVisibleToAthletes,
  canViewAthleteSocials,
  isAdvisorOrAgent,
} from '../utils/entitlements.js'
import {
  INTERESTS_VALUE_SET,
  MIN_INTERESTS_FOR_COMPLETION,
} from '../data/interestsCatalog.js'
import {
  FOCUS_AREAS_VALUE_SET,
  MIN_FOCUS_AREAS_FOR_COMPLETION,
} from '../data/focusAreasCatalog.js'

const DEAL_SIZE_VALUES = new Set(['0-1k', '1k-5k', '5k-10k', '10k-25k', '25k-50k', '50k-100k', '100k+'])
const TIMELINE_VALUES = new Set(['short', 'medium', 'long'])

const SOCIAL_PLATFORMS = new Set([
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
  'linkedin',
  'facebook',
])

const EXPERIENCE_TYPES = new Set(['Endorsement', 'Athletic', 'Community', 'Professional', '', null, undefined])

// Coerce a string-or-null into a trimmed string, capped at maxLen.
const cleanStr = (v, maxLen = 1000) => {
  if (v === undefined || v === null) return ''
  const s = String(v).trim()
  return s.length > maxLen ? s.slice(0, maxLen) : s
}

const sanitizeExperienceEntry = (e) => {
  if (!e || typeof e !== 'object') return null
  const role = cleanStr(e.role, 120)
  const company = cleanStr(e.company, 160)
  if (!role && !company) return null
  return {
    role,
    company,
    type: EXPERIENCE_TYPES.has(e.type) ? (e.type || '') : '',
    startDate: cleanStr(e.startDate, 40),
    endDate: cleanStr(e.endDate, 40),
    location: cleanStr(e.location, 160),
    description: cleanStr(e.description, 1000),
    logoText: cleanStr(e.logoText, 4),
    logoBg: cleanStr(e.logoBg, 20) || '#163146',
  }
}

const sanitizeEducationEntry = (e) => {
  if (!e || typeof e !== 'object') return null
  const school = cleanStr(e.school, 160)
  if (!school) return null
  return {
    school,
    degree: cleanStr(e.degree, 160),
    fieldOfStudy: cleanStr(e.fieldOfStudy, 160),
    startYear: cleanStr(e.startYear, 12),
    endYear: cleanStr(e.endYear, 12),
    description: cleanStr(e.description, 1000),
    logoText: cleanStr(e.logoText, 4),
    logoBg: cleanStr(e.logoBg, 20) || '#163146',
  }
}

const sanitizeSocialEntry = (s) => {
  if (!s || typeof s !== 'object') return null
  const rawPlatform = cleanStr(s.platform, 60)
  if (!rawPlatform) return null
  // Builtin platforms are normalized to lowercase keys so the icon lookup
  // and the legacy virtuals (socialMedia/socialLinks) keep working. Custom
  // platforms preserve the user's original casing for display.
  const lower = rawPlatform.toLowerCase()
  const isBuiltin = SOCIAL_PLATFORMS.has(lower)
  const explicitCustom = s.custom === true
  return {
    platform: isBuiltin && !explicitCustom ? lower : rawPlatform,
    handle: cleanStr(s.handle, 60),
    url: cleanStr(s.url, 300),
    public: s.public === false ? false : true,
    custom: explicitCustom || !isBuiltin,
  }
}

const shouldLockAthleteSocials = (viewer, ownerProfile) => {
  if (!viewer || !ownerProfile) return false
  if (viewer._id?.toString() === ownerProfile.user?._id?.toString()) return false

  return (
    isAdvisorOrAgent(viewer) &&
    ownerProfile.profileType === 'athlete' &&
    !canViewAthleteSocials(viewer)
  )
}

const canViewerAccessProfile = (viewer, profile) => {
  if (!profile) return false
  if (!viewer) return true
  if (viewer._id?.toString() === profile.user?._id?.toString()) return true

  if (
    viewer.userType === 'athlete' &&
    isAdvisorOrAgent(profile.user) &&
    !canBeVisibleToAthletes(profile.user)
  ) {
    return false
  }

  return true
}

const maskAthleteSocials = (profile) => {
  if (!profile) return profile

  const masked = profile.toObject ? profile.toObject() : { ...profile }
  masked.socialMedia = {}
  masked.socialLinks = {}
  masked.website = null
  return masked
}

const shouldHideContactInfo = (viewer, ownerProfile) => {
  if (!ownerProfile) return false
  if (ownerProfile.contactVisible !== false) return false
  if (!viewer) return true
  return viewer._id?.toString() !== ownerProfile.user?._id?.toString()
}

const maskPrivateContactInfo = (profile) => {
  if (!profile) return profile

  const masked = profile.toObject ? profile.toObject() : { ...profile }
  if (masked.user) {
    masked.user.email = null
    masked.user.phone = null
  }
  return masked
}

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
      data: { profile, connectionStatus: req.user ? await Connection.getConnectionStatus(req.user.id, userId) : 'not_connected' },
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

    if (!canViewerAccessProfile(req.user, profile)) {
      return next(createError(403, 'This profile is not visible yet'))
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

    const totalConnections = await Connection.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    }).countDocuments()

    const socialLocked = shouldLockAthleteSocials(req.user, profile)
    let responseProfile = socialLocked ? maskAthleteSocials(profile) : (profile.toObject ? profile.toObject() : profile)

    if (shouldHideContactInfo(req.user, profile)) {
      responseProfile = maskPrivateContactInfo(responseProfile)
    }

    res.status(200).json({
      status: 'success',
      data: { 
        profile: responseProfile,
        socialLocked,
        connectionStatus: req.user ? await Connection.getConnectionStatus(req.user.id, userId) : 'not_connected',
        totalConnections 
      },
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
      socials,
      publicVisibility,
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
    if (socials !== undefined) {
      if (!Array.isArray(socials)) {
        return next(createError(400, 'socials must be an array'))
      }
      updateData.socials = socials.map(sanitizeSocialEntry).filter(Boolean)
    }
    if (publicVisibility !== undefined) {
      updateData.publicVisibility = {
        email: publicVisibility?.email !== false,
        phone: publicVisibility?.phone !== false,
      }
    }
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
      if (profileImage !== undefined && profile.profileImage && profileImage !== profile.profileImage) {
        await deleteCloudinaryAsset(profile.profileImage)
      }
      if (photo !== undefined && profile.photo && photo !== profile.photo) {
        await deleteCloudinaryAsset(profile.photo)
      }
      if (bannerImage !== undefined && profile.bannerImage && bannerImage !== profile.bannerImage) {
        await deleteCloudinaryAsset(profile.bannerImage)
      }
      if (coverImage !== undefined && profile.coverImage && coverImage !== profile.coverImage) {
        await deleteCloudinaryAsset(profile.coverImage)
      }

      profile = await Profile.findOneAndUpdate({ user: userId }, updateData, {
        new: true,
        runValidators: true,
      })
    }

    profile = await profile.populate('user', '-password')

    res.status(200).json({
      status: 'success',
      data: { profile, connectionStatus: req.user ? await Connection.getConnectionStatus(req.user.id, userId) : 'not_connected' },
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
      // Identity
      name,
      sport,
      school,
      position,
      classYear,
      location,
      locationPreference,
      // Bio
      aboutMe,
      // Contacts
      email,
      phone,
      publicVisibility,
      // Images
      profileImage,
      photo,
      bannerImage,
      // Structured arrays (new)
      experience,
      education,
      socials,
      interests,
    } = req.body

    const updateData = {}
    const userUpdate = {}

    // ---- Required-field guards: reject empty values for required identity fields
    const requireNonEmpty = (key, val) => {
      if (val === undefined) return null
      if (typeof val !== 'string' || val.trim().length === 0) {
        return `${key} cannot be empty`
      }
      return null
    }
    for (const [k, v] of [
      ['name', name],
      ['sport', sport],
      ['position', position],
      ['school', school],
      ['classYear', classYear],
    ]) {
      const err = requireNonEmpty(k, v)
      if (err) return next(createError(400, err))
    }

    // ---- Identity (Profile)
    if (sport !== undefined) updateData.sport = cleanStr(sport, 60)
    if (school !== undefined) updateData.school = cleanStr(school, 160)
    if (position !== undefined) updateData.position = cleanStr(position, 60)
    if (classYear !== undefined) updateData.classYear = cleanStr(classYear, 12)
    if (location !== undefined) updateData.location = cleanStr(location, 160)
    if (locationPreference !== undefined) {
      const allowed = new Set(['In-person', 'Remote', 'Hybrid', null, ''])
      updateData.locationPreference = allowed.has(locationPreference) ? (locationPreference || null) : null
    }

    // ---- Identity (User document)
    if (name !== undefined) userUpdate.name = cleanStr(name, 120)

    // ---- Bio
    if (aboutMe !== undefined) updateData.aboutMe = cleanStr(aboutMe, 500)

    // ---- Contacts
    if (email !== undefined) {
      const e = cleanStr(email, 200)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return next(createError(400, 'Invalid email format'))
      }
      userUpdate.email = e
    }
    if (phone !== undefined) userUpdate.phone = cleanStr(phone, 40)
    if (publicVisibility !== undefined) {
      updateData.publicVisibility = {
        email: publicVisibility?.email !== false,
        phone: publicVisibility?.phone !== false,
      }
    }

    // ---- Images
    if (profileImage !== undefined) updateData.profileImage = cleanStr(profileImage, 500)
    if (photo !== undefined) updateData.photo = cleanStr(photo, 500)
    if (bannerImage !== undefined) updateData.bannerImage = cleanStr(bannerImage, 500)

    // ---- Experience (array)
    if (experience !== undefined) {
      if (!Array.isArray(experience)) return next(createError(400, 'experience must be an array'))
      updateData.experience = experience.map(sanitizeExperienceEntry).filter(Boolean)
    }

    // ---- Education (array)
    if (education !== undefined) {
      if (!Array.isArray(education)) return next(createError(400, 'education must be an array'))
      updateData.education = education.map(sanitizeEducationEntry).filter(Boolean)
    }

    // ---- Socials (array)
    if (socials !== undefined) {
      if (!Array.isArray(socials)) return next(createError(400, 'socials must be an array'))
      updateData.socials = socials.map(sanitizeSocialEntry).filter(Boolean)
    }

    // ---- Interests (array against catalog; min 5 enforced)
    if (interests !== undefined) {
      if (!Array.isArray(interests)) return next(createError(400, 'interests must be an array'))
      const cleaned = Array.from(
        new Set(
          interests
            .map((s) => (typeof s === 'string' ? s.trim() : ''))
            .filter(Boolean)
        )
      )
      const invalid = cleaned.filter((v) => !INTERESTS_VALUE_SET.has(v))
      if (invalid.length > 0) {
        return next(createError(400, `Unknown interest values: ${invalid.join(', ')}`))
      }
      if (cleaned.length < MIN_INTERESTS_FOR_COMPLETION) {
        return next(
          createError(
            400,
            `Please select at least ${MIN_INTERESTS_FOR_COMPLETION} interests before saving.`
          )
        )
      }
      updateData.interests = cleaned
    }

    // ---- Apply User-document changes first (name/email/phone)
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdate, { new: true })
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
        ...updateData,
      })
    } else {
      if (profileImage !== undefined && profile.profileImage && profileImage !== profile.profileImage) {
        await deleteCloudinaryAsset(profile.profileImage)
      }
      if (photo !== undefined && profile.photo && photo !== profile.photo) {
        await deleteCloudinaryAsset(profile.photo)
      }
      if (bannerImage !== undefined && profile.bannerImage && bannerImage !== profile.bannerImage) {
        await deleteCloudinaryAsset(profile.bannerImage)
      }
      profile = await Profile.findOneAndUpdate({ user: userId }, updateData, {
        new: true,
        runValidators: true,
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
      data: { profile, connectionStatus: req.user ? await Connection.getConnectionStatus(req.user.id, userId) : 'not_connected' },
    })
  } catch (error) {
    console.error('Error in updateAthleteProfile:', error)
    next(error)
  }
}

/**
 * Update athlete interests.
 * Body: { interests: string[] }
 * Validates against the catalog (server/data/interestsCatalog.js) and
 * enforces a minimum of MIN_INTERESTS_FOR_COMPLETION on save.
 */
export const updateAthleteInterests = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { interests } = req.body

    if (!Array.isArray(interests)) {
      return next(createError(400, 'Interests must be an array of catalog values'))
    }

    const cleaned = Array.from(
      new Set(interests.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean))
    )

    const invalid = cleaned.filter((v) => !INTERESTS_VALUE_SET.has(v))
    if (invalid.length > 0) {
      return next(createError(400, `Unknown interest values: ${invalid.join(', ')}`))
    }
    if (cleaned.length < MIN_INTERESTS_FOR_COMPLETION) {
      return next(
        createError(
          400,
          `Please select at least ${MIN_INTERESTS_FOR_COMPLETION} interests before saving.`
        )
      )
    }

    let profile = await Profile.findOne({ user: userId })

    if (!profile) {
      const user = await User.findById(userId)
      if (!user) return next(createError(404, 'User not found'))

      profile = await Profile.create({
        user: userId,
        profileType: 'athlete',
        interests: cleaned,
      })
    } else {
      profile = await Profile.findOneAndUpdate(
        { user: userId },
        { interests: cleaned },
        { new: true, runValidators: true }
      )
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
 * GET the interests catalog (public, cacheable, no auth required).
 */
export const getInterestsCatalog = async (req, res, next) => {
  try {
    const { INTERESTS_CATALOG } = await import('../data/interestsCatalog.js')
    res.set('Cache-Control', 'public, max-age=3600')
    res.status(200).json({
      status: 'success',
      data: {
        catalog: INTERESTS_CATALOG,
        minForCompletion: MIN_INTERESTS_FOR_COMPLETION,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update NIL preferences for athlete.
 * Body: { dealSize, timeline, focusAreas: string[] }
 * - dealSize / timeline validated against the schema enums
 * - focusAreas validated against the catalog (server/data/focusAreasCatalog.js)
 *   and required to contain at least MIN_FOCUS_AREAS_FOR_COMPLETION (3) entries
 */
export const updateNILPreferences = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { dealSize, timeline, focusAreas } = req.body

    if (dealSize !== undefined && !DEAL_SIZE_VALUES.has(dealSize)) {
      return next(createError(400, `Unknown deal size: ${dealSize}`))
    }
    if (timeline !== undefined && !TIMELINE_VALUES.has(timeline)) {
      return next(createError(400, `Unknown timeline: ${timeline}`))
    }

    if (focusAreas !== undefined && !Array.isArray(focusAreas)) {
      return next(createError(400, 'focusAreas must be an array of catalog values'))
    }

    const cleanedFocus = Array.from(
      new Set(
        (focusAreas || [])
          .map((v) => {
            if (typeof v === 'string') return v.trim()
            if (v && typeof v === 'object' && typeof v.title === 'string') return v.title.trim()
            return ''
          })
          .filter(Boolean)
      )
    )

    if (focusAreas !== undefined) {
      const invalid = cleanedFocus.filter((v) => !FOCUS_AREAS_VALUE_SET.has(v))
      if (invalid.length > 0) {
        return next(createError(400, `Unknown focus area values: ${invalid.join(', ')}`))
      }
      if (cleanedFocus.length < MIN_FOCUS_AREAS_FOR_COMPLETION) {
        return next(
          createError(
            400,
            `Please select at least ${MIN_FOCUS_AREAS_FOR_COMPLETION} focus areas before saving.`
          )
        )
      }
    }

    const updateData = {
      'nilPreferences.dealSize': dealSize || '0-1k',
      'nilPreferences.timeline': timeline || 'medium',
      'nilPreferences.focusAreas': cleanedFocus,
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
          dealSize: dealSize || '0-1k',
          timeline: timeline || 'medium',
          focusAreas: cleanedFocus,
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
      data: { profile, connectionStatus: req.user ? await Connection.getConnectionStatus(req.user.id, userId) : 'not_connected' },
    })
  } catch (error) {
    console.error('Error in updateNILPreferences:', error)
    next(error)
  }
}

/**
 * GET the NIL focus areas catalog (public, cacheable, no auth required).
 */
export const getFocusAreasCatalog = async (req, res, next) => {
  try {
    const { FOCUS_AREAS_CATALOG } = await import('../data/focusAreasCatalog.js')
    res.set('Cache-Control', 'public, max-age=3600')
    res.status(200).json({
      status: 'success',
      data: {
        catalog: FOCUS_AREAS_CATALOG,
        minForCompletion: MIN_FOCUS_AREAS_FOR_COMPLETION,
      },
    })
  } catch (error) {
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
      data: { profile, connectionStatus: req.user ? await Connection.getConnectionStatus(req.user.id, userId) : 'not_connected' },
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

    if (!canViewerAccessProfile(req.user, profile)) {
      return next(createError(403, 'This profile is not visible yet'))
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

    let connectionStatus = 'not_connected'
    let connectionRequestId = null
    let connectionRequestMessage = null

    if (req.user) {
      connectionStatus = await Connection.getConnectionStatus(req.user.id, userId)
      
      if (connectionStatus === 'received') {
        const request = await ConnectionRequest.findOne({
          from: userId,
          to: req.user.id,
          status: 'pending'
        })
        if (request) {
          connectionRequestId = request._id
          connectionRequestMessage = request.message
        }
      } else if (connectionStatus === 'pending') {
         const request = await ConnectionRequest.findOne({
          from: req.user.id,
          to: userId,
          status: 'pending'
        })
        if (request) {
          connectionRequestId = request._id
        }
      }
    }

    const totalConnections = await Connection.find({
      $or: [{ user1: userId }, { user2: userId }],
      status: 'active',
    }).countDocuments()

    const socialLocked = shouldLockAthleteSocials(req.user, profile)
    let responseProfile = socialLocked
      ? maskAthleteSocials(profile)
      : (profile.toObject ? profile.toObject() : profile)

    if (shouldHideContactInfo(req.user, profile)) {
      responseProfile = maskPrivateContactInfo(responseProfile)
    }

    res.status(200).json({
      status: 'success',
      data: { 
        profile: responseProfile,
        socialLocked,
        connectionStatus,
        connectionRequestId,
        connectionRequestMessage,
        totalConnections
      },
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

    if (req.user?.userType === 'athlete') {
      const visibleAdvisorIds = (
        await User.find({
          userType: 'advisor',
          tier: { $in: ['growth', 'pro'] },
          isActive: true,
          isBlocked: { $ne: true },
        }).select('_id')
      ).map((user) => user._id)
      filter.user = { $in: visibleAdvisorIds }
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

    const filteredAdvisors = recommendedAdvisors.filter((profile) =>
      canBeVisibleToAthletes(profile.user)
    )

    res.status(200).json({
      status: 'success',
      data: { advisors: filteredAdvisors },
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
  // New shape: array of catalog values
  if (Array.isArray(interests)) return interests.length >= MIN_INTERESTS_FOR_COMPLETION
  // Legacy shape: boolean object (pre-migration)
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
    (nilPreferences.focusAreas?.length || 0) >= MIN_FOCUS_AREAS_FOR_COMPLETION
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
        location: profile.location,
        locationPreference: profile.locationPreference,
        // Structured arrays (Phase A — new shape)
        experience: Array.isArray(profile.experience) ? profile.experience : [],
        education: Array.isArray(profile.education) ? profile.education : [],
        socials: Array.isArray(profile.socials) ? profile.socials : [],
        // Backwards-compat virtual — kept so any legacy reader continues to work
        socialMedia: profile.socialMedia,
        publicVisibility: profile.publicVisibility || { email: true, phone: true },
        contactVisible: profile.contactVisible,
        isPublic: profile.isPublic,
        themeColor: profile.themeColor,
        themeId: profile.themeId,
        coverImage: profile.coverImage,
      },

      // Interests — array of catalog values (new shape).
      // `activeInterests` virtual normalizes legacy boolean docs to the array form.
      interests: Array.isArray(profile.interests) ? profile.interests : (profile.activeInterests || []),
      activeInterests: profile.activeInterests || [],

      // NIL Preferences
      nilPreferences: profile.nilPreferences || {
        dealSize: '0-1k',
        timeline: 'medium',
        focusAreas: [],
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
