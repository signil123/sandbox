import { createError } from '../error.js'
import {
  Interest,
  NILPreference,
} from '../models/Content.js'
import Notification from '../models/Notification.js'
import Profile from '../models/Profile.js'
import ProfileView from '../models/ProfileView.js'
import User from '../models/User.js'
import Document from '../models/Verification.js'

// ═══════════════════════════════════════════════════════════════════════════
// ADVISOR/AGENT PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET - Complete advisor/agent profile bundle
export const getAdvisorProfile = async (req, res, next) => {
  try {
    const { advisorId } = req.params

    // Verify user exists and is advisor or agent
    const user = await User.findById(advisorId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (!['advisor', 'agent'].includes(user.userType)) {
      return next(createError(400, 'User is not an advisor or agent'))
    }

    // Get or create advisor profile
    let profile = await Profile.findOne({ user: advisorId })
    if (!profile) {
      profile = await Profile.create({
        user: advisorId,
        profileType: user.userType,
        isPublic: true,
      })
    }

    // Get or create NIL preferences
    let nilPreferences = await NILPreference.findOne({ user: advisorId })
    if (!nilPreferences) {
      nilPreferences = await NILPreference.create({
        user: advisorId,
      })
    }

    // Get related data
    const [interests, documents] = await Promise.all([
      Interest.find({ user: advisorId }),
      Document.find({ user: advisorId }).sort({ createdAt: -1 }),
    ])

    // Get verification status from documents
    const verificationStatus =
      documents.length > 0 ? documents[0].status : 'not_submitted'

    // Profile View Tracking & Notification
    if (req.user && user._id.toString() !== req.user.id) {
      const viewerId = req.user.id
      const ownerId = user._id

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
      data: {
        advisor: {
          profile: {
            _id: profile._id,
            user: { _id: user._id, name: user.name, email: user.email },
            profileImage: profile.profileImage,
            bannerImage: profile.bannerImage,
            phone: profile.phone,
            aboutMe: profile.aboutMe,
            specialization: profile.specialization,
            experience: profile.experience,
            certifications: profile.certifications,
            agencyName: profile.agencyName,
            agencySince: profile.agencySince,
            socialLinks: profile.socialLinks,
            verified: profile.verified,
            verificationStatus: profile.verificationStatus,
            themeId: profile.themeId,
            themeColor: profile.themeColor,
            ratings: profile.ratings,
            isVisible: profile.verified && profile.isPublic,
          },
          interests,
          nilPreferences,
          documents,
          verificationStatus,
          canConnect: profile.verified,
          canMessage: profile.verified,
          canBeDiscovered: profile.verified && profile.isPublic,
        },
      },
    })
  } catch (error) {
    console.error('Error in getAdvisorProfile:', error)
    next(error)
  }
}

// PUT - Update advisor personal information
export const updateAdvisorInfo = async (req, res, next) => {
  try {
    const { advisorId } = req.params
    const { name, phone, profileImage, bannerImage, aboutMe, socialLinks } =
      req.body

    // Ownership check via middleware ✓

    let profile = await Profile.findOne({ user: advisorId })
    if (!profile) {
      return next(createError(404, 'Advisor profile not found'))
    }

    // Validate phone
    if (phone && !/^[\d+\-\s()]+$/.test(phone)) {
      return next(createError(400, 'Invalid phone number format'))
    }

    // Update user name
    if (name) {
      await User.findByIdAndUpdate(
        advisorId,
        { name: name.trim() },
        { new: true, runValidators: true }
      )
    }

    // Update profile
    if (phone) profile.phone = phone
    if (profileImage) profile.profileImage = profileImage
    if (bannerImage) profile.bannerImage = bannerImage
    if (aboutMe) profile.aboutMe = aboutMe.trim()
    if (socialLinks) {
      profile.socialLinks = { ...profile.socialLinks, ...socialLinks }
    }

    await profile.save()

    // Notify user of security update
    if (name) {
      await Notification.create({
        recipient: advisorId,
        type: 'security_update',
        title: 'Security Update: Name Changed',
        description:
          'Your name has been successfully updated via profile settings.',
        priority: 'high',
      })
    }

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in updateAdvisorInfo:', error)
    next(error)
  }
}

// PUT - Update advisor professional information
export const updateAdvisorProfessional = async (req, res, next) => {
  try {
    const { advisorId } = req.params
    const {
      specialization,
      experience,
      certifications,
      agencyName,
      agencySince,
      title,
    } = req.body

    // Ownership check via middleware ✓

    let profile = await Profile.findOne({ user: advisorId })
    if (!profile) {
      return next(createError(404, 'Advisor profile not found'))
    }

    if (specialization) profile.specialization = specialization
    if (experience) profile.experience = experience
    if (certifications) profile.certifications = certifications
    if (agencyName) profile.agencyName = agencyName
    if (agencySince) profile.agencySince = agencySince
    if (title) profile.title = title

    await profile.save()

    res.status(200).json({
      status: 'success',
      data: { profile },
    })
  } catch (error) {
    console.error('Error in updateAdvisorProfessional:', error)
    next(error)
  }
}

