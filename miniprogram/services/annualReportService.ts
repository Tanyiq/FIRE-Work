import {
  AnnualLifeHighlight,
  AnnualWealthReport,
} from '../models/annualReport'
import { MuseumCollection, MuseumCollectionType } from '../models/museum'
import { formatAmount, formatSignedAmount } from '../utils/format'
import { investmentService } from './investmentService'
import { freedomService } from './freedomService'
import { museumService } from './museumService'
import { snapshotService } from './snapshotService'

const LIFE_ICONS: Record<MuseumCollectionType, string> = {
  physical: '📦',
  experience: '✈️',
  life_event: '✦',
  income_event: '↗',
}

const getYearRange = (year: number): { start: number; end: number } => ({
  start: new Date(year, 0, 1).getTime(),
  end: new Date(year + 1, 0, 1).getTime() - 1,
})

const formatFreedomIndex = (value: number): string => `Lv${value.toFixed(1)}`

const getYearEndDate = (year: number): string => {
  const currentYear = new Date().getFullYear()
  if (year === currentYear) return museumService.getToday()
  return `${year}-12-31`
}

const getCompanionDays = (collection: MuseumCollection, year: number): number => {
  const referenceDate = getYearEndDate(year)
  const boundedCollection =
    collection.status === 'retired' && collection.retiredDate && collection.retiredDate <= referenceDate
      ? collection
      : { ...collection, status: 'active' as const, retiredDate: null }
  return museumService.calculateUsageDays(boundedCollection, referenceDate)
}

const getLargestLifeSpending = (
  collections: MuseumCollection[],
  year: number,
): AnnualLifeHighlight | null => {
  const spendingCollections = collections.filter((item) => item.type !== 'income_event')
  if (spendingCollections.length === 0) return null
  const largest = spendingCollections.reduce((current, item) =>
    item.amount > current.amount ? item : current,
  )
  return {
    id: largest.id,
    icon: LIFE_ICONS[largest.type],
    name: largest.name,
    amount: largest.amount,
    amountText: formatAmount(largest.amount),
    companionDays: getCompanionDays(largest, year),
  }
}

export const annualReportService = {
  getAvailableYears(): number[] {
    const years = new Set<number>([new Date().getFullYear()])
    snapshotService.getSnapshotList().forEach((item) => years.add(Number(item.date.slice(0, 4))))
    museumService.getCollectionList().forEach((item) => years.add(new Date(item.createdAt).getFullYear()))
    investmentService.getRecordList().forEach((item) => years.add(new Date(item.createdAt).getFullYear()))
    return Array.from(years).filter(Number.isFinite).sort((a, b) => b - a)
  },

  getAnnualReport(year: number): AnnualWealthReport {
    const range = getYearRange(year)
    const snapshots = snapshotService
      .getSnapshotList()
      .filter((item) => item.createdAt >= range.start && item.createdAt <= range.end)
    const collections = museumService
      .getCollectionList()
      .filter((item) => item.createdAt >= range.start && item.createdAt <= range.end)
    const investments = investmentService
      .getRecordList()
      .filter((item) => item.createdAt >= range.start && item.createdAt <= range.end)
    const startSnapshot = snapshots[0] || null
    const endSnapshot = snapshots[snapshots.length - 1] || null
    const assetGrowth = startSnapshot && endSnapshot
      ? Math.round((endSnapshot.totalAsset - startSnapshot.totalAsset) * 100) / 100
      : null
    const startFreedomIndex = startSnapshot
      ? freedomService.calculateContinuousFreedomIndex(startSnapshot.totalAsset)
      : null
    const endFreedomIndex = endSnapshot
      ? freedomService.calculateContinuousFreedomIndex(endSnapshot.totalAsset)
      : null
    const lessons = investments.filter((item) => item.lesson.trim())
    const lessonRecord = lessons.length > 0
      ? lessons.reduce((current, item) => {
          const currentChange = Math.abs(current.currentAmount - current.investedAmount)
          const itemChange = Math.abs(item.currentAmount - item.investedAmount)
          return itemChange > currentChange ? item : current
        })
      : null

    return {
      year,
      title: `${year} 我的财富年度回顾`,
      snapshotCount: snapshots.length,
      hasWealthData: Boolean(startSnapshot),
      hasWealthChange: snapshots.length > 1,
      startAsset: startSnapshot?.totalAsset ?? null,
      startAssetText: startSnapshot ? formatAmount(startSnapshot.totalAsset) : '暂无快照',
      endAsset: endSnapshot?.totalAsset ?? null,
      endAssetText: endSnapshot ? formatAmount(endSnapshot.totalAsset) : '暂无快照',
      assetGrowth,
      assetGrowthText: assetGrowth === null ? '暂无可比数据' : formatSignedAmount(assetGrowth),
      startFreedomIndex,
      startFreedomText: startFreedomIndex === null ? '暂无' : formatFreedomIndex(startFreedomIndex),
      endFreedomIndex,
      endFreedomText: endFreedomIndex === null ? '暂无' : formatFreedomIndex(endFreedomIndex),
      assetUpdateCount: snapshots.length,
      investmentRecordCount: investments.length,
      museumCollectionCount: collections.length,
      largestLifeSpending: getLargestLifeSpending(collections, year),
      investmentReview: {
        recordCount: investments.length,
        reviewedCount: lessons.length,
        biggestLesson: lessonRecord?.lesson || null,
        lessonRecordName: lessonRecord?.name || null,
      },
    }
  },
}
