import { Asset, AssetType } from '../models/asset'
import {
  BackupCheck,
  BackupOperationResult,
  WealthArchiveStats,
  WealthBackup,
} from '../models/backup'
import { FreedomGoal } from '../models/freedom'
import {
  InvestmentRecord,
  InvestmentRecordStatus,
  InvestmentRecordType,
} from '../models/investment'
import { LivingCostProfile } from '../models/livingCost'
import {
  MuseumCollection,
  MuseumCollectionStatus,
  MuseumCollectionType,
} from '../models/museum'
import { WealthChangeSource, WealthReport } from '../models/report'
import { AssetSnapshot } from '../models/snapshot'
import { assetService } from './assetService'
import { investmentService } from './investmentService'
import { livingCostService } from './livingCostService'
import { museumService } from './museumService'
import { reportService } from './reportService'
import { snapshotService } from './snapshotService'
import { storageService } from './storageService'

const BACKUP_VERSION = '1.0' as const
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
const MAX_BACKUP_FILE_SIZE = 20 * 1024 * 1024
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const ASSET_TYPES: ReadonlyArray<AssetType> = [
  'cash', 'deposit', 'fund', 'dividend', 'stock', 'gold', 'other',
]
const COLLECTION_TYPES: ReadonlyArray<MuseumCollectionType> = [
  'physical', 'experience', 'life_event', 'income_event',
]
const COLLECTION_STATUSES: ReadonlyArray<MuseumCollectionStatus> = ['active', 'retired']
const CHANGE_SOURCES: ReadonlyArray<WealthChangeSource> = [
  'salary_saving', 'investment_return', 'income_increase', 'large_expense', 'other',
]
const INVESTMENT_TYPES: ReadonlyArray<InvestmentRecordType> = ['stock', 'fund', 'etf', 'other']
const INVESTMENT_STATUSES: ReadonlyArray<InvestmentRecordStatus> = ['holding', 'closed']

interface WxFileShareOptions {
  filePath: string
  fileName?: string
  success?: () => void
  fail?: () => void
}

type WxWithFileShare = typeof wx & {
  shareFileMessage?: (options: WxFileShareOptions) => void
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object'

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isNonNegativeNumber = (value: unknown): value is number =>
  isFiniteNumber(value) && value >= 0

const isTimestamp = (value: unknown): value is number =>
  isFiniteNumber(value) && value > 0

const isFreedomGoal = (value: unknown): value is FreedomGoal => {
  if (!isObject(value)) return false
  return (
    (value.level === 'Lv1' || value.level === 'Lv2' || value.level === 'Lv3' || value.level === 'Lv4') &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    isFiniteNumber(value.targetAsset) &&
    value.targetAsset > 0
  )
}

const isAsset = (value: unknown): value is Asset => {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' &&
    ASSET_TYPES.includes(value.type as AssetType) &&
    typeof value.name === 'string' && value.name.trim().length > 0 &&
    isNonNegativeNumber(value.currentAmount) &&
    isTimestamp(value.createdAt) && isTimestamp(value.updatedAt)
  )
}

const isSnapshot = (value: unknown): value is AssetSnapshot => {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' && DATE_PATTERN.test(String(value.date)) &&
    isNonNegativeNumber(value.totalAsset) && typeof value.freedomLevel === 'string' &&
    isNonNegativeNumber(value.freedomProgress) && value.freedomProgress <= 1 &&
    isTimestamp(value.createdAt)
  )
}

const isReport = (value: unknown): value is WealthReport => {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' && DATE_PATTERN.test(String(value.date)) &&
    isFiniteNumber(value.assetChange) && isFiniteNumber(value.freedomChange) &&
    typeof value.summary === 'string' &&
    CHANGE_SOURCES.includes(value.changeSource as WealthChangeSource) &&
    isTimestamp(value.createdAt)
  )
}

