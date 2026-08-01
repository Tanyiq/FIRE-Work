import {
  AssetSnapshot,
  AssetTrendPoint,
  RecentFreedomChange,
  SnapshotGrowth,
  TrendRange,
} from '../models/snapshot'
import { assetService } from './assetService'
import { freedomService } from './freedomService'
import { museumService } from './museumService'
import { storageService } from './storageService'
import { formatProgress, formatSignedAmount } from '../utils/format'

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
const MONTH_IN_MILLISECONDS = 31 * DAY_IN_MILLISECONDS
const YEAR_IN_MILLISECONDS = 366 * DAY_IN_MILLISECONDS

const padNumber = (value: number): string => String(value).padStart(2, '0')

const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`

const isSnapshot = (value: unknown): value is AssetSnapshot => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const snapshot = value as AssetSnapshot
  return (
    typeof snapshot.id === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(snapshot.date) &&
    typeof snapshot.totalAsset === 'number' &&
    Number.isFinite(snapshot.totalAsset) &&
    snapshot.totalAsset >= 0 &&
    typeof snapshot.freedomLevel === 'string' &&
    typeof snapshot.freedomProgress === 'number' &&
    snapshot.freedomProgress >= 0 &&
    snapshot.freedomProgress <= 1 &&
    typeof snapshot.createdAt === 'number'
  )
}

const saveSnapshotList = (snapshots: AssetSnapshot[]): boolean =>
  storageService.set(storageService.keys.snapshots, snapshots)

const createSnapshotId = (): string =>
  `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const getSnapshotList = (): AssetSnapshot[] => {
  const storedSnapshots = storageService.get<unknown>(storageService.keys.snapshots)
  if (!Array.isArray(storedSnapshots)) {
    return []
  }

  const snapshots = storedSnapshots
    .filter(isSnapshot)
    .map((snapshot) => ({ ...snapshot }))
    .sort((a, b) => a.createdAt - b.createdAt)

  return snapshots.reduce<AssetSnapshot[]>((result, snapshot) => {
    const existingIndex = result.findIndex((item) => item.date === snapshot.date)
    if (existingIndex < 0) {
      result.push(snapshot)
      return result
    }

    const existing = result[existingIndex]
    result[existingIndex] = {
      ...snapshot,
      id: existing.id,
      createdAt: Math.min(existing.createdAt, snapshot.createdAt),
    }
    return result
  }, [])
}

const calculateGrowthFromSnapshots = (snapshots: AssetSnapshot[]): SnapshotGrowth => {
  if (snapshots.length < 2) {
    return { assetChange: 0, freedomChange: 0 }
  }

  const previous = snapshots[snapshots.length - 2]
  const current = snapshots[snapshots.length - 1]
  return {
    assetChange: Math.round((current.totalAsset - previous.totalAsset) * 100) / 100,
    freedomChange:
      Math.round((current.freedomProgress - previous.freedomProgress) * 10000) / 10000,
  }
}

export const snapshotService = {
  getSnapshotList,

  createSnapshot(): AssetSnapshot | null {
    const totalAsset = assetService.calculateTotalAsset()
    const freedomStatus = freedomService.calculateFreedomStatus(totalAsset)
    const date = formatDate(new Date())
    const snapshots = getSnapshotList()
    const existingIndex = snapshots.findIndex((snapshot) => snapshot.date === date)
    const existing = existingIndex >= 0 ? snapshots[existingIndex] : null
    const snapshot: AssetSnapshot = {
      id: existing ? existing.id : createSnapshotId(),
      date,
      totalAsset,
      freedomLevel: freedomStatus.level,
      freedomProgress: freedomStatus.progress,
      createdAt: existing ? existing.createdAt : Date.now(),
    }
    if (existingIndex >= 0) {
      snapshots[existingIndex] = snapshot
    } else {
      snapshots.push(snapshot)
    }
    return saveSnapshotList(snapshots) ? snapshot : null
  },

  ensureRecentSnapshot(): AssetSnapshot | null {
    const snapshots = getSnapshotList()
    const latest = snapshots[snapshots.length - 1]
    const today = formatDate(new Date())
    if (!latest || latest.date !== today) {
      return this.createSnapshot()
    }
    return latest
  },

  calculateGrowth(): SnapshotGrowth {
    return calculateGrowthFromSnapshots(getSnapshotList())
  },

  getTrendPoints(range: TrendRange): AssetTrendPoint[] {
    const snapshots = getSnapshotList()
    const duration = range === 'month' ? MONTH_IN_MILLISECONDS : YEAR_IN_MILLISECONDS
    const threshold = Date.now() - duration
    const filtered = snapshots.filter((snapshot) => snapshot.createdAt >= threshold)
    const source = filtered.length > 0 ? filtered : snapshots.slice(-1)
    return source.map((snapshot) => ({
      label: snapshot.date.slice(5),
      value: snapshot.totalAsset,
    }))
  },

  getRecentYearChange(): RecentFreedomChange | null {
    const snapshots = getSnapshotList()
    if (snapshots.length === 0) {
      return null
    }

    const threshold = Date.now() - YEAR_IN_MILLISECONDS
    const yearlySnapshots = snapshots.filter((snapshot) => snapshot.createdAt >= threshold)
    const current = snapshots[snapshots.length - 1]
    const previous = yearlySnapshots[0] || current
    const museumAddedCount = museumService
      .getCollectionList()
      .filter((collection) => collection.createdAt >= threshold).length

    return {
      assetChange: Math.round((current.totalAsset - previous.totalAsset) * 100) / 100,
      assetChangeText: formatSignedAmount(current.totalAsset - previous.totalAsset),
      progressFrom: Math.round(previous.freedomProgress * 1000) / 10,
      progressFromText: formatProgress(previous.freedomProgress),
      progressTo: Math.round(current.freedomProgress * 1000) / 10,
      progressToText: formatProgress(current.freedomProgress),
      museumAddedCount,
    }
  },
}

assetService.registerAssetChangeListener(() => {
  snapshotService.createSnapshot()
})

freedomService.registerConfigurationChangeListener(() => {
  if (assetService.getAssetList().length > 0) {
    snapshotService.createSnapshot()
  }
})

if (assetService.getAssetList().length > 0 && getSnapshotList().length === 0) {
  snapshotService.createSnapshot()
}
