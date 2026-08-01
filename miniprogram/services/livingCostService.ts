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
  comfortableMonthlyCost: number,
  updatedAt: number,
): LivingCostProfile | null => {
  const essentialMonthlyCost = calculateEssentialMonthlyCost(categories)
  if (essentialMonthlyCost <= 0) {
    return null
  }
  return {
    ...categories,
    essentialMonthlyCost,
    comfortableMonthlyCost: Math.max(essentialMonthlyCost, comfortableMonthlyCost),
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
  const comfortableMonthlyCost = isValidCost(record.comfortableMonthlyCost)
    ? record.comfortableMonthlyCost
    : essentialMonthlyCost
  const updatedAt = typeof record.updatedAt === 'number' ? record.updatedAt : Date.now()
  const profile = normalizeProfile(categories, comfortableMonthlyCost, updatedAt)
  if (!profile) {
    return null
  }

  const alreadyCurrent =
    isValidCost(record.essentialMonthlyCost) &&
    record.essentialMonthlyCost === profile.essentialMonthlyCost &&
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
    legacyExpense,
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
      !isValidCost(input.comfortableMonthlyCost)
    ) {
      return null
    }

    const essentialMonthlyCost = calculateEssentialMonthlyCost(input)
    if (
      essentialMonthlyCost <= 0 ||
      input.comfortableMonthlyCost < essentialMonthlyCost
    ) {
      return null
    }

    const profile: LivingCostProfile = {
      ...input,
      essentialMonthlyCost,
      updatedAt: Date.now(),
    }
    return storageService.set(storageService.keys.livingCostProfile, profile)
      ? profile
      : null
  },
}
