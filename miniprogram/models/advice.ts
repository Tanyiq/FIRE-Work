export type WealthAdviceSource =
  | 'living_cost'
  | 'asset_structure'
  | 'wealth_trend'
  | 'investment_review'
  | 'data_freshness'

export interface WealthAdviceItem {
  id: string
  title: string
  message: string
  source: WealthAdviceSource
  sourceLabel: string
}

export interface WealthAdviceReport {
  stateType: string
  summary: string
  hasAssets: boolean
  totalAssetText: string
  yearGrowthText: string
  safetyMonthsText: string
  safeAssetRatioText: string
  investmentRecordCount: number
  lastAssetUpdateText: string
  advantages: WealthAdviceItem[]
  concerns: WealthAdviceItem[]
}
