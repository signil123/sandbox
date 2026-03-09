// File: client/src/constants/tiers.js

export const TIERS = {
  FREE: 'free',
  GROWTH: 'growth',
  PRO: 'pro',
}

export const TIER_DETAILS = {
  [TIERS.FREE]: {
    name: 'Free',
    price: '$0',
    description: 'Limited athlete access with verification entry point',
    features: [
      '2-3 athlete profiles visible in Explore',
      'Blurred athlete profiles with upgrade prompt',
      'Connect, message, and social links locked',
      'Upload verification documents',
      'Advisor profile hidden from athletes',
    ],
    limits: {
      connectionsSent: 0,
      connectionsAccepted: 0,
      messaging: false,
    },
  },
  [TIERS.GROWTH]: {
    name: 'Growth',
    price: '$49/mo',
    description: 'Verified access with monthly connection limits',
    features: [
      'Full athlete profile visibility',
      'Athlete social media visible',
      'Advisor profile visible to athletes',
      '15 connection requests per month',
      '5 accepted connections per month',
      'Unlimited messaging',
      'Basic filters (Sport, School)',
    ],
    limits: {
      connectionsSent: 15,
      connectionsAccepted: 5,
      messaging: true,
    },
  },
  [TIERS.PRO]: {
    name: 'Pro',
    price: '$99/mo',
    description: 'Verified unlimited access with premium visibility',
    features: [
      'Full athlete profile visibility',
      'Athlete social media visible',
      'Advisor profile visible to athletes',
      'Unlimited messaging',
      'Unlimited connections',
      'Premium filters (Needs, Location, Grade, Interest, Experience)',
      'Premium algorithm visibility',
      'Pro badge',
    ],
    limits: {
      connectionsSent: Infinity,
      connectionsAccepted: Infinity,
      messaging: true,
    },
  },
}

export const VERIFICATION_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}