// GET - Advisor interests
export const getAdvisorInterests = async (req, res, next) => {
  try {
    const { advisorId } = req.params

    const interests = await Interest.find({ user: advisorId })

    res.status(200).json({
      status: 'success',
      results: interests.length,
      data: { interests },
    })
  } catch (error) {
    console.error('Error in getAdvisorInterests:', error)
    next(error)
  }
}

// POST - Add advisor interest
export const addAdvisorInterest = async (req, res, next) => {
  try {
    const { advisorId } = req.params
    const { category, subcategories, level } = req.body

    // Ownership check via middleware ✓

    if (!category) {
      return next(createError(400, 'Category is required'))
    }

    const existingInterest = await Interest.findOne({
      user: advisorId,
      category,
    })

    if (existingInterest) {
      return next(createError(400, `Already have interest in ${category}`))
    }

    const newInterest = await Interest.create({
      user: advisorId,
      category,
      subcategories: subcategories || [],
      level: level || 'intermediate',
    })

    res.status(201).json({
      status: 'success',
      data: { interest: newInterest },
    })
  } catch (error) {
    console.error('Error in addAdvisorInterest:', error)
    next(error)
  }
}

// DELETE - Remove advisor interest
export const removeAdvisorInterest = async (req, res, next) => {
  try {
    const { advisorId, interestId } = req.params

    // Ownership check via middleware ✓

    const interest = await Interest.findById(interestId)
    if (!interest || interest.user.toString() !== advisorId) {
      return next(createError(404, 'Interest not found'))
    }

    await Interest.findByIdAndDelete(interestId)

    res.status(200).json({
      status: 'success',
      message: 'Interest removed successfully',
    })
  } catch (error) {
    console.error('Error in removeAdvisorInterest:', error)
    next(error)
  }
}

// GET - Advisor NIL preferences
export const getAdvisorNILPreferences = async (req, res, next) => {
  try {
    const { advisorId } = req.params

    const nilPref = await NILPreference.findOne({ user: advisorId })

    if (!nilPref) {
      return next(createError(404, 'NIL preferences not found'))
    }

    res.status(200).json({
      status: 'success',
      data: { nilPreferences: nilPref },
    })
  } catch (error) {
    console.error('Error in getAdvisorNILPreferences:', error)
    next(error)
  }
}

// PUT - Update advisor NIL preferences
export const updateAdvisorNILPreferences = async (req, res, next) => {
  try {
    const { advisorId } = req.params
    const {
      categories,
      minValue,
      maxValue,
      preferredBrand,
      excludedBrand,
      serviceTypes,
      geo_restrictions,
      additionalNotes,
      isPublic,
    } = req.body

    // Ownership check via middleware ✓

    if (minValue && maxValue && minValue > maxValue) {
      return next(
        createError(400, 'Minimum value cannot be greater than maximum value')
      )
    }

    let nilPref = await NILPreference.findOne({ user: advisorId })

    if (!nilPref) {
      nilPref = await NILPreference.create({
        user: advisorId,
        categories: categories || [],
        minValue: minValue || 0,
        maxValue: maxValue || 0,
        preferredBrand: preferredBrand || [],
        excludedBrand: excludedBrand || [],
        serviceTypes: serviceTypes || [],
        geo_restrictions: geo_restrictions || [],
        additionalNotes: additionalNotes || '',
        isPublic: isPublic !== undefined ? isPublic : false,
      })
    } else {
      if (categories) nilPref.categories = categories
      if (minValue !== undefined) nilPref.minValue = minValue
      if (maxValue !== undefined) nilPref.maxValue = maxValue
      if (preferredBrand) nilPref.preferredBrand = preferredBrand
      if (excludedBrand) nilPref.excludedBrand = excludedBrand
      if (serviceTypes) nilPref.serviceTypes = serviceTypes
      if (geo_restrictions) nilPref.geo_restrictions = geo_restrictions
      if (additionalNotes) nilPref.additionalNotes = additionalNotes
      if (isPublic !== undefined) nilPref.isPublic = isPublic

      await nilPref.save()
    }

    res.status(200).json({
      status: 'success',
      data: { nilPreferences: nilPref },
    })
  } catch (error) {
    console.error('Error in updateAdvisorNILPreferences:', error)
    next(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION STATUS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// GET - Verification status for advisor
export const getVerificationStatus = async (req, res, next) => {
  try {
    const { advisorId } = req.params

    const profile = await Profile.findOne({ user: advisorId })
    if (!profile) {
      return next(createError(404, 'Profile not found'))
    }

    const documents = await Document.find({ user: advisorId }).sort({
      createdAt: -1,
    })

    const latestDocument = documents[0] || null

    res.status(200).json({
      status: 'success',
      data: {
        verified: profile.verified,
        verificationStatus: profile.verificationStatus,
        latestDocument: latestDocument
          ? {
              _id: latestDocument._id,
              type: latestDocument.documentType,
              status: latestDocument.status,
              submittedAt: latestDocument.createdAt,
              reviewedAt: latestDocument.reviewedAt,
              rejectionReason: latestDocument.rejectionReason,
            }
          : null,
        documentsCount: documents.length,
        canConnect: profile.verified,
        canMessage: profile.verified,
        canBeDiscovered: profile.verified && profile.isPublic,
      },
    })
  } catch (error) {
    console.error('Error in getVerificationStatus:', error)
    next(error)
  }
}
