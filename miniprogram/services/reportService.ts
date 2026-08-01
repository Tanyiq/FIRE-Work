import {
  WealthChangeSource,
  WealthChangeSourceOption,
  WealthReport,
  WealthReportView,
} from '../models/report'
import { AssetSnapshot } from '../models/snapshot'
import { museumService } from './museumService'
import { snapshotService } from './snapshotService'
import { storageService } from './storageService'
import { formatAmount, formatProgress, formatSignedAmount } from '../utils/format'

const SOURCE_OPTIONS: ReadonlyArray<WealthChangeSourceOption> = [
  { value: 'salary_saving', label: '工资储蓄' },
  { value: 'investment_return', label: '投资收益' },
  { value: 'income_increase', label: '收入增加' },
  { value: 'large_expense', label: '大额支出' },
  { value: 'other', label: '其他' },
]

const isChangeSource = (value: unknown): value is WealthChangeSource =>
  value === 'salary_saving' ||
  value === 'investment_return' ||
  value === 'income_increase' ||
  value === 'large_expense' ||
  value === 'other'

const isReport = (value: unknown): value is WealthReport => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const report = value as WealthReport
  return (
    typeof report.id === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(report.date) &&
    typeof report.assetChange === 'number' &&
    Number.isFinite(report.assetChange) &&
    typeof report.freedomChange === 'number' &&
    Number.isFinite(report.freedomChange) &&
    typeof report.summary === 'string' &&
    isChangeSource(report.changeSource) &&
    typeof report.createdAt === 'number'
  )
}

const saveReportList = (reports: WealthReport[]): boolean =>
  storageService.set(storageService.keys.reports, reports)

const getSourceLabel = (source: WealthChangeSource): string =>
  SOURCE_OPTIONS.find((option) => option.value === source)?.label || '其他'

const getSummary = (assetChange: number): string => {
  if (assetChange > 0) {
    return '你的财富继续增长，距离目标生活又近了一步。保持适合自己的节奏，持续记录阶段性变化。'
  }
  if (assetChange < 0) {
    return '本期资产有所下降。一次阶段性变化不代表长期方向，回顾原因后继续关注自己的自由计划。'
  }
  return '本期资产保持稳定。财富成长不只来自数字变化，也来自持续积累和清晰选择。'
}

const getMonthStartTimestamp = (snapshot: AssetSnapshot): number => {
  const parts = snapshot.date.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, 1).getTime()
}

const buildReportView = (
  source: WealthChangeSource,
  snapshots: AssetSnapshot[],
): WealthReportView | null => {
  if (snapshots.length === 0) {
    return null
  }

  const current = snapshots[snapshots.length - 1]
  const previous = snapshots[snapshots.length - 2] || current
  const assetChange = Math.round((current.totalAsset - previous.totalAsset) * 100) / 100
  const freedomChange =
    Math.round((current.freedomProgress - previous.freedomProgress) * 10000) / 10000
  const periodStart = previous === current ? getMonthStartTimestamp(current) : previous.createdAt
  const addedCollections = museumService
    .getCollectionViews()
    .filter(
      (collection) =>
        collection.createdAt >= periodStart && collection.createdAt <= Date.now(),
    )
  const dateParts = current.date.split('-').map(Number)

  return {
    title: `${dateParts[0]}年${dateParts[1]}月财富报告`,
    previousDate: previous.date,
    currentDate: current.date,
    previousAsset: previous.totalAsset,
    previousAssetText: formatAmount(previous.totalAsset),
    currentAsset: current.totalAsset,
    currentAssetText: formatAmount(current.totalAsset),
    assetChange,
    assetChangeText: formatSignedAmount(assetChange),
    previousFreedomLevel: previous.freedomLevel,
    currentFreedomLevel: current.freedomLevel,
    previousFreedomProgress: Math.round(previous.freedomProgress * 1000) / 10,
    previousFreedomProgressText: formatProgress(previous.freedomProgress),
    currentFreedomProgress: Math.round(current.freedomProgress * 1000) / 10,
    currentFreedomProgressText: formatProgress(current.freedomProgress),
    freedomChange,
    distanceChange: Math.round(-assetChange * 100) / 100,
    distanceChangeText: formatAmount(Math.abs(assetChange)),
    changeSourceLabel: getSourceLabel(source),
    addedCollections,
    summary: getSummary(assetChange),
  }
}

export const reportService = {
  getChangeSourceOptions(): WealthChangeSourceOption[] {
    return SOURCE_OPTIONS.map((option) => ({ ...option }))
  },

  getReportList(): WealthReport[] {
    const storedReports = storageService.get<unknown>(storageService.keys.reports)
    if (!Array.isArray(storedReports)) {
      return []
    }

    return storedReports
      .filter(isReport)
      .map((report) => ({ ...report }))
      .sort((a, b) => b.createdAt - a.createdAt)
  },

  getCurrentReportView(source: WealthChangeSource): WealthReportView | null {
    return buildReportView(source, snapshotService.getSnapshotList())
  },

  createReport(source: WealthChangeSource): WealthReportView | null {
    if (!isChangeSource(source) || !snapshotService.ensureRecentSnapshot()) {
      return null
    }

    const snapshots = snapshotService.getSnapshotList()
    const view = buildReportView(source, snapshots)
    if (!view) {
      return null
    }

    const report: WealthReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: snapshots[snapshots.length - 1].date,
      assetChange: view.assetChange,
      freedomChange: view.freedomChange,
      summary: view.summary,
      changeSource: source,
      createdAt: Date.now(),
    }
    const reports = this.getReportList()
    const existingIndex = reports.findIndex((item) => item.date === report.date)
    if (existingIndex >= 0) {
      report.id = reports[existingIndex].id
      report.createdAt = reports[existingIndex].createdAt
      reports[existingIndex] = report
    } else {
      reports.unshift(report)
    }
    return saveReportList(reports) ? view : null
  },
}
