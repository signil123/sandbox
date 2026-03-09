import mongoose from 'mongoose'

const MonthlyUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    monthKey: {
      type: String,
      required: true,
      index: true,
    },
    connectionRequestsSent: {
      type: Number,
      default: 0,
      min: 0,
    },
    connectionsAccepted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

MonthlyUsageSchema.index({ user: 1, monthKey: 1 }, { unique: true })

export const getMonthKeyUTC = (date = new Date()) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

MonthlyUsageSchema.statics.getUsageForUserMonth = async function (userId, monthKey = getMonthKeyUTC()) {
  const usage = await this.findOne({ user: userId, monthKey })

  return usage || {
    user: userId,
    monthKey,
    connectionRequestsSent: 0,
    connectionsAccepted: 0,
  }
}

MonthlyUsageSchema.statics.incrementCounter = async function (
  userId,
  counterName,
  amount = 1,
  monthKey = getMonthKeyUTC()
) {
  if (!['connectionRequestsSent', 'connectionsAccepted'].includes(counterName)) {
    throw new Error('Invalid monthly usage counter')
  }

  const usage = await this.findOneAndUpdate(
    { user: userId, monthKey },
    {
      $setOnInsert: { user: userId, monthKey },
      $inc: { [counterName]: amount },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  )

  return usage
}

const MonthlyUsage = mongoose.model('MonthlyUsage', MonthlyUsageSchema)

export default MonthlyUsage
