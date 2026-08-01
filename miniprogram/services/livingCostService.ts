import {
  LivingCostInput,
  LivingCostProfile,
  LivingCostSummary,
} from '../models/livingCost'
import { formatAmount } from '../utils/format'
import { storageService } from './storageService'

const isValidCost = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const calculateMonthlyTotal = (input: LivingCostInput): number =>
  Math.round((input.rent + input.food + input.transport + input.other) * 100) / 100

const calculateFireReferenceAsset = (monthlyTotal: number): number =>
  Math.round(monthlyTotal * 12 * 25 * 100) / 100

const isProfile = (value: unknown): value is LivingCostProfile => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const profile = value as LivingCostProfile
  return (
    isValidCost(profile.rent) &&
    isValidCost(profile.food) &&
    isValidCost(profile.transport) &&
    isValidCost(profile.other) &&
    isValidCost(profile.monthlyTotal) &&
    isValidCost(profile.fireReferenceAsset) &&
    typeof profile.updatedAt === 'number'
  )
}

const getProfile = (): LivingCostProfile | null => {
  const storedProfile = storageService.get<unknown>(storageService.keys.livingCostProfile)
  if (isProfile(storedProfile) && storedProfile.monthlyTotal > 0) {
    const input: LivingCostInput = {
      rent: storedProfile.rent,
      food: storedProfile.food,
      transport: storedProfile.transport,
      other: storedProfile.other,
    }
    const monthlyTotal = calculateMonthlyTotal(input)
    return monthlyTotal > 0
      ? {
          ...input,
          monthlyTotal,
          fireReferenceAsset: calculateFireReferenceAsset(monthlyTotal),
          updatedAt: storedProfile.updatedAt,
        }
      : null
  }

  const legacyExpense = storageService.get<number>(
    storageService.keys.monthlyEssentialExpense,
  )
  if (isValidCost(legacyExpense) && legacyExpense > 0) {
    return {
      rent: 0,
      food: 0,
      transport: 0,
      other: legacyExpense,
      monthlyTotal: legacyExpense,
      fireReferenceAsset: calculateFireReferenceAsset(legacyExpense),
      updatedAt: 0,
    }
  }

  return null
}

const toSummary = (profile: LivingCostProfile): LivingCostSummary => ({
  ...profile,
  rentText: formatAmount(profile.rent),
  foodText: formatAmount(profile.food),
  transportText: formatAmount(profile.transport),
  otherText: formatAmount(profile.other),
  monthlyTotalText: formatAmount(profile.monthlyTotal),
  fireReferenceAssetText: formatAmount(profile.fireReferenceAsset),
})

export const livingCostService = {
  getProfile,

  getSummary(): LivingCostSummary | null {
    const profile = getProfile()
    return profile ? toSummary(profile) : null
  },

  calculateMonthlyTotal,
  calculateFireReferenceAsset,

  saveProfile(input: LivingCostInput): LivingCostProfile | null {
    if (
      !isValidCost(input.rent) ||
      !isValidCost(input.food) ||
      !isValidCost(input.transport) ||
      !isValidCost(input.other)
    ) {
      return null
    }

    const monthlyTotal = calculateMonthlyTotal(input)
    if (monthlyTotal <= 0) {
      return null
    }

    const profile: LivingCostProfile = {
      ...input,
      monthlyTotal,
      fireReferenceAsset: calculateFireReferenceAsset(monthlyTotal),
      updatedAt: Date.now(),
    }
    return storageService.set(storageService.keys.livingCostProfile, profile)
      ? profile
      : null
  },
}
