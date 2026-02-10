// File: server/models/Event.js
import mongoose from 'mongoose'

// Invitation Schema
const InvitationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'maybe'],
      default: 'pending',
    },
    respondedAt: Date,
    message: String,
  },
  {
    timestamps: true,
  }
)

// Event Schema
const EventSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['networking', 'workshop', 'seminar', 'meetup', 'conference', 'meeting', 'other'],
      required: true,
    },
    locationType: {
      type: String,
      enum: ['In-Person', 'Phone Call', 'Video Call'],
      required: true,
      default: 'In-Person',
    },
    location: {
      address: String,
      phone: String,
      city: String,
      state: String,
      country: String,
      latitude: Number,
      longitude: Number,
    },
    virtualLocation: {
      platform: {
        type: String,
        enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Other'],
      },
      link: String,
    },
    attachments: [String],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
    eventImage: String,
    capacity: Number,
    registeredCount: {
      type: Number,
      default: 0,
    },
    invitationsSent: {
      type: Number,
      default: 0,
    },
    tags: [String],
    isVirtual: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancellationReason: String,
    agenda: [
      {
        time: String,
        title: String,
        description: String,
        speaker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    sponsors: [
      {
        name: String,
        logo: String,
        website: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for Invitation
InvitationSchema.index({ event: 1, invitee: 1 }, { unique: true })
InvitationSchema.index({ invitee: 1, status: 1 })
InvitationSchema.index({ event: 1, status: 1 })
InvitationSchema.index({ createdAt: -1 })

// Indexes for Event
EventSchema.index({ creator: 1 })
EventSchema.index({ startDate: 1 })
EventSchema.index({ eventType: 1 })
EventSchema.index({ isPublic: 1, isCancelled: 1 })
EventSchema.index({ tags: 1 })
EventSchema.index({ 'location.city': 1 })

// Pre-save validation
EventSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date')
  }

  if (this.capacity && this.registeredCount > this.capacity) {
    throw new Error('Registered count cannot exceed capacity')
  }

  next()
})

// Pre-save middleware for Invitation
InvitationSchema.pre('save', async function (next) {
  const event = await mongoose.models.Event.findById(this.event)

  if (!event) {
    throw new Error('Event not found')
  }

  if (event.isCancelled) {
    throw new Error('Cannot add invitations to cancelled event')
  }

  next()
})

// Invitation Methods
InvitationSchema.methods.accept = async function () {
  if (this.status !== 'pending' && this.status !== 'maybe') {
    throw new Error('Only pending or maybe invitations can be accepted')
  }

  this.status = 'accepted'
  this.respondedAt = new Date()

  const event = await mongoose.models.Event.findById(this.event)
  if (event && !event.isCancelled) {
    event.registeredCount += 1
    await event.save()
  }

  return await this.save()
}

InvitationSchema.methods.decline = async function () {
  if (this.status === 'accepted') {
    const event = await mongoose.models.Event.findById(this.event)
    if (event) {
      event.registeredCount = Math.max(0, event.registeredCount - 1)
      await event.save()
    }
  }

  this.status = 'declined'
  this.respondedAt = new Date()
  return await this.save()
}

InvitationSchema.methods.markMaybe = async function () {
  this.status = 'maybe'
  this.respondedAt = new Date()
  return await this.save()
}

// Event Methods
EventSchema.methods.sendInvitations = async function (userIds) {
  const invitations = userIds.map((userId) => ({
    event: this._id,
    invitee: userId,
  }))

  const created = await mongoose.models.Invitation.insertMany(invitations)
  this.invitationsSent += created.length
  await this.save()
  return created
}

EventSchema.methods.cancel = async function (reason) {
  this.isCancelled = true
  this.cancellationReason = reason
  await this.save()
}

EventSchema.methods.getInvitationsSummary = async function () {
  const invitations = await mongoose.models.Invitation.aggregate([
    { $match: { event: this._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  return {
    total: this.invitationsSent,
    pending: invitations.find((i) => i._id === 'pending')?.count || 0,
    accepted: invitations.find((i) => i._id === 'accepted')?.count || 0,
    declined: invitations.find((i) => i._id === 'declined')?.count || 0,
    maybe: invitations.find((i) => i._id === 'maybe')?.count || 0,
  }
}

EventSchema.methods.isUpcoming = function () {
  return this.startDate > new Date() && !this.isCancelled
}

EventSchema.methods.isPast = function () {
  return this.endDate < new Date()
}

// Virtuals
EventSchema.virtual('durationInHours').get(function () {
  return Math.round((this.endDate - this.startDate) / (1000 * 60 * 60))
})

EventSchema.virtual('availableSeats').get(function () {
  if (!this.capacity) return null
  return Math.max(0, this.capacity - this.registeredCount)
})

EventSchema.virtual('isFull').get(function () {
  if (!this.capacity) return false
  return this.registeredCount >= this.capacity
})

export const Invitation = mongoose.model('Invitation', InvitationSchema)
export const Event = mongoose.model('Event', EventSchema)
