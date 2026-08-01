const STORAGE_KEYS = {
  freedomGoal: 'retirement_plan.freedom_goal',
  assets: 'retirement_plan.assets',
  museumCollections: 'retirement_plan.museum_collections',
  snapshots: 'retirement_plan.snapshots',
  reports: 'retirement_plan.reports',
  monthlyEssentialExpense: 'retirement_plan.monthly_essential_expense',
  livingCostProfile: 'retirement_plan.living_cost_profile',
  profileJoinedAt: 'retirement_plan.profile_joined_at',
  lastBackupAt: 'retirement_plan.last_backup_at',
  investmentRecords: 'retirement_plan.investment_records',
  investmentRecordsUpdatedAt: 'retirement_plan.investment_records_updated_at',
  themeProfile: 'retirement_plan.theme_profile',
  onboardingFlow: 'retirement_plan.onboarding_flow',
} as const

export const storageService = {
  get<T>(key: string): T | null {
    try {
      const value: unknown = wx.getStorageSync(key)
      return value === undefined || value === null || value === '' ? null : (value as T)
    } catch (_error) {
      return null
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      wx.setStorageSync(key, value)
      return true
    } catch (_error) {
      return false
    }
  },

  remove(key: string): boolean {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (_error) {
      return false
    }
  },

  keys: STORAGE_KEYS,
}
