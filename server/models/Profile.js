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
    // Per-field public visibility for sensitive contact info.
    // `false` = hide even from accepted connections.
    // `true`  = blurred until connection accepted, then visible.
    publicVisibility: {
      email: { type: Boolean, default: true },
      phone: { type: Boolean, default: true },
    },
    // Unified socials array — single source of truth.
    // Backwards-compat virtuals `socialLinks` and `socialMedia` are derived
    // from this field for any legacy reader (see virtuals below).
    socials: {
      type: [
        {
          // Free-form platform identifier. The 6 builtin platforms use the
          // canonical lowercase keys (instagram/twitter/tiktok/youtube/
          // linkedin/facebook). Custom rows store the user-entered app name
          // verbatim (e.g. "Reddit", "Strava"). The `custom` flag tells
          // consumers which render path to use.
          platform: { type: String, required: true, trim: true, maxlength: 60 },
          handle: { type: String, default: '', trim: true, maxlength: 60 },
          url: { type: String, default: '', trim: true, maxlength: 300 },
          public: { type: Boolean, default: true },
          custom: { type: Boolean, default: false },
          _id: false,
        },
      ],
      default: [],
    },

    // ============================================
    // ATHLETE SPECIFIC FIELDS
    // ============================================
    sport: String,
    school: String,
    position: String,
    classYear: String,

    // Athlete Interests — free string array referencing the catalog at
    // server/data/interestsCatalog.js. Validation enforced in the
    // profile controller (min 5 to mark profile complete).
    interests: {
      type: [String],
      default: [],
      set: (val) =>
        Array.isArray(val)
          ? Array.from(new Set(val.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim())))
          : [],
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
    // SHARED — Experience & Education (athlete + advisor)
    // ============================================
    // Read by both AthletePublicView and AdvisorPublicView via the
    // ExperienceEntry / EducationEntry components. Field names below match
    // the JSX accessors in client/src/pages/Profile/AdvisorPublicView.jsx.
    experience: {
      type: [
        {
          role: { type: String, default: '', trim: true, maxlength: 120 },
          company: { type: String, default: '', trim: true, maxlength: 160 },
          type: {
            type: String,
            enum: ['Endorsement', 'Athletic', 'Community', 'Professional', null, ''],
            default: '',
          },
          startDate: { type: String, default: '' },
          endDate: { type: String, default: '' },
          location: { type: String, default: '', trim: true, maxlength: 160 },
          description: { type: String, default: '', trim: true, maxlength: 1000 },
          logoText: { type: String, default: '', trim: true, maxlength: 4 },
          logoBg: { type: String, default: '#163146' },
          _id: false,
        },
      ],
      default: [],
    },
    education: {
      type: [
        {
          school: { type: String, default: '', trim: true, maxlength: 160 },
          degree: { type: String, default: '', trim: true, maxlength: 160 },
          fieldOfStudy: { type: String, default: '', trim: true, maxlength: 160 },
          startYear: { type: String, default: '' },
          endYear: { type: String, default: '' },
          description: { type: String, default: '', trim: true, maxlength: 1000 },
          logoText: { type: String, default: '', trim: true, maxlength: 4 },
          logoBg: { type: String, default: '#163146' },
          _id: false,
        },
      ],
      default: [],
    },

    // ============================================
    // ADVISOR SPECIFIC FIELDS
    // ============================================
    specialization: [String],
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

// Virtual to get active interests as array.
// New shape: `interests` is `[String]` directly. Returned as-is.
// Legacy fallback: if `interests` is still a boolean object (pre-migration),
// translate keys to display labels for any reader that still calls this.
ProfileSchema.virtual('activeInterests').get(function () {
  if (!this.interests) return []
  if (Array.isArray(this.interests)) return [...this.interests]

  const legacyLabels = {
    brandPartnerships: 'Brand Partnerships',
    contentCreation: 'Content Creation',
    eventAppearances: 'Event Appearances',
    socialMediaGrowth: 'Social Media Growth',
    endorsements: 'Endorsement Deals',
    sponsorships: 'Sponsorships',
    merchandising: 'Merchandising',
    charitableWork: 'Charitable Work',
    speakingEngagements: 'Speaking Engagements',
    mediaTraining: 'Media Training',
  }
  const obj = this.interests.toObject ? this.interests.toObject() : this.interests
  return Object.entries(obj)
    .filter(([, enabled]) => enabled)
    .map(([key]) => legacyLabels[key] || key)
})

// Backwards-compat virtual: legacy `socialMedia` shape derived from `socials`.
// Public views read `profile.socialMedia.{instagram,twitter,tiktok}` today.
// This keeps them working with no view changes.
ProfileSchema.virtual('socialMedia').get(function () {
  const out = { instagram: '', twitter: '', tiktok: '' }
  if (!Array.isArray(this.socials)) return out
  for (const s of this.socials) {
    if (!s || !s.platform) continue
    if (out[s.platform] !== undefined) out[s.platform] = s.handle || ''
  }
  return out
})

// Backwards-compat virtual: legacy `socialLinks` shape (the dead duplicate).
// Kept in case any seed/explore/admin code still touches it.
ProfileSchema.virtual('socialLinks').get(function () {
  const out = { twitter: '', instagram: '', linkedin: '', facebook: '' }
  if (!Array.isArray(this.socials)) return out
  for (const s of this.socials) {
    if (!s || !s.platform) continue
    if (out[s.platform] !== undefined) out[s.platform] = s.url || s.handle || ''
  }
  return out
})

export default mongoose.model('Profile', ProfileSchema)
