import mongoose from 'mongoose'

const ProfileViewSchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure unique combination of viewer and profileOwner
ProfileViewSchema.index({ viewer: 1, profileOwner: 1 }, { unique: true })
ProfileViewSchema.index({ profileOwner: 1, lastViewedAt: -1 })

export const ProfileView = mongoose.model('ProfileView', ProfileViewSchema)
