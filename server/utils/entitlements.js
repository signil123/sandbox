const STANDARD_ACCESS_TIERS = new Set(['growth', 'pro'])
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
export const isAthlete = (user) => user?.userType === 'athlete'

export const getResolvedTierLimits = (tier = 'free') => TIER_LIMITS[tier] || TIER_LIMITS.free

export const getUserEntitlements = (user) => {
  const advisorOrAgent = isAdvisorOrAgent(user)
  const athlete = isAthlete(user)
  const tier = user?.tier || 'free'
  const isGrowth = tier === 'growth'
  const isPro = tier === 'pro'
  const hasStandardAccess = STANDARD_ACCESS_TIERS.has(tier)
  const hasPremiumAccess = PREMIUM_TIERS.has(tier)

  if (athlete) {
    return {
      tier,
      canAccessSubscriptionUi: false,
      canViewFullAthleteProfiles: true,
      canViewAthleteSocials: true,
      canConnectWithAthlete: true,
      canMessageAthlete: true,
      canUseStandardFilters: true,
      canUsePremiumFilters: true,
      canBeVisibleToAthletes: false,
      shouldBlurAthleteProfiles: false,
      limits: getResolvedTierLimits(tier),
      isGrowth,
      isPro,
    }
  }

  if (!advisorOrAgent) {
    return {
      tier,
      canAccessSubscriptionUi: false,
      canViewFullAthleteProfiles: true,
      canViewAthleteSocials: true,
      canConnectWithAthlete: true,
      canMessageAthlete: true,
      canUseStandardFilters: true,
      canUsePremiumFilters: true,
      canBeVisibleToAthletes: true,
      shouldBlurAthleteProfiles: false,
      limits: getResolvedTierLimits(tier),
      isGrowth,
      isPro,
    }
  }

  return {
    tier,
    canAccessSubscriptionUi: true,
    canViewFullAthleteProfiles: hasStandardAccess,
    canViewAthleteSocials: hasStandardAccess,
    canConnectWithAthlete: hasStandardAccess,
    canMessageAthlete: hasStandardAccess,
    canUseStandardFilters: hasStandardAccess,
    canUsePremiumFilters: hasPremiumAccess,
    canBeVisibleToAthletes: hasStandardAccess,
    shouldBlurAthleteProfiles: !hasStandardAccess,
    limits: getResolvedTierLimits(tier),
    isGrowth,
    isPro,
  }
}

export const canAccessSubscriptionUi = (user) => getUserEntitlements(user).canAccessSubscriptionUi
export const canViewFullAthleteProfiles = (user) => getUserEntitlements(user).canViewFullAthleteProfiles
export const canViewAthleteSocials = (user) => getUserEntitlements(user).canViewAthleteSocials
export const canConnectWithAthlete = (user) => getUserEntitlements(user).canConnectWithAthlete
export const canMessageAthlete = (user) => getUserEntitlements(user).canMessageAthlete
export const isPremiumFilterAllowed = (user, _filterKey) => getUserEntitlements(user).canUsePremiumFilters
export const isStandardFilterAllowed = (user, _filterKey) => getUserEntitlements(user).canUseStandardFilters
export const canBeVisibleToAthletes = (user) => getUserEntitlements(user).canBeVisibleToAthletes
export const shouldBlurAthleteProfiles = (user) => getUserEntitlements(user).shouldBlurAthleteProfiles
