import { AssetType } from './asset'

export interface WealthHealthStructureItem {
  type: AssetType
  label: string
  amount: number
  amountText: string
  ratio: number
  ratioPercent: number
  ratioText: string
}

export interface WealthHealthTrend {
  hasHistory: boolean
  assetGrowthRate: number | null
  assetGrowthRateText: string
  freedomProgressChange: number | null
  freedomProgressChangeText: string
  periodLabel: string
}

export interface WealthHealthReport {
  hasAssets: boolean
  profileType: string
  totalAsset: number
  totalAssetText: string
  cashAsset: number
  cashAssetText: string
  monthlyEssentialExpense: number | null
  monthlyEssentialExpenseText: string | null
  safetyMonths: number | null
  safetyMonthsText: string | null
  safeAssetRatio: number
  safeAssetRatioText: string
  growthAssetRatio: number
  growthAssetRatioText: string
  otherAssetRatio: number
  otherAssetRatioText: string
  structure: WealthHealthStructureItem[]
  concentrationRisks: string[]
  trend: WealthHealthTrend
  advantages: string[]
  reminders: string[]
}