const isCollection = (value: unknown): value is MuseumCollection => {
  if (!isObject(value)) return false
  const hasValidRetiredDate = value.status === 'retired'
    ? typeof value.retiredDate === 'string' && DATE_PATTERN.test(value.retiredDate)
    : value.retiredDate === null
  return (
    typeof value.id === 'string' &&
    COLLECTION_TYPES.includes(value.type as MuseumCollectionType) &&
    typeof value.name === 'string' && value.name.trim().length > 0 &&
    isNonNegativeNumber(value.amount) && DATE_PATTERN.test(String(value.startDate)) &&
    COLLECTION_STATUSES.includes(value.status as MuseumCollectionStatus) && hasValidRetiredDate &&
    typeof value.story === 'string' &&
    isTimestamp(value.createdAt) && isTimestamp(value.updatedAt)
  )
}

const isLivingCost = (value: unknown): value is LivingCostProfile => {
  if (!isObject(value)) return false
  const categoryTotal = ['rent', 'food', 'transport', 'other'].reduce((sum, key) => {
    const amount = value[key]
    return sum + (isNonNegativeNumber(amount) ? amount : Number.NaN)
  }, 0)
  return (
    Number.isFinite(categoryTotal) && categoryTotal > 0 &&
    isNonNegativeNumber(value.essentialMonthlyCost) &&
    Math.abs(value.essentialMonthlyCost - categoryTotal) < 0.01 &&
    isNonNegativeNumber(value.comfortableMonthlyCost) &&
    value.comfortableMonthlyCost >= value.essentialMonthlyCost &&
    isTimestamp(value.updatedAt)
  )
}

const isInvestmentRecord = (value: unknown): value is InvestmentRecord => {
  if (!isObject(value)) return false
  const hasValidEndDate = value.status === 'closed'
    ? typeof value.endDate === 'string' && MONTH_PATTERN.test(value.endDate) &&
      value.endDate >= String(value.startDate)
    : value.endDate === undefined
  return (
    typeof value.id === 'string' && typeof value.name === 'string' && value.name.trim().length > 0 &&
    INVESTMENT_TYPES.includes(value.type as InvestmentRecordType) &&
    isNonNegativeNumber(value.investedAmount) && value.investedAmount > 0 &&
    isNonNegativeNumber(value.currentAmount) && MONTH_PATTERN.test(String(value.startDate)) &&
    INVESTMENT_STATUSES.includes(value.status as InvestmentRecordStatus) && hasValidEndDate &&
    typeof value.reason === 'string' && value.reason.trim().length > 0 &&
    typeof value.lesson === 'string' && isTimestamp(value.createdAt)
  )
}

const parseBackup = (json: string): WealthBackup | null => {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch (_error) {
    return null
  }
  if (!isObject(value) || value.version !== BACKUP_VERSION || !isObject(value.user)) {
    return null
  }
  const goal = value.user.freedomGoal
  const investments = value.investments === undefined ? [] : value.investments
  if (
    !isTimestamp(value.exportedAt) ||
    !isTimestamp(value.user.joinedAt) ||
    (goal !== null && !isFreedomGoal(goal)) ||
    !Array.isArray(value.assets) || !value.assets.every(isAsset) ||
    !Array.isArray(value.snapshots) || !value.snapshots.every(isSnapshot) ||
    !Array.isArray(value.reports) || !value.reports.every(isReport) ||
    !Array.isArray(value.museum) || !value.museum.every(isCollection) ||
    (value.livingCost !== null && !isLivingCost(value.livingCost)) ||
    !Array.isArray(investments) || !investments.every(isInvestmentRecord)
  ) {
    return null
  }
  return {
    version: BACKUP_VERSION,
    exportedAt: value.exportedAt as number,
    user: {
      joinedAt: value.user.joinedAt as number,
      freedomGoal: goal as FreedomGoal | null,
    },
    assets: value.assets as Asset[],
    snapshots: value.snapshots as AssetSnapshot[],
    reports: value.reports as WealthReport[],
    museum: value.museum as MuseumCollection[],
    livingCost: value.livingCost as LivingCostProfile | null,
    investments: investments as InvestmentRecord[],
  }
}

