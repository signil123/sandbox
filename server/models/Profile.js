import mongoose from 'mongoose'

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    profileType: {
      type: String,
      enum: ['athlete', 'advisor', 'agent'],
      required: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    aboutMe: {
      type: String,
      maxlength: 500,
    },
    profileImage: {
      type: String,
    },
    photo: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    location: {
      type: String,
    },
    locationPreference: {
      type: String,
      enum: ['In-person', 'Remote', 'Hybrid', null],
      default: null,
    },
    website: {
      type: String,
    },
    socialLinks: {
      twitter: String,
      instagram: String,
      linkedin: String,
      facebook: String,
    },
    socialMedia: {
      instagram: String,
      twitter: String,
      tiktok: String,
    },

    // ============================================
    // ATHLETE SPECIFIC FIELDS
    // ============================================
    sport: String,
    school: String,
    position: String,
    classYear: String,
    jerseyNumber: String,
    height: String,
    weight: String,
    yearsActive: {
      start: Number,
      end: Number,
    },
    achievements: [
      {
        title: String,
        description: String,
        date: Date,
      },
    ],
    stats: {
      type: Map,
      of: String,
    },

    // Athlete Interests (toggleable)
    interests: {
      brandPartnerships: {
        type: Boolean,
        default: false,
      },
      contentCreation: {
        type: Boolean,
        default: false,
      },
      eventAppearances: {
        type: Boolean,
        default: false,
      },
      socialMediaGrowth: {
        type: Boolean,
        default: false,
      },
      endorsements: {
        type: Boolean,
        default: false,
      },
      sponsorships: {
        type: Boolean,
        default: false,
      },
      merchandising: {
        type: Boolean,
        default: false,
      },
      charitableWork: {
        type: Boolean,
        default: false,
      },
      speakingEngagements: {
        type: Boolean,
        default: false,
      },
      mediaTraining: {
        type: Boolean,
        default: false,
      },
    },

    // NIL Preferences (Athlete)
    nilPreferences: {
      dealSize: {
        type: String,
        enum: ['50k-100k', '100k-250k', '250k-500k', '500k-1m', '1m-5m', '5m+'],
        default: '250k-500k',
      },
      timeline: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium',
      },
      focusAreas: {
        type: [
          {
            title: { type: String, required: true, trim: true, maxlength: 120 },
            description: { type: String, default: '', trim: true, maxlength: 600 },
            _id: false,
          },
        ],
        default: [],
        set: (val) =>
          (Array.isArray(val) ? val : []).map((v) =>
            typeof v === 'string' ? { title: v, description: '' } : v
          ),
        get: (val) =>
          (Array.isArray(val) ? val : [])
            .map((v) => (typeof v === 'string' ? { title: v, description: '' } : v))
            .filter((v) => v && v.title),
      },
    },

    // ============================================
    // ADVISOR SPECIFIC FIELDS
    // ============================================
    specialization: [String],
    experience: String,
    education: String,
    certifications: [String],
    clients: {
      type: Number,
      default: 0,
    },
    specialties: [String],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    title: String,

    // ============================================
    // AGENT SPECIFIC FIELDS
    // ============================================
    agencyName: String,
    agencySince: Date,
    representedAthletes: {
      type: Number,
      default: 0,
    },

    // ============================================
    // COMMON FIELDS
    // ============================================
    verified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: [
        'not_submitted',
        'pending',
        'pending_review',
        'approved',
        'rejected',
        'requires_update',
        'expired',
      ],
      default: 'not_submitted',
    },
    ratings: {
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    contactVisible: {
      type: Boolean,
      default: true,
    },
    themeColor: {
      type: String,
      default: 'Ocean',
    },
    themeId: {
      type: String,
      default: 'ocean',
    },
    coverImage: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
)

// Indexes
ProfileSchema.index({ profileType: 1 })
ProfileSchema.index({ verified: 1 })
ProfileSchema.index({ 'ratings.averageRating': -1 })
ProfileSchema.index({ sport: 1 })
ProfileSchema.index({ school: 1 })

// Virtuals
ProfileSchema.virtual('displayName').get(function () {
  return `${this.profileType
    .charAt(0)
    .toUpperCase()}${this.profileType.slice(1)}`
})

// Virtual to get active interests as array
ProfileSchema.virtual('activeInterests').get(function () {
  if (!this.interests) return []

  const interestLabels = {
    brandPartnerships: 'Brand Partnerships',
    contentCreation: 'Content Creation',
    eventAppearances: 'Event Appearances',
    socialMediaGrowth: 'Social Media Growth',
    endorsements: 'Endorsements',
    sponsorships: 'Sponsorships',
    merchandising: 'Merchandising',
    charitableWork: 'Charitable Work',
    speakingEngagements: 'Speaking Engagements',
    mediaTraining: 'Media Training',
  }

  const interestsObj = this.interests.toObject
    ? this.interests.toObject()
    : this.interests

  return Object.entries(interestsObj)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => interestLabels[key] || key)
})

export default mongoose.model('Profile', ProfileSchema)
