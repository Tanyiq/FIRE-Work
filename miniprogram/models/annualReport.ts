export interface AnnualLifeHighlight {
  id: string
  icon: string
  name: string
  amount: number
  amountText: string
  companionDays: number
}

export interface AnnualInvestmentReview {
  recordCount: number
  reviewedCount: number
  biggestLesson: string | null
  lessonRecordName: string | null
}

export interface AnnualWealthReport {
  year: number
  title: string
  snapshotCount: number
  hasWealthData: boolean
  hasWealthChange: boolean
  startAsset: number | null
  startAssetText: string
  endAsset: number | null
  endAssetText: string
  assetGrowth: number | null
  assetGrowthText: string
  startFreedomIndex: number | null
  startFreedomText: string
  endFreedomIndex: number | null
  endFreedomText: string
  assetUpdateCount: number
  investmentRecordCount: number
  museumCollectionCount: number
  largestLifeSpending: AnnualLifeHighlight | null
  investmentReview: AnnualInvestmentReview
}
