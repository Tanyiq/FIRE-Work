export interface AssetSnapshot {
  id: string
  date: string
  totalAsset: number
  freedomLevel: string
  freedomProgress: number
  createdAt: number
}

export interface SnapshotGrowth {
  assetChange: number
  freedomChange: number
}

export type TrendRange = 'month' | 'year'

export interface AssetTrendPoint {
  label: string
  value: number
}

export interface RecentFreedomChange {
  assetChange: number
  assetChangeText: string
  progressFrom: number
  progressFromText: string
  progressTo: number
  progressToText: string
  museumAddedCount: number
}
