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
    description: 'Basic access for new advisors',
    features: [
      '2-3 Athlete profile visibility',
      'Upload verification documents',
      'Standard search placement',
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
    description: 'For growing advisors',
    features: [
      'Full athlete profile visibility',
      'Unlimited messaging',
      'Standard search placement',
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
    description: 'Ultimate tools for professional advisors',
    features: [
      'Full athlete profile visibility',
      'Unlimited messaging',
      'Unlimited connections',
      'Premium filters (Location, Interests, etc.)',
      'Premium algorithm visibility',
      'Exclusive Pro badge',
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
