import StripePlan from '../models/StripePlan.js'
import { stripeRequest } from '../utils/stripeClient.js'

const DEFAULT_PLANS = [
  {
    tier: 'free',
    name: 'Free',
    description: 'Limited visibility with verification entry point',
    amount: 0,
    currency: 'usd',
    features: [
      'Athlete profiles visible (limited to 2–3 example profiles)',
      'Explore shows 2–3 real athlete profiles; others blurred with upgrade prompt',
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

const createStripeProductAndPrice = async (plan) => {
  if (plan.tier === 'free') {
    return { stripeProductId: null, stripePriceId: null }
  }

  const product = await stripeRequest('/products', {
    method: 'POST',
    data: {
      name: plan.name,
      description: plan.description,
      active: Boolean(plan.active),
      metadata: {
        tier: plan.tier,
        seeded: 'true',
      },
    },
  })

  const price = await stripeRequest('/prices', {
    method: 'POST',
    data: {
      currency: plan.currency,
      unit_amount: Math.round(plan.amount * 100),
      recurring: {
        interval: 'month',
      },
      product: product.id,
      metadata: {
        tier: plan.tier,
        seeded: 'true',
      },
    },
  })

  return { stripeProductId: product.id, stripePriceId: price.id }
}

const isStripeResourceMissing = (error) => {
  if (error?.statusCode === 404 || error?.details?.code === 'resource_missing') return true
  const message = String(error?.message || '')
  return message.includes('No such product') || message.includes('No such price')
}

const ensureStripeForPlan = async (plan, template) => {
  if (plan.tier === 'free') {
    plan.stripeProductId = null
    plan.stripePriceId = null
    return plan
  }

  let productExists = false
  let priceExists = false

  if (plan.stripeProductId) {
    try {
      await stripeRequest(`/products/${plan.stripeProductId}`, { method: 'GET' })
      productExists = true
    } catch (error) {
      if (!isStripeResourceMissing(error)) throw error
    }
  }

  if (plan.stripePriceId) {
    try {
      await stripeRequest(`/prices/${plan.stripePriceId}`, { method: 'GET' })
      priceExists = true
    } catch (error) {
      if (!isStripeResourceMissing(error)) throw error
    }
  }

  if (productExists && priceExists) {
    return plan
  }

  // Reset plan details to template when Stripe resources are missing
  plan.name = template.name
  plan.description = template.description
  plan.amount = template.amount
  plan.currency = template.currency
  plan.features = template.features
  plan.active = template.active
  plan.interval = 'month'

  const { stripeProductId, stripePriceId } = await createStripeProductAndPrice(template)
  plan.stripeProductId = stripeProductId
  plan.stripePriceId = stripePriceId

  return plan
}

export const seedStripePlans = async () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY missing; skipping Stripe plan seed')
    return
  }

  const existingPlans = await StripePlan.find()
  const existingByTier = new Map(existingPlans.map((plan) => [plan.tier, plan]))

  for (const template of DEFAULT_PLANS) {
    const existingPlan = existingByTier.get(template.tier)

    if (!existingPlan) {
      const { stripeProductId, stripePriceId } = await createStripeProductAndPrice(template)

      await StripePlan.create({
        ...template,
        stripeProductId,
        stripePriceId,
        interval: 'month',
      })
      continue
    }

    const updatedPlan = await ensureStripeForPlan(existingPlan, template)
    if (updatedPlan.isModified()) {
      await updatedPlan.save()
    }
  }
}
