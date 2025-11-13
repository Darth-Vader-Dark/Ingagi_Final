export type TierId = 'core' | 'pro' | 'enterprise'

export function isProOrAbove(tier?: TierId): boolean {
  return tier === 'pro' || tier === 'enterprise'
}

export function isEnterprise(tier?: TierId): boolean {
  return tier === 'enterprise'
}

export function hasFeature(tier?: TierId, feature: 'analytics' | 'ai' | 'customBranding' | 'customDomain' | 'prioritySupport' | 'advancedQR'): boolean {
  switch (feature) {
    case 'analytics':
    case 'advancedQR':
    case 'ai':
    case 'customDomain':
    case 'prioritySupport':
    case 'customBranding':
      return isProOrAbove(tier)
    default:
      return false
  }
}

export function employeesLimit(tier?: TierId): number {
  if (tier === 'enterprise') return Infinity
  if (tier === 'pro') return 20
  return 5
}

export function menuItemsLimit(tier?: TierId): number {
  if (tier === 'enterprise') return Infinity
  if (tier === 'pro') return 200
  return 50
}

