// File: server/models/PushSubscription.js
import mongoose from 'mongoose'

const PushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

PushSubscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true })

export default mongoose.model('PushSubscription', PushSubscriptionSchema)
