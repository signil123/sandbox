// File: server/controllers/push.js
import webpush from 'web-push'
import PushSubscription from '../models/PushSubscription.js'

const getVapidConfig = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@signilai.com'
  if (!publicKey || !privateKey) return null
  return { publicKey, privateKey, subject }
}

const ensureVapidConfigured = () => {
  const config = getVapidConfig()
  if (!config) return null
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
  return config
}

export const getPublicKey = async (req, res, next) => {
  try {
    const config = getVapidConfig()
    if (!config) {
      return res.status(503).json({
        status: 'error',
        message: 'Push notifications are not configured.',
      })
    }
    res.status(200).json({ status: 'success', publicKey: config.publicKey })
  } catch (error) {
    next(error)
  }
}

export const subscribe = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { subscription, userAgent } = req.body || {}

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ status: 'error', message: 'Invalid subscription payload.' })
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user: userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userAgent: userAgent || null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.status(200).json({ status: 'success' })
  } catch (error) {
    next(error)
  }
}

export const unsubscribe = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { endpoint } = req.body || {}
    if (!endpoint) {
      return res.status(400).json({ status: 'error', message: 'Endpoint is required.' })
    }

    await PushSubscription.deleteOne({ user: userId, endpoint })
    res.status(200).json({ status: 'success' })
  } catch (error) {
    next(error)
  }
}

export const sendPushToUser = async (userId, payload) => {
  const config = ensureVapidConfigured()
  if (!config) return

  const subscriptions = await PushSubscription.find({ user: userId })
  if (!subscriptions.length) return

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify(payload),
          { TTL: 60 * 30 }
        )
      } catch (error) {
        const statusCode = error?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ endpoint: sub.endpoint })
        }
      }
    })
  )
}
