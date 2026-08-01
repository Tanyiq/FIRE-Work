import {
  LivingCostCategories,
  LivingCostInput,
  LivingCostProfile,
  LivingCostSummary,
} from '../models/livingCost'
import { formatAmount } from '../utils/format'
import { storageService } from './storageService'

const isValidCost = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const hasValidCategories = (value: unknown): value is LivingCostCategories => {
  if (!isObject(value)) {
    return false
  }
  return (
    isValidCost(value.rent) &&
    isValidCost(value.food) &&
    isValidCost(value.transport) &&
    isValidCost(value.other)
  )
}

const calculateEssentialMonthlyCost = (input: LivingCostCategories): number =>
  Math.round((input.rent + input.food + input.transport + input.other) * 100) / 100

const normalizeProfile = (
  categories: LivingCostCategories,
  comfortableExtraCost: number,
  updatedAt: number,
): LivingCostProfile | null => {
  const essentialMonthlyCost = calculateEssentialMonthlyCost(categories)
  if (essentialMonthlyCost <= 0) {
    return null
  }
  return {
    ...categories,
    essentialMonthlyCost,
    comfortableExtraCost: Math.max(0, comfortableExtraCost),
    comfortableMonthlyCost: essentialMonthlyCost + Math.max(0, comfortableExtraCost),
    updatedAt,
  }
}

const saveMigratedProfile = (profile: LivingCostProfile): LivingCostProfile => {
  storageService.set(storageService.keys.livingCostProfile, profile)
  return profile
}

const migrateStoredProfile = (value: unknown): LivingCostProfile | null => {
  if (!hasValidCategories(value)) {
    return null
  }

  const record = value as unknown as Record<string, unknown>
  const categories: LivingCostCategories = {
    rent: value.rent,
    food: value.food,
    transport: value.transport,
    other: value.other,
  }
  const essentialMonthlyCost = calculateEssentialMonthlyCost(categories)
  const comfortableExtraCost = isValidCost(record.comfortableExtraCost)
    ? record.comfortableExtraCost
    : isValidCost(record.comfortableMonthlyCost)
      ? Math.max(0, record.comfortableMonthlyCost - essentialMonthlyCost)
      : 0
  const updatedAt = typeof record.updatedAt === 'number' ? record.updatedAt : Date.now()
  const profile = normalizeProfile(categories, comfortableExtraCost, updatedAt)
  if (!profile) {
    return null
  }

  const alreadyCurrent =
    isValidCost(record.essentialMonthlyCost) &&
    record.essentialMonthlyCost === profile.essentialMonthlyCost &&
    record.comfortableExtraCost === profile.comfortableExtraCost &&
    record.comfortableMonthlyCost === profile.comfortableMonthlyCost
  return alreadyCurrent ? profile : saveMigratedProfile(profile)
}

const migrateLegacyExpense = (): LivingCostProfile | null => {
  const legacyExpense = storageService.get<number>(
    storageService.keys.monthlyEssentialExpense,
  )
  if (!isValidCost(legacyExpense) || legacyExpense <= 0) {
    return null
  }
  const profile = normalizeProfile(
    { rent: 0, food: 0, transport: 0, other: legacyExpense },
    0,
    Date.now(),
  )
  return profile ? saveMigratedProfile(profile) : null
}

const getProfile = (): LivingCostProfile | null => {
  const storedProfile = storageService.get<unknown>(storageService.keys.livingCostProfile)
  return migrateStoredProfile(storedProfile) || migrateLegacyExpense()
}

const toSummary = (profile: LivingCostProfile): LivingCostSummary => ({
  ...profile,
  rentText: formatAmount(profile.rent),
  foodText: formatAmount(profile.food),
  transportText: formatAmount(profile.transport),
  otherText: formatAmount(profile.other),
  essentialMonthlyCostText: formatAmount(profile.essentialMonthlyCost),
  comfortableMonthlyCostText: formatAmount(profile.comfortableMonthlyCost),
  comfortableExtraCostText: formatAmount(profile.comfortableExtraCost),
})

export const livingCostService = {
  getProfile,

  getSummary(): LivingCostSummary | null {
    const profile = getProfile()
    return profile ? toSummary(profile) : null
  },

  calculateEssentialMonthlyCost,

  saveProfile(input: LivingCostInput): LivingCostProfile | null {
    if (
      !hasValidCategories(input) ||
      !isValidCost(input.comfortableExtraCost)
    ) {
      return null
    }

    const essentialMonthlyCost = calculateEssentialMonthlyCost(input)
    if (essentialMonthlyCost <= 0) {
      return null
    }

    const profile: LivingCostProfile = {
      ...input,
      essentialMonthlyCost,
      comfortableMonthlyCost: essentialMonthlyCost + input.comfortableExtraCost,
      updatedAt: Date.now(),
    }
    return storageService.set(storageService.keys.livingCostProfile, profile)
      ? profile
      : null
  },
}
