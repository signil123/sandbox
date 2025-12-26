// File: server/models/Verification.js
import mongoose from 'mongoose'

const VerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        'license',
        'certification',
        'government_id',
        'id_card',
        'driver_license',
        'passport',
        'school_id',
        'certificate',
        'other'
      ],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'pending_review',
        'approved',
        'verified',
        'rejected',
        'requires_update',
        'expired'
      ],
      default: 'pending_review',
    },
    documentUrl: {
      type: String,
      required: true,
    },
    documentName: String,
    verificationDetails: {
      name: String,
      dateOfBirth: Date,
      issueDate: Date,
      expiryDate: Date,
      issueCountry: String,
      additionalInfo: String,
    },
    rejectionReason: String,
    rejectionDetails: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin user
    },
    approvalNotes: String,
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: String,
  },
  {
    timestamps: true,
  }
)

// Indexes
VerificationSchema.index({ user: 1 })
VerificationSchema.index({ status: 1 })
VerificationSchema.index({ documentType: 1 })
VerificationSchema.index({ submittedAt: -1 })
VerificationSchema.index({ user: 1, status: 1 })
VerificationSchema.index({ createdAt: -1 })

// Query middleware
VerificationSchema.pre(/^find/, function (next) {
  this.populate('user', 'name email')
  next()
})

// Instance Methods
VerificationSchema.methods.approve = async function (adminId, notes = '') {
  if (this.status !== 'pending') {
    throw new Error('Only pending verifications can be approved')
  }

  this.status = 'approved'
  this.reviewedAt = new Date()
  this.reviewedBy = adminId
  this.approvalNotes = notes

  // Update user verification status
  await mongoose.models.User.findByIdAndUpdate(this.user, {
    isVerified: true,
  })

  return await this.save()
}

VerificationSchema.methods.reject = async function (adminId, reason, details = '') {
  if (this.status !== 'pending') {
    throw new Error('Only pending verifications can be rejected')
  }

  this.status = 'rejected'
  this.reviewedAt = new Date()
  this.reviewedBy = adminId
  this.rejectionReason = reason
  this.rejectionDetails = details
  this.retryCount += 1

  if (this.retryCount >= this.maxRetries) {
    this.isBlocked = true
    this.blockedReason = `Maximum retries (${this.maxRetries}) exceeded`
  }

  return await this.save()
}

VerificationSchema.methods.canRetry = function () {
  return this.status === 'rejected' && this.retryCount < this.maxRetries && !this.isBlocked
}

VerificationSchema.methods.resubmit = async function (newDocumentUrl, details = {}) {
  if (!this.canRetry()) {
    throw new Error('This verification cannot be resubmitted')
  }

  this.status = 'pending'
  this.documentUrl = newDocumentUrl
  this.submittedAt = new Date()
  this.reviewedAt = null
  this.reviewedBy = null
  this.rejectionReason = null
  this.rejectionDetails = null

  if (details) {
    this.verificationDetails = {
      ...this.verificationDetails,
      ...details,
    }
  }

  return await this.save()
}

VerificationSchema.methods.markExpired = async function () {
  if (this.verificationDetails?.expiryDate && this.verificationDetails.expiryDate < new Date()) {
    this.status = 'expired'
    return await this.save()
  }
  throw new Error('Document has not expired yet')
}

// Static Methods
VerificationSchema.statics.getPendingVerifications = function (limit = 50, skip = 0) {
  return this.find({ status: 'pending', isBlocked: false })
    .sort({ submittedAt: 1 })
    .limit(limit)
    .skip(skip)
}

VerificationSchema.statics.getUserLatestVerification = function (userId) {
  return this.findOne({ user: userId }).sort({ createdAt: -1 })
}

VerificationSchema.statics.getUserVerificationHistory = function (userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 })
}

VerificationSchema.statics.isUserVerified = async function (userId) {
  const verification = await this.findOne({
    user: userId,
    status: 'approved',
  })
  return !!verification
}

VerificationSchema.statics.getBlockedUsers = function (limit = 50, skip = 0) {
  return this.find({ isBlocked: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
}

// Virtuals
VerificationSchema.virtual('isPending').get(function () {
  return this.status === 'pending'
})

VerificationSchema.virtual('isApproved').get(function () {
  return this.status === 'approved'
})

VerificationSchema.virtual('isRejected').get(function () {
  return this.status === 'rejected'
})

VerificationSchema.virtual('daysSinceSubmission').get(function () {
  return Math.floor((new Date() - this.submittedAt) / (1000 * 60 * 60 * 24))
})

VerificationSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.verificationDetails?.expiryDate) return null
  return Math.ceil((this.verificationDetails.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
})

export default mongoose.model('Verification', VerificationSchema)
