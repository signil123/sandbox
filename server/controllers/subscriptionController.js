import { createError } from '../error.js'
import StripePlan from '../models/StripePlan.js'
import User from '../models/User.js'
import { stripeRequest } from '../utils/stripeClient.js'

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid']
const GRACE_PERIOD_DAYS = 3
const TIER_ORDER = { free: 0, growth: 1, pro: 2 }

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

const FIXED_PLAN_TEMPLATES = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Limited visibility with verification entry point',
    amount: 0,
    currency: 'usd',
    features: [
      'Athlete profiles visible (limited to 2-3 example profiles)',
      'Explore shows 2-3 real athlete profiles; others blurred with upgrade prompt',
      'Connecting, messaging, and athlete social links are locked (upgrade required)',
      'Advisor profile not visible to athletes',
      'Verification upload enabled (required before Growth/Pro purchase)',
    ],
    active: true,
  },
  {
    tier: 'growth',
    name: 'Growth',
    description: 'Verified access with monthly connection limits',
    amount: 49,
    currency: 'usd',
    features: [
      'Verification required before purchase',
      'Athlete profiles and social accounts fully visible',
      'Advisor profile visible to athletes',
      'Connection requests: 15/mo; Connections accepted: 5/mo',
      'Unlimited messaging',
      'Standard placement + filters: Sport, School',
    ],
    active: true,
  },
  {
    tier: 'pro',
    name: 'Pro',
    description: 'Verified unlimited access with premium visibility',
    amount: 99,
    currency: 'usd',
    features: [
      'Verification required before purchase',
      'Athlete profiles and social accounts fully visible',
      'Advisor profile visible to athletes + Pro badge',
      'Unlimited connection requests and accepts',
      'Unlimited messaging',
      'Premium algorithm visibility',
      'Premium filters: Athlete Needs, Location, Grade Level, Interest, Experience',
    ],
    active: true,
  },
]

const FIXED_TIERS = new Set(FIXED_PLAN_TEMPLATES.map((plan) => plan.tier))

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

