// File: server/models/User.js
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    // Basic fields
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },

    // Role and Type
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    userType: {
      type: String,
      enum: ['athlete', 'advisor', 'agent', null],
      default: null,
    },

    // Common profile fields
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', null],
      default: null,
    },
    language: {
      type: String,
      enum: ['English', 'Spanish', 'French', 'Mandarin', 'Other', null],
      default: null,
    },
    communicationPreference: {
      type: [String],
      enum: ['Email', 'Chat', 'Phone Call', 'Video Call'],
      default: [],
    },

    // Athlete-specific fields
    dateOfBirth: {
      type: Date,
      default: null,
    },
    school: {
      type: String,
      trim: true,
      default: null,
    },
    sport: {
      type: String,
      enum: [
        'Basketball',
        'Football',
        'Baseball',
        'Soccer',
        'Tennis',
        'Track & Field',
        'Volleyball',
        'Other',
        null,
      ],
      default: null,
    },
    nilNeeds: {
      type: [String],
      enum: [
        'Brand Partnerships and Marketing',
        'Contract Negotiation',
        'Social Media Strategy',
        'Financial Planning',
        'Taxes',
        'Brand Building',
        'Legal Compliance',
        'Contract Review',
        'Tax Help',
        'Brand Matching',
        'Legal Advice',
      ],
      default: [],
    },

    // Advisor/Agent-specific fields
    specialties: {
      type: [String],
      enum: [
        'Brand Partnerships and Marketing',
        'Contract Negotiation',
        'Social Media Strategy',
        'Financial Planning',
        'Taxes',
        'Brand Building',
        'Legal Compliance',
        'Contract Review',
        'Tax Planning',
        'Brand Matching',
        'Legal Advice',
        'Marketing',
      ],
      default: [],
    },
    experience: {
      type: String,
      enum: ['0-2 years', '2-5 years', '5-10 years', '10+ years', null],
      default: null,
    },

    // Profile completion status
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    // Account Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // Authentication
    lastLogin: {
      type: Date,
    },
    lastPasswordChange: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Relationships
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },

    // Stats
    totalConnections: {
      type: Number,
      default: 0,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },

    // Presence
    status: {
      type: String,
      enum: ['online', 'away', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    settings: {
      showLastSeen: {
        type: Boolean,
        default: true,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
UserSchema.index({ userType: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ isDeleted: 1, isActive: 1 })
UserSchema.index({ createdAt: 1 })

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    this.lastPasswordChange = new Date()
    next()
  } catch (error) {
    next(error)
  }
})

// Pre-save middleware to set full name
UserSchema.pre('save', function (next) {
  if (this.firstName || this.lastName) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim()
  }
  next()
})

// Query middleware to exclude deleted users
UserSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } })
  next()
})

// Methods
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000
  return resetToken
}

UserSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex')
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000
  return token
}

// Virtuals
UserSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin'
})

UserSchema.virtual('isAthlete').get(function () {
  return this.userType === 'athlete'
})

UserSchema.virtual('isAdvisor').get(function () {
  return this.userType === 'advisor'
})

UserSchema.virtual('isAgent').get(function () {
  return this.userType === 'agent'
})

export default mongoose.model('User', UserSchema)
