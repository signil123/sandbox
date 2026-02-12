import { createError } from '../error.js'
import StripePlan from '../models/StripePlan.js'
import User from '../models/User.js'
import { stripeRequest } from '../utils/stripeClient.js'

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid']

const formatPlanResponse = (plan) => ({
  _id: plan._id,
  name: plan.name,
  description: plan.description,
  tier: plan.tier,
  amount: plan.amount,
  currency: plan.currency,
  interval: plan.interval,
  features: plan.features,
  active: plan.active,
  stripeProductId: plan.stripeProductId,
  stripePriceId: plan.stripePriceId,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
})

const getFrontEndUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173'

const getCurrentPeriodEnd = (subscription) => {
  if (!subscription?.current_period_end) return null
  return new Date(subscription.current_period_end * 1000)
}

const getSubscriptionPriceId = (subscription) => {
  return subscription?.items?.data?.[0]?.price?.id || null
}

const findBestActiveSubscription = (subscriptions = []) => {
  if (!subscriptions.length) return null

  const byStatusPriority = {
    active: 0,
    trialing: 1,
    past_due: 2,
    unpaid: 3,
    canceled: 4,
    incomplete: 5,
    incomplete_expired: 6,
  }

  const sorted = [...subscriptions].sort((a, b) => {
    const aRank = byStatusPriority[a.status] ?? 999
    const bRank = byStatusPriority[b.status] ?? 999
    return aRank - bRank
  })

  return sorted.find((sub) => ACTIVE_STATUSES.includes(sub.status)) || sorted[0]
}

const ensureStripeCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const customer = await stripeRequest('/customers', {
    method: 'POST',
    data: {
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    },
  })

  user.stripeCustomerId = customer.id
  await user.save({ validateBeforeSave: false })

  return customer.id
}

const syncUserFromStripeSubscription = async (user, subscription, plan = null) => {
  if (!subscription) {
    user.tier = 'free'
    user.subscriptionStatus = 'inactive'
    user.stripeSubscriptionId = null
    user.subscriptionCurrentPeriodEnd = null
    user.cancelAtPeriodEnd = false
    await user.save({ validateBeforeSave: false })
    return
  }

  const resolvedTier = plan?.tier || user.tier || 'free'
  user.tier = resolvedTier
  user.subscriptionStatus = subscription.status || 'inactive'
  user.stripeSubscriptionId = subscription.id || null
  user.subscriptionCurrentPeriodEnd = getCurrentPeriodEnd(subscription)
  user.cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)
  await user.save({ validateBeforeSave: false })
}

const getStripeSubscriptionsForCustomer = async (customerId) => {
  const result = await stripeRequest('/subscriptions', {
    method: 'GET',
    query: {
      customer: customerId,
      status: 'all',
      limit: 20,
      expand: ['data.items.data.price'],
    },
  })

  return result?.data || []
}

const refreshAndResolveUserSubscription = async (user) => {
  if (!user.stripeCustomerId) {
    if (user.tier !== 'free' || user.subscriptionStatus !== 'inactive') {
      user.tier = 'free'
      user.subscriptionStatus = 'inactive'
      user.stripeSubscriptionId = null
      user.subscriptionCurrentPeriodEnd = null
      user.cancelAtPeriodEnd = false
      await user.save({ validateBeforeSave: false })
    }

    return {
      subscription: null,
      plan: null,
    }
  }

  const subscriptions = await getStripeSubscriptionsForCustomer(user.stripeCustomerId)
  const activeSubscription = findBestActiveSubscription(subscriptions)

  if (!activeSubscription || !ACTIVE_STATUSES.includes(activeSubscription.status)) {
    await syncUserFromStripeSubscription(user, null, null)
    return {
      subscription: null,
      plan: null,
    }
  }

  const priceId = getSubscriptionPriceId(activeSubscription)
  const matchingPlan = priceId
    ? await StripePlan.findOne({ stripePriceId: priceId })
    : null

  await syncUserFromStripeSubscription(user, activeSubscription, matchingPlan)

  return {
    subscription: activeSubscription,
    plan: matchingPlan,
  }
}

