import { MuseumCollectionView } from './museum'

export type WealthChangeSource =
  | 'salary_saving'
  | 'investment_return'
  | 'income_increase'
  | 'large_expense'
  | 'other'

export interface WealthReport {
  id: string
  date: string
  assetChange: number
  freedomChange: number
  summary: string
  changeSource: WealthChangeSource
  createdAt: number
}

export interface WealthChangeSourceOption {
  value: WealthChangeSource
  label: string
}

export interface WealthReportView {
  title: string
  previousDate: string
  currentDate: string
  previousAsset: number
  previousAssetText: string
  currentAsset: number
  currentAssetText: string
  assetChange: number
  assetChangeText: string
  previousFreedomLevel: string
  currentFreedomLevel: string
  previousFreedomProgress: number
  previousFreedomProgressText: string
  currentFreedomProgress: number
  currentFreedomProgressText: string
  freedomChange: number
  distanceChange: number
  distanceChangeText: string
  changeSourceLabel: string
  addedCollections: MuseumCollectionView[]
  summary: string
}
