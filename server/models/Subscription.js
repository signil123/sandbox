// File: server/models/Subscription.js
import mongoose from 'mongoose'

const SubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    renewalDate: Date,
    cancelledDate: Date,
    cancellationReason: String,

    // Billing
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual'],
      default: 'monthly',
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,

    // Features and Limits
    features: {
      maxConnections: {
        type: Number,
        default: 50,
      },
      maxMessages: {
        type: Number,
        default: 100,
      },
      maxEvents: {
        type: Number,
        default: 5,
      },
      canVerifyProfile: {
        type: Boolean,
        default: false,
      },
      canListNILOpportunities: {
        type: Boolean,
        default: false,
      },
      canAccessAnalytics: {
        type: Boolean,
        default: false,
      },
      canAccessAdvanced: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
    },

    // Usage Tracking
    currentUsage: {
      connections: {
        type: Number,
        default: 0,
      },
      messages: {
        type: Number,
        default: 0,
      },
      events: {
        type: Number,
        default: 0,
      },
    },

    // Auto-renewal
    autoRenew: {
      type: Boolean,
      default: true,
    },

    // Trial
    isTrialActive: {
      type: Boolean,
      default: false,
    },
    trialEndDate: Date,

    // Additional metadata
    notes: String,
    lastPaymentDate: Date,
    nextPaymentDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
SubscriptionSchema.index({ user: 1 })
SubscriptionSchema.index({ plan: 1 })
SubscriptionSchema.index({ status: 1 })
SubscriptionSchema.index({ renewalDate: 1 })
SubscriptionSchema.index({ endDate: 1 })
SubscriptionSchema.index({ stripeSubscriptionId: 1 })

// Instance Methods
SubscriptionSchema.methods.upgrade = async function (newPlan, price) {
  if (!['free', 'basic', 'pro', 'enterprise'].includes(newPlan)) {
    throw new Error('Invalid plan')
  }

  this.plan = newPlan
  this.price = price
  this.status = 'active'

  // Update features based on plan
  this.features = this._getFeaturesByPlan(newPlan)

  return await this.save()
}

SubscriptionSchema.methods.downgrade = async function (newPlan) {
  if (!['free', 'basic'].includes(newPlan)) {
    throw new Error('Can only downgrade to free or basic')
  }

  this.plan = newPlan
  this.features = this._getFeaturesByPlan(newPlan)

  return await this.save()
}

SubscriptionSchema.methods.cancel = async function (reason = '') {
  this.status = 'cancelled'
  this.cancelledDate = new Date()
  this.cancellationReason = reason
  this.autoRenew = false

  return await this.save()
}

SubscriptionSchema.methods.suspend = async function (reason = '') {
  this.status = 'suspended'
  return await this.save()
}

SubscriptionSchema.methods.reactivate = async function () {
  if (this.status === 'cancelled') {
    throw new Error('Cancelled subscriptions cannot be reactivated')
  }

  this.status = 'active'
  this.cancelledDate = null
  this.cancellationReason = null

  return await this.save()
}

SubscriptionSchema.methods.startTrial = async function (trialDays = 14) {
  this.isTrialActive = true
  this.trialEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
  this.status = 'active'

  return await this.save()
}

SubscriptionSchema.methods.endTrial = async function (shouldConvertToPaid = false) {
  this.isTrialActive = false

  if (!shouldConvertToPaid) {
    this.plan = 'free'
    this.status = 'inactive'
  }

  return await this.save()
}

SubscriptionSchema.methods.checkUsageLimits = function () {
  const exceeded = []

  if (
    this.currentUsage.connections > this.features.maxConnections &&
    this.features.maxConnections > 0
  ) {
    exceeded.push('connections')
  }

  if (this.currentUsage.messages > this.features.maxMessages && this.features.maxMessages > 0) {
    exceeded.push('messages')
  }

  if (this.currentUsage.events > this.features.maxEvents && this.features.maxEvents > 0) {
    exceeded.push('events')
  }

  return exceeded
}

SubscriptionSchema.methods.incrementUsage = async function (type, amount = 1) {
  if (!['connections', 'messages', 'events'].includes(type)) {
    throw new Error('Invalid usage type')
  }

  this.currentUsage[type] += amount
  return await this.save()
}

SubscriptionSchema.methods.resetUsage = async function () {
  this.currentUsage = {
    connections: 0,
    messages: 0,
    events: 0,
  }
  return await this.save()
}

// Private helper method
SubscriptionSchema.methods._getFeaturesByPlan = function (plan) {
  const planFeatures = {
    free: {
      maxConnections: 10,
      maxMessages: 50,
      maxEvents: 1,
      canVerifyProfile: false,
      canListNILOpportunities: false,
      canAccessAnalytics: false,
      canAccessAdvanced: false,
      customBranding: false,
      prioritySupport: false,
    },
    basic: {
      maxConnections: 50,
      maxMessages: 500,
      maxEvents: 5,
      canVerifyProfile: true,
      canListNILOpportunities: true,
      canAccessAnalytics: false,
      canAccessAdvanced: false,
      customBranding: false,
      prioritySupport: false,
    },
    pro: {
      maxConnections: 500,
      maxMessages: 5000,
      maxEvents: 20,
      canVerifyProfile: true,
      canListNILOpportunities: true,
      canAccessAnalytics: true,
      canAccessAdvanced: true,
      customBranding: false,
      prioritySupport: true,
    },
    enterprise: {
      maxConnections: -1, // Unlimited
      maxMessages: -1,
      maxEvents: -1,
      canVerifyProfile: true,
      canListNILOpportunities: true,
      canAccessAnalytics: true,
      canAccessAdvanced: true,
      customBranding: true,
      prioritySupport: true,
    },
  }

  return planFeatures[plan] || planFeatures.free
}

// Static Methods
SubscriptionSchema.statics.getByUserId = function (userId) {
  return this.findOne({ user: userId })
}

SubscriptionSchema.statics.getExpiringSubscriptions = function (daysUntilExpiry = 7) {
  const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000)
  return this.find({
    endDate: { $lt: expiryDate, $gt: new Date() },
    status: 'active',
  })
}

SubscriptionSchema.statics.getTrialSubscriptions = function () {
  return this.find({
    isTrialActive: true,
    trialEndDate: { $lt: new Date() },
  })
}

// Virtuals
SubscriptionSchema.virtual('daysUntilRenewal').get(function () {
  if (!this.renewalDate) return null
  return Math.ceil((this.renewalDate - new Date()) / (1000 * 60 * 60 * 24))
})

SubscriptionSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.endDate) return null
  return Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24))
})

SubscriptionSchema.virtual('isExpired').get(function () {
  return this.endDate && this.endDate < new Date()
})

SubscriptionSchema.virtual('isTrialExpired').get(function () {
  return this.isTrialActive && this.trialEndDate < new Date()
})

SubscriptionSchema.virtual('usagePercentage').get(function () {
  const usage = {}
  if (this.features.maxConnections > 0) {
    usage.connections = Math.round(
      (this.currentUsage.connections / this.features.maxConnections) * 100
    )
  }
  if (this.features.maxMessages > 0) {
    usage.messages = Math.round((this.currentUsage.messages / this.features.maxMessages) * 100)
  }
  if (this.features.maxEvents > 0) {
    usage.events = Math.round((this.currentUsage.events / this.features.maxEvents) * 100)
  }
  return usage
})

export default mongoose.model('Subscription', SubscriptionSchema)
