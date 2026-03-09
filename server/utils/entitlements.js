const PRO_TIERS = new Set(['growth', 'pro'])
const PREMIUM_TIERS = new Set(['pro'])

export const TIER_LIMITS = {
  free: {
    connectionRequestsSent: 0,
    connectionsAccepted: 0,
    messaging: false,
  },
  growth: {
    connectionRequestsSent: 15,
    connectionsAccepted: 5,
    messaging: true,
  },
  pro: {
    connectionRequestsSent: null,
    connectionsAccepted: null,
    messaging: true,
  },
}

export const isAdvisorOrAgent = (user) => ['advisor', 'agent'].includes(user?.userType)

export const canViewFullAthleteProfiles = (user) => {
  if (!isAdvisorOrAgent(user)) return true
  return PRO_TIERS.has(user?.tier)
}

export const canViewAthleteSocials = (user) => {
  if (!isAdvisorOrAgent(user)) return true
  return PRO_TIERS.has(user?.tier)
}

export const canConnectWithAthlete = (user) => {
  if (!isAdvisorOrAgent(user)) return true
  return PRO_TIERS.has(user?.tier)
}

export const canMessageAthlete = (user) => {
  if (!isAdvisorOrAgent(user)) return true
  return PRO_TIERS.has(user?.tier)
}

export const isPremiumFilterAllowed = (user, _filterKey) => {
  if (!isAdvisorOrAgent(user)) return true
  return PREMIUM_TIERS.has(user?.tier)
}

export const isStandardFilterAllowed = (user, _filterKey) => {
  if (!isAdvisorOrAgent(user)) return true
  return PRO_TIERS.has(user?.tier)
}

export const getResolvedTierLimits = (tier = 'free') => TIER_LIMITS[tier] || TIER_LIMITS.free