const getJoinedAt = (): number => {
  const stored = storageService.get<number>(storageService.keys.profileJoinedAt)
  if (isTimestamp(stored)) return stored

  const timestamps = [
    ...assetService.getAssetList().map((item) => item.createdAt),
    ...snapshotService.getSnapshotList().map((item) => item.createdAt),
    ...reportService.getReportList().map((item) => item.createdAt),
    ...museumService.getCollectionList().map((item) => item.createdAt),
    ...investmentService.getRecordList().map((item) => item.createdAt),
  ]
  const livingCost = livingCostService.getProfile()
  if (livingCost) timestamps.push(livingCost.updatedAt)
  const joinedAt = timestamps.length > 0 ? Math.min(...timestamps) : Date.now()
  storageService.set(storageService.keys.profileJoinedAt, joinedAt)
  return joinedAt
}

const getLatestDataAt = (): number => {
  const timestamps = [
    ...assetService.getAssetList().map((item) => item.updatedAt),
    ...snapshotService.getSnapshotList().map((item) => item.createdAt),
    ...reportService.getReportList().map((item) => item.createdAt),
    ...museumService.getCollectionList().map((item) => item.updatedAt),
    ...investmentService.getRecordList().map((item) => item.createdAt),
  ]
  const livingCost = livingCostService.getProfile()
  if (livingCost) timestamps.push(livingCost.updatedAt)
  const investmentUpdatedAt = storageService.get<number>(
    storageService.keys.investmentRecordsUpdatedAt,
  )
  if (isTimestamp(investmentUpdatedAt)) timestamps.push(investmentUpdatedAt)
  return timestamps.length > 0 ? Math.max(...timestamps) : getJoinedAt()
}

const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const createBackup = (): WealthBackup => ({
  version: BACKUP_VERSION,
  exportedAt: Date.now(),
  user: {
    joinedAt: getJoinedAt(),
    freedomGoal: (() => {
      const goal = storageService.get<unknown>(storageService.keys.freedomGoal)
      return isFreedomGoal(goal) ? goal : null
    })(),
  },
  assets: assetService.getAssetList(),
  snapshots: snapshotService.getSnapshotList(),
  reports: reportService.getReportList(),
  museum: museumService.getCollectionList(),
  livingCost: livingCostService.getProfile(),
  investments: investmentService.getRecordList(),
})

const copyBackupToClipboard = (json: string): Promise<BackupOperationResult> =>
  new Promise((resolve) => {
    wx.setClipboardData({
      data: json,
      success: () => resolve({
        success: true,
        usedClipboard: true,
        message: '当前环境不支持文件分享，备份 JSON 已复制到剪贴板。',
      }),
      fail: () => resolve({ success: false, message: '备份文件已生成，但无法分享或复制。' }),
    })
  })

const shareBackupFile = (
  filePath: string,
  fileName: string,
  json: string,
): Promise<BackupOperationResult> => {
  const shareFileMessage = (wx as WxWithFileShare).shareFileMessage
  if (!shareFileMessage) return copyBackupToClipboard(json)
  return new Promise((resolve) => {
    shareFileMessage({
      filePath,
      fileName,
      success: () => resolve({ success: true, message: '备份文件已生成。' }),
      fail: () => copyBackupToClipboard(json).then(resolve),
    })
  })
}

const restoreBackup = (backup: WealthBackup): BackupOperationResult => {
  const keys = storageService.keys
  const targetKeys = [
    keys.freedomGoal, keys.assets, keys.snapshots, keys.reports,
    keys.museumCollections, keys.livingCostProfile, keys.monthlyEssentialExpense,
    keys.profileJoinedAt,
    keys.investmentRecords,
    keys.investmentRecordsUpdatedAt,
  ]
  const previous = targetKeys.map((key) => ({ key, value: storageService.get<unknown>(key) }))
  const operations: Array<() => boolean> = [
    () => backup.user.freedomGoal
      ? storageService.set(keys.freedomGoal, backup.user.freedomGoal)
      : storageService.remove(keys.freedomGoal),
    () => storageService.set(keys.assets, backup.assets),
    () => storageService.set(keys.snapshots, backup.snapshots),
    () => storageService.set(keys.reports, backup.reports),
    () => storageService.set(keys.museumCollections, backup.museum),
    () => backup.livingCost
      ? storageService.set(keys.livingCostProfile, backup.livingCost)
      : storageService.remove(keys.livingCostProfile),
    () => storageService.remove(keys.monthlyEssentialExpense),
    () => storageService.set(keys.profileJoinedAt, backup.user.joinedAt),
    () => storageService.set(keys.investmentRecords, backup.investments),
    () => storageService.remove(keys.investmentRecordsUpdatedAt),
  ]
  if (operations.every((operation) => operation())) {
    return { success: true, message: '财富档案已恢复。' }
  }

  previous.forEach(({ key, value }) => {
    if (value === null) storageService.remove(key)
    else storageService.set(key, value)
  })
  return { success: false, message: '恢复失败，原有本地数据已保留。' }
}