export const getAdminPlans = async (req, res, next) => {
  try {
    const plans = await StripePlan.find().sort({ amount: 1, createdAt: -1 })

    res.status(200).json({
      status: 'success',
      data: {
        plans: plans.map(formatPlanResponse),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const createAdminPlan = async (req, res, next) => {
  try {
    const { name, description = '', tier, amount, currency = 'usd', features = [], active = true } = req.body

    const existingCount = await StripePlan.countDocuments()
    if (existingCount >= 3) {
      return next(createError(400, 'Plan limit reached. Only 3 plans are allowed.'))
    }

    if (!name || !tier || amount === undefined || amount === null) {
      return next(createError(400, 'name, tier and amount are required'))
    }

    if (!['free', 'growth', 'pro'].includes(tier)) {
      return next(createError(400, 'tier must be one of: free, growth, pro'))
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return next(createError(400, 'amount must be a positive number'))
    }

    const sanitizedFeatures = Array.isArray(features)
      ? features.map((feature) => String(feature).trim()).filter(Boolean)
      : []

    let stripeProductId = null
    let stripePriceId = null

    if (tier !== 'free') {
      if (parsedAmount <= 0) {
        return next(createError(400, 'Paid plans must have amount greater than 0'))
      }

      const product = await stripeRequest('/products', {
        method: 'POST',
        data: {
          name: String(name).trim(),
          description: String(description || '').trim(),
          active: Boolean(active),
          metadata: {
            tier,
          },
        },
      })

      const unitAmount = Math.round(parsedAmount * 100)
      const price = await stripeRequest('/prices', {
        method: 'POST',
        data: {
          currency: String(currency).toLowerCase().trim(),
          unit_amount: unitAmount,
          recurring: {
            interval: 'month',
          },
          product: product.id,
          metadata: {
            tier,
          },
        },
      })

      stripeProductId = product.id
      stripePriceId = price.id
    }

    const plan = await StripePlan.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
      tier,
      amount: parsedAmount,
      currency: String(currency).toLowerCase().trim(),
      interval: 'month',
      features: sanitizedFeatures,
      active: Boolean(active),
      stripeProductId,
      stripePriceId,
      createdBy: req.user._id,
    })

    res.status(201).json({
      status: 'success',
      data: {
        plan: formatPlanResponse(plan),
      },
    })
  } catch (error) {
    next(error)
  }
}

const isStripeResourceMissing = (error) => {
  if (error?.statusCode === 404 || error?.details?.code === 'resource_missing') return true
  const message = String(error?.message || '')
  return message.includes('No such product') || message.includes('No such price')
}

const rebuildStripeForPlan = async (plan) => {
  if (plan.tier === 'free') {
    plan.stripeProductId = null
    plan.stripePriceId = null
    return plan
  }

  const product = await stripeRequest('/products', {
    method: 'POST',
    data: {
      name: plan.name,
      description: plan.description,
      active: Boolean(plan.active),
      metadata: {
        tier: plan.tier,
      },
    },
  })

  const price = await stripeRequest('/prices', {
    method: 'POST',
    data: {
      currency: String(plan.currency).toLowerCase().trim(),
      unit_amount: Math.round(plan.amount * 100),
      recurring: {
        interval: 'month',
      },
      product: product.id,
      metadata: {
        tier: plan.tier,
      },
    },
  })

  plan.stripeProductId = product.id
  plan.stripePriceId = price.id
  return plan
}

export const updateAdminPlan = async (req, res, next) => {
  try {
    const { planId } = req.params
    const { active, description, features, amount } = req.body

    const plan = await StripePlan.findById(planId)
    if (!plan) {
      return next(createError(404, 'Plan not found'))
    }

    const parsedAmount = amount !== undefined ? Number(amount) : null
    if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
      return next(createError(400, 'amount must be a positive number'))
    }

    if (active !== undefined) {
      plan.active = Boolean(active)

      if (plan.stripeProductId) {
        await stripeRequest(`/products/${plan.stripeProductId}`, {
          method: 'POST',
          data: {
            active: Boolean(active),
          },
        })
      }
    }

    if (description !== undefined) {
      plan.description = String(description || '').trim()
      if (plan.stripeProductId) {
        try {
          await stripeRequest(`/products/${plan.stripeProductId}`, {
            method: 'POST',
            data: {
              description: plan.description,
            },
          })
        } catch (error) {
          if (isStripeResourceMissing(error)) {
            await rebuildStripeForPlan(plan)
          } else {
            throw error
          }
        }
      }
    }

    if (features !== undefined) {
      plan.features = Array.isArray(features)
        ? features.map((feature) => String(feature).trim()).filter(Boolean)
        : []
    }

    if (parsedAmount !== null && plan.tier !== 'free' && plan.stripeProductId) {
      if (parsedAmount <= 0) {
        return next(createError(400, 'Paid plans must have amount greater than 0'))
      }
      const unitAmount = Math.round(parsedAmount * 100)
      try {
        const price = await stripeRequest('/prices', {
          method: 'POST',
          data: {
            currency: String(plan.currency).toLowerCase().trim(),
            unit_amount: unitAmount,
            recurring: {
              interval: 'month',
            },
            product: plan.stripeProductId,
            metadata: {
              tier: plan.tier,
            },
          },
        })
        plan.amount = parsedAmount
        plan.stripePriceId = price.id
      } catch (error) {
        if (isStripeResourceMissing(error)) {
          plan.amount = parsedAmount
          await rebuildStripeForPlan(plan)
        } else {
          throw error
        }
      }
    } else if (parsedAmount !== null) {
      plan.amount = parsedAmount
    }

    await plan.save()

    res.status(200).json({
      status: 'success',
      data: {
        plan: formatPlanResponse(plan),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getPlans = async (req, res, next) => {
  try {
    const plans = await StripePlan.find({ active: true }).sort({ amount: 1, createdAt: -1 })

    res.status(200).json({
      status: 'success',
      data: {
        plans: plans.map(formatPlanResponse),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body
    if (!planId) {
      return next(createError(400, 'planId is required'))
    }

    const plan = await StripePlan.findById(planId)
    if (!plan || !plan.active) {
      return next(createError(404, 'Active plan not found'))
    }

    if (plan.tier === 'free') {
      const user = await User.findById(req.user._id)
      user.tier = 'free'
      user.subscriptionStatus = 'inactive'
      user.stripeSubscriptionId = null
      user.subscriptionCurrentPeriodEnd = null
      user.cancelAtPeriodEnd = false
      await user.save({ validateBeforeSave: false })

      return res.status(200).json({
        status: 'success',
        message: 'Moved to free tier',
        data: {
          tier: 'free',
        },
      })
    }

    if (!plan.stripePriceId) {
      return next(createError(400, 'Selected plan is missing Stripe price configuration'))
    }

    const user = await User.findById(req.user._id)

    if (user.verificationStatus !== 'approved') {
      return next(createError(403, 'Identity verification is required before purchasing paid plans'))
    }

    const customerId = await ensureStripeCustomer(user)

    const successUrl = `${getFrontEndUrl()}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${getFrontEndUrl()}/settings?checkout=cancelled`

    const session = await stripeRequest('/checkout/sessions', {
      method: 'POST',
      data: {
        mode: 'subscription',
        customer: customerId,
        allow_promotion_codes: true,
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
          tier: plan.tier,
        },
      },
    })

    res.status(200).json({
      status: 'success',
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const syncCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) {
      return next(createError(400, 'sessionId is required'))
    }

    const session = await stripeRequest(`/checkout/sessions/${sessionId}`, {
      method: 'GET',
      query: {
        expand: ['subscription.items.data.price'],
      },
    })

    const sessionUserId = session?.metadata?.userId
    if (sessionUserId && sessionUserId !== req.user._id.toString()) {
      return next(createError(403, 'Checkout session does not belong to this user'))
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return next(createError(400, 'Checkout session is not complete yet'))
    }

    const user = await User.findById(req.user._id)

    const stripeSubscription = session.subscription
    if (!stripeSubscription) {
      await syncUserFromStripeSubscription(user, null, null)

      return res.status(200).json({
        status: 'success',
        data: {
          subscription: null,
          tier: user.tier,
        },
      })
    }

    const priceId = getSubscriptionPriceId(stripeSubscription)
    const plan = priceId
      ? await StripePlan.findOne({ stripePriceId: priceId })
      : null

    await syncUserFromStripeSubscription(user, stripeSubscription, plan)

    res.status(200).json({
      status: 'success',
      data: {
        tier: user.tier,
        subscription: {
          status: user.subscriptionStatus,
          currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
          cancelAtPeriodEnd: user.cancelAtPeriodEnd,
          stripeSubscriptionId: user.stripeSubscriptionId,
          plan: plan ? formatPlanResponse(plan) : null,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

export const createBillingPortalSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    const customerId = await ensureStripeCustomer(user)

    const portalSession = await stripeRequest('/billing_portal/sessions', {
      method: 'POST',
      data: {
        customer: customerId,
        return_url: `${getFrontEndUrl()}/settings`,
      },
    })

    res.status(200).json({
      status: 'success',
      data: {
        url: portalSession.url,
      },
    })
  } catch (error) {
    next(error)
  }
}

const getStripeCustomer = async (customerId) => {
  if (!customerId) return null
  return stripeRequest(`/customers/${customerId}`, { method: 'GET' })
}

const ensureDefaultPaymentMethod = async (customerId) => {
  if (!customerId) return null
  const customer = await getStripeCustomer(customerId)
  const currentDefault = customer?.invoice_settings?.default_payment_method || null
  if (currentDefault) return currentDefault

  const paymentMethods = await stripeRequest('/payment_methods', {
    method: 'GET',
    query: {
      customer: customerId,
      type: 'card',
      limit: 10,
    },
  })

  const firstMethod = paymentMethods?.data?.[0]
  if (!firstMethod) return null

  await stripeRequest(`/customers/${customerId}`, {
    method: 'POST',
    data: {
      invoice_settings: {
        default_payment_method: firstMethod.id,
      },
    },
  })

  return firstMethod.id
}

export const createSetupSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    const customerId = await ensureStripeCustomer(user)

    const successUrl = `${getFrontEndUrl()}/settings?setup=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${getFrontEndUrl()}/settings?setup=cancelled`

    const session = await stripeRequest('/checkout/sessions', {
      method: 'POST',
      data: {
        mode: 'setup',
        customer: customerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ['card'],
      },
    })

    res.status(200).json({
      status: 'success',
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getPaymentMethods = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user.stripeCustomerId) {
      return res.status(200).json({
        status: 'success',
        data: {
          defaultPaymentMethodId: null,
          paymentMethods: [],
        },
      })
    }

    const defaultPaymentMethodId = await ensureDefaultPaymentMethod(user.stripeCustomerId)
    const paymentMethods = await stripeRequest('/payment_methods', {
      method: 'GET',
      query: {
        customer: user.stripeCustomerId,
        type: 'card',
        limit: 20,
      },
    })

    res.status(200).json({
      status: 'success',
      data: {
        defaultPaymentMethodId,
        paymentMethods: paymentMethods?.data || [],
      },
    })
  } catch (error) {
    next(error)
  }
}

export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body
    if (!paymentMethodId) {
      return next(createError(400, 'paymentMethodId is required'))
    }

    const user = await User.findById(req.user._id)
    const customerId = await ensureStripeCustomer(user)

    await stripeRequest(`/customers/${customerId}`, {
      method: 'POST',
      data: {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      },
    })

    res.status(200).json({
      status: 'success',
      data: {
        defaultPaymentMethodId: paymentMethodId,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const removePaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.params
    if (!paymentMethodId) {
      return next(createError(400, 'paymentMethodId is required'))
    }

    await stripeRequest(`/payment_methods/${paymentMethodId}/detach`, {
      method: 'POST',
    })

    res.status(200).json({
      status: 'success',
      data: {
        removed: true,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getMySubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    const { subscription, plan } = await refreshAndResolveUserSubscription(user)
    const plans = await StripePlan.find({ active: true }).sort({ amount: 1, createdAt: -1 })

    res.status(200).json({
      status: 'success',
      data: {
        plans: plans.map(formatPlanResponse),
        subscription: subscription
          ? {
              status: user.subscriptionStatus,
              currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
              cancelAtPeriodEnd: user.cancelAtPeriodEnd,
              stripeSubscriptionId: user.stripeSubscriptionId,
              plan: plan ? formatPlanResponse(plan) : null,
            }
          : null,
        user: {
          tier: user.tier,
          verificationStatus: user.verificationStatus,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}
