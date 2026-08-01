const STORAGE_KEYS = {
  freedomGoal: 'retirement_plan.freedom_goal',
  assets: 'retirement_plan.assets',
  museumCollections: 'retirement_plan.museum_collections',
  snapshots: 'retirement_plan.snapshots',
  reports: 'retirement_plan.reports',
  monthlyEssentialExpense: 'retirement_plan.monthly_essential_expense',
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

  keys: STORAGE_KEYS,
}