export const backupService = {
  getArchiveStats(): WealthArchiveStats {
    const joinedAt = getJoinedAt()
    return {
      joinedAt,
      joinedDays: Math.max(1, Math.floor((Date.now() - joinedAt) / DAY_IN_MILLISECONDS) + 1),
      assetCount: assetService.getAssetList().length,
      snapshotCount: snapshotService.getSnapshotList().length,
      reportCount: reportService.getReportList().length,
      museumCount: museumService.getCollectionList().length,
      investmentCount: investmentService.getRecordList().length,
    }
  },

  getBackupCheck(): BackupCheck {
    const lastBackupAt = storageService.get<number>(storageService.keys.lastBackupAt)
    if (!isTimestamp(lastBackupAt)) {
      return {
        lastBackupAt: null,
        lastBackupText: '尚未备份',
        state: 'never',
        title: '建议创建第一份备份',
        description: '本地数据可能随小程序清理而丢失。',
      }
    }
    const outdated = getLatestDataAt() > lastBackupAt
    return {
      lastBackupAt,
      lastBackupText: formatDateTime(lastBackupAt),
      state: outdated ? 'outdated' : 'current',
      title: outdated ? '有新数据待备份' : '备份状态良好',
      description: outdated ? '上次备份后档案发生了变化。' : '当前数据已包含在最近一次备份中。',
    }
  },

  createBackupJson(): string {
    return JSON.stringify(createBackup(), null, 2)
  },

  exportBackup(): Promise<BackupOperationResult> {
    const json = this.createBackupJson()
    const date = new Date()
    const stamp = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((value) => String(value).padStart(2, '0'))
      .join('')
    const fileName = `FIRE-Work-backup-${stamp}.json`
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    return new Promise((resolve) => {
      wx.getFileSystemManager().writeFile({
        filePath,
        data: json,
        encoding: 'utf8',
        success: () => {
          shareBackupFile(filePath, fileName, json).then((result) => {
            if (result.success) {
              storageService.set(storageService.keys.lastBackupAt, Date.now())
            }
            resolve(result)
          })
        },
        fail: () => resolve({ success: false, message: '无法生成备份文件，请检查存储空间。' }),
      })
    })
  },

  restoreFromJson(json: string): BackupOperationResult {
    const backup = parseBackup(json)
    return backup
      ? restoreBackup(backup)
      : { success: false, message: '备份文件格式或版本不受支持。' }
  },

  chooseAndRestore(): Promise<BackupOperationResult> {
    return new Promise((resolve) => {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['json'],
        success: (result) => {
          const file = result.tempFiles[0]
          if (!file) {
            resolve({ success: false, message: '没有选择备份文件。' })
            return
          }
          if (file.size > MAX_BACKUP_FILE_SIZE) {
            resolve({ success: false, message: '备份文件超过 20 MB，无法安全读取。' })
            return
          }
          wx.getFileSystemManager().readFile({
            filePath: file.path,
            encoding: 'utf8',
            success: (readResult) => resolve(
              typeof readResult.data === 'string'
                ? this.restoreFromJson(readResult.data)
                : { success: false, message: '无法读取备份文件内容。' },
            ),
            fail: () => resolve({ success: false, message: '无法读取所选备份文件。' }),
          })
        },
        fail: () => resolve({ success: false, message: '已取消选择或无法访问文件。' }),
      })
    })
  },
}