const ensureCustomerHasCard = async (customerId) => {
  const paymentMethods = await stripeRequest('/payment_methods', {
    method: 'GET',
    query: {
      customer: customerId,
      type: 'card',
      limit: 1,
    },
  })

  const hasCard = Array.isArray(paymentMethods?.data) && paymentMethods.data.length > 0
  return hasCard
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

  if (['past_due', 'unpaid'].includes(activeSubscription.status)) {
    const currentPeriodEnd = getCurrentPeriodEnd(activeSubscription)
    if (currentPeriodEnd) {
      const graceEnds = new Date(currentPeriodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
      if (Date.now() > graceEnds.getTime()) {
        try {
          await stripeRequest(`/subscriptions/${activeSubscription.id}`, { method: 'DELETE' })
        } catch {
          // Ignore cancellation errors and still downgrade locally.
        }
        await syncUserFromStripeSubscription(user, null, null)
        return {
          subscription: null,
          plan: null,
        }
      }
    }
  }

  await syncUserFromStripeSubscription(user, activeSubscription, matchingPlan)

  return {
    subscription: activeSubscription,
    plan: matchingPlan,
  }
}

const getStripeSubscription = async (subscriptionId) => {
  if (!subscriptionId) return null
  return stripeRequest(`/subscriptions/${subscriptionId}`, {
    method: 'GET',
    query: {
      expand: ['items.data.price'],
    },
  })
}

const createDowngradeSchedule = async (subscription, nextPriceId) => {
  const currentItem = subscription?.items?.data?.[0]
  const currentPriceId = currentItem?.price?.id || currentItem?.price
  const quantity = currentItem?.quantity || 1
  const startDate = subscription?.current_period_start
  const endDate = subscription?.current_period_end

  if (!currentPriceId || !startDate || !endDate) {
    throw createError(400, 'Unable to determine current subscription details for downgrade')
  }

  const schedule = await stripeRequest('/subscription_schedules', {
    method: 'POST',
    data: {
      from_subscription: subscription.id,
    },
  })

  await stripeRequest(`/subscription_schedules/${schedule.id}`, {
    method: 'POST',
    data: {
      end_behavior: 'release',
      phases: [
        {
          start_date: startDate,
          end_date: endDate,
          items: [{ price: currentPriceId, quantity }],
        },
        {
          start_date: endDate,
          items: [{ price: nextPriceId, quantity: 1 }],
        },
      ],
    },
  })
}

const upgradeSubscriptionNow = async (subscription, nextPriceId) => {
  const currentItem = subscription?.items?.data?.[0]
  if (!currentItem?.id) {
    throw createError(400, 'Unable to upgrade subscription without a current item')
  }

  await stripeRequest(`/subscriptions/${subscription.id}`, {
    method: 'POST',
    data: {
      cancel_at_period_end: false,
      proration_behavior: 'always_invoice',
      items: [
        {
          id: currentItem.id,
          price: nextPriceId,
        },
      ],
    },
  })
}

export const getAdminPlans = async (req, res, next) => {
  try {
    const plans = await ensureFixedAdminPlans(req.user?._id || null)

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

    if (!name || !tier || amount === undefined || amount === null) {
      return next(createError(400, 'name, tier and amount are required'))
    }

    if (!FIXED_TIERS.has(tier)) {
      return next(createError(400, 'tier must be one of: free, growth, pro'))
    }

    const existingTierPlan = await StripePlan.findOne({ tier })
    if (existingTierPlan) {
      return next(createError(400, `Plan for tier "${tier}" already exists. Use update instead.`))
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return next(createError(400, 'amount must be a positive number'))
    }

    const sanitizedFeatures = Array.isArray(features)
      ? features.map((feature) => String(feature).trim()).filter(Boolean)
      : []

    const plan = await StripePlan.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
      tier,
      amount: parsedAmount,
      currency: String(currency).toLowerCase().trim(),
      interval: 'month',
      features: sanitizedFeatures,
      active: Boolean(active),
      stripeProductId: null,
      stripePriceId: null,
      createdBy: req.user._id,
    })

    await ensureStripeStateForPlan(plan)
    await plan.save()

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

const createStripeProductForPlan = async (plan) => {
  return stripeRequest('/products', {
    method: 'POST',
    data: {
      name: String(plan.name || '').trim(),
      description: String(plan.description || '').trim(),
      active: Boolean(plan.active),
      metadata: {
        tier: plan.tier,
      },
    },
  })
}

const createStripePriceForPlan = async (plan, productId) => {
  return stripeRequest('/prices', {
    method: 'POST',
    data: {
      currency: String(plan.currency || 'usd').toLowerCase().trim(),
      unit_amount: Math.round(Number(plan.amount) * 100),
      recurring: {
        interval: 'month',
      },
      product: productId,
      metadata: {
        tier: plan.tier,
      },
    },
  })
}

const ensureStripeStateForPlan = async (plan, { forceNewPrice = false } = {}) => {
  if (plan.tier === 'free') {
    plan.stripeProductId = null
    plan.stripePriceId = null
    plan.amount = 0
    return
  }

  if (!Number.isFinite(plan.amount) || plan.amount <= 0) {
    throw createError(400, `Paid plan "${plan.tier}" must have amount greater than 0`)
  }

  let product = null

  if (plan.stripeProductId) {
    try {
      product = await stripeRequest(`/products/${plan.stripeProductId}`, { method: 'GET' })
    } catch (error) {
      if (!isStripeResourceMissing(error)) throw error
      plan.stripeProductId = null
      plan.stripePriceId = null
    }
  }

  if (!product) {
    product = await createStripeProductForPlan(plan)
    plan.stripeProductId = product.id
  } else {
    await stripeRequest(`/products/${plan.stripeProductId}`, {
      method: 'POST',
      data: {
        name: String(plan.name || '').trim(),
        description: String(plan.description || '').trim(),
        active: Boolean(plan.active),
        metadata: {
          tier: plan.tier,
        },
      },
    })
  }

  let shouldCreateNewPrice = Boolean(forceNewPrice) || !plan.stripePriceId
  if (plan.stripePriceId) {
    try {
      const existingPrice = await stripeRequest(`/prices/${plan.stripePriceId}`, { method: 'GET' })
      const expectedUnitAmount = Math.round(Number(plan.amount) * 100)
      const expectedCurrency = String(plan.currency || 'usd').toLowerCase().trim()
      const priceProductId = existingPrice?.product?.id || existingPrice?.product
      const isSameProduct = priceProductId === plan.stripeProductId
      const isSameAmount = Number(existingPrice?.unit_amount) === expectedUnitAmount
      const isSameCurrency = String(existingPrice?.currency || '').toLowerCase() === expectedCurrency
      const isMonthly = existingPrice?.recurring?.interval === 'month'

      if (!isSameProduct || !isSameAmount || !isSameCurrency || !isMonthly) {
        shouldCreateNewPrice = true
      }
    } catch (error) {
      if (!isStripeResourceMissing(error)) throw error
      shouldCreateNewPrice = true
    }
  }

  if (shouldCreateNewPrice) {
    const price = await createStripePriceForPlan(plan, plan.stripeProductId)
    plan.stripePriceId = price.id
  }
}

const ensureFixedAdminPlans = async (createdBy = null) => {
  const plans = []

  for (const template of FIXED_PLAN_TEMPLATES) {
    let plan = await StripePlan.findOne({ tier: template.tier }).sort({ createdAt: 1 })

    if (!plan) {
      plan = await StripePlan.create({
        ...template,
        interval: 'month',
        createdBy,
      })
    } else {
      if (!plan.name) plan.name = template.name
      if (!plan.currency) plan.currency = template.currency
      if (!plan.interval) plan.interval = 'month'
      if (!Array.isArray(plan.features)) plan.features = template.features
      if (plan.tier === 'free') plan.amount = 0
    }

    await ensureStripeStateForPlan(plan)

    if (plan.isModified()) {
      await plan.save()
    }

    plans.push(plan)
  }

  return plans
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

    if (active !== undefined) plan.active = Boolean(active)

    if (description !== undefined) plan.description = String(description || '').trim()

    if (features !== undefined) {
      plan.features = Array.isArray(features)
        ? features.map((feature) => String(feature).trim()).filter(Boolean)
        : []
    }

    if (parsedAmount !== null) {
      if (plan.tier !== 'free' && parsedAmount <= 0) {
        return next(createError(400, 'Paid plans must have amount greater than 0'))
      }
      plan.amount = parsedAmount
    }

    await ensureStripeStateForPlan(plan, { forceNewPrice: parsedAmount !== null })
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

    const user = await User.findById(req.user._id)

    if (plan.tier === 'free') {
      if (user.stripeSubscriptionId) {
        const existingSubscription = await getStripeSubscription(user.stripeSubscriptionId)
        if (existingSubscription) {
          await stripeRequest(`/subscriptions/${existingSubscription.id}`, {
            method: 'POST',
            data: {
              cancel_at_period_end: true,
            },
          })
          user.cancelAtPeriodEnd = true
          await user.save({ validateBeforeSave: false })
        }
      }

      return res.status(200).json({
        status: 'success',
        message: 'Downgrade scheduled for end of billing period',
        data: {
          tier: user.tier || 'free',
          cancelAtPeriodEnd: true,
        },
      })
    }

    if (user.verificationStatus !== 'approved') {
      return next(createError(403, 'Identity verification is required before purchasing paid plans'))
    }

    if (!plan.stripePriceId) {
      return next(createError(400, 'Selected plan is missing Stripe price configuration'))
    }

    const customerId = await ensureStripeCustomer(user)

    if (user.stripeSubscriptionId) {
      const existingSubscription = await getStripeSubscription(user.stripeSubscriptionId)
      if (existingSubscription) {
        const currentPriceId = existingSubscription?.items?.data?.[0]?.price?.id
        const currentTier = (await StripePlan.findOne({ stripePriceId: currentPriceId }))?.tier
        const currentRank = TIER_ORDER[currentTier] ?? 0
        const targetRank = TIER_ORDER[plan.tier] ?? 0

        if (targetRank === currentRank) {
          return next(createError(400, 'You are already on this plan'))
        }

        if (targetRank > currentRank) {
          const hasCard = await ensureCustomerHasCard(customerId)
          if (!hasCard) {
            return next(createError(400, 'Add a card before upgrading to a paid plan'))
          }
          await upgradeSubscriptionNow(existingSubscription, plan.stripePriceId)
          return res.status(200).json({
            status: 'success',
            message: 'Plan upgraded instantly',
            data: {
              tier: plan.tier,
            },
          })
        }

        await createDowngradeSchedule(existingSubscription, plan.stripePriceId)
        return res.status(200).json({
          status: 'success',
          message: 'Downgrade scheduled for end of billing period',
          data: {
            tier: plan.tier,
          },
        })
      }
    }

    const hasCard = await ensureCustomerHasCard(customerId)
    if (!hasCard) {
      return next(createError(400, 'Add a card before purchasing a paid plan'))
    }

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

export const createSetupIntent = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    const customerId = await ensureStripeCustomer(user)

    const setupIntent = await stripeRequest('/setup_intents', {
      method: 'POST',
      data: {
        customer: customerId,
        usage: 'off_session',
        payment_method_types: ['card'],
      },
    })

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: setupIntent.client_secret,
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
