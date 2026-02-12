import mongoose from 'mongoose'

const StripePlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    tier: {
      type: String,
      enum: ['free', 'growth', 'pro'],
      required: true,
    },
    stripeProductId: {
      type: String,
      default: null,
    },
    stripePriceId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
      trim: true,
    },
    interval: {
      type: String,
      enum: ['month'],
      default: 'month',
    },
    features: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

StripePlanSchema.index({ active: 1 })
StripePlanSchema.index({ tier: 1 })
StripePlanSchema.index({ stripePriceId: 1 })

const StripePlan = mongoose.model('StripePlan', StripePlanSchema)

export default StripePlan
