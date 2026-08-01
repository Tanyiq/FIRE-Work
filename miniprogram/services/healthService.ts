import { AssetType } from '../models/asset'
import {
  WealthHealthReport,
  WealthHealthStructureItem,
  WealthHealthTrend,
} from '../models/health'
import {
  formatAmount,
  formatProgress,
  formatSignedProgress,
} from '../utils/format'
import { assetService } from './assetService'
import { snapshotService } from './snapshotService'
import { livingCostService } from './livingCostService'

const YEAR_IN_MILLISECONDS = 366 * 24 * 60 * 60 * 1000
const SAFE_ASSET_TYPES: ReadonlyArray<AssetType> = ['cash', 'deposit']
const GROWTH_ASSET_TYPES: ReadonlyArray<AssetType> = [
  'fund',
  'dividend',
  'stock',
  'gold',
]

const roundRatio = (value: number): number => Math.round(value * 10000) / 10000

const getMonthlyEssentialExpense = (): number | null => {
  return livingCostService.getProfile()?.monthlyTotal || null
}

const getTrend = (): WealthHealthTrend => {
  const threshold = Date.now() - YEAR_IN_MILLISECONDS
  const snapshots = snapshotService
    .getSnapshotList()
    .filter((snapshot) => snapshot.createdAt >= threshold)
  if (snapshots.length < 2) {
    return {
      hasHistory: false,
      assetGrowthRate: null,
      assetGrowthRateText: '等待更多快照',
      freedomProgressChange: null,
      freedomProgressChangeText: '等待更多快照',
      periodLabel: '过去 12 个月',
    }
  }

  const first = snapshots[0]
  const current = snapshots[snapshots.length - 1]
  const assetGrowthRate =
    first.totalAsset > 0 ? roundRatio((current.totalAsset - first.totalAsset) / first.totalAsset) : null
  const freedomProgressChange = roundRatio(
    current.freedomProgress - first.freedomProgress,
  )

  return {
    hasHistory: true,
    assetGrowthRate,
    assetGrowthRateText:
      assetGrowthRate === null ? '暂无可比基线' : formatSignedProgress(assetGrowthRate),
    freedomProgressChange,
    freedomProgressChangeText: formatSignedProgress(freedomProgressChange),
    periodLabel: '过去 12 个月',
  }
}

const getProfileType = (
  totalAsset: number,
  safetyMonths: number | null,
  safeRatio: number,
  growthRatio: number,
  hasConcentrationRisk: boolean,
  assetGrowthRate: number | null,
): string => {
  if (totalAsset === 0) {
    return '待建立资产档案'
  }
  if (safetyMonths !== null && safetyMonths < 3) {
    return '安全储备待加强型'
  }
  if (hasConcentrationRisk) {
    return '结构集中型'
  }
  if (assetGrowthRate !== null && assetGrowthRate > 0 && safeRatio >= 0.5) {
    return '稳健成长型'
  }
  if (assetGrowthRate !== null && assetGrowthRate > 0) {
    return '成长积累型'
  }
  if (safeRatio >= 0.7) {
    return '稳健储备型'
  }
  if (growthRatio >= 0.3 && growthRatio <= 0.7) {
    return '均衡积累型'
  }
  return '财富起步型'
}

export const healthService = {
  getMonthlyEssentialExpense,

  getHealthReport(): WealthHealthReport {
    const totalAsset = assetService.calculateTotalAsset()
    const categories = assetService.getCategorySummaries()
    const monthlyEssentialExpense = getMonthlyEssentialExpense()
    const structure: WealthHealthStructureItem[] = categories.map((category) => {
      const ratio = totalAsset > 0 ? roundRatio(category.totalAmount / totalAsset) : 0
      return {
        type: category.value,
        label: category.label,
        amount: category.totalAmount,
        amountText: formatAmount(category.totalAmount),
        ratio,
        ratioPercent: Math.round(ratio * 1000) / 10,
        ratioText: formatProgress(ratio),
      }
    })
    const getAmountByTypes = (types: ReadonlyArray<AssetType>): number =>
      categories
        .filter((category) => types.includes(category.value))
        .reduce((sum, category) => sum + category.totalAmount, 0)
    const cashAsset =
      categories.find((category) => category.value === 'cash')?.totalAmount || 0
    const safeAsset = getAmountByTypes(SAFE_ASSET_TYPES)
    const growthAsset = getAmountByTypes(GROWTH_ASSET_TYPES)
    const otherAsset =
      categories.find((category) => category.value === 'other')?.totalAmount || 0
    const safeAssetRatio = totalAsset > 0 ? roundRatio(safeAsset / totalAsset) : 0
    const growthAssetRatio = totalAsset > 0 ? roundRatio(growthAsset / totalAsset) : 0
    const otherAssetRatio = totalAsset > 0 ? roundRatio(otherAsset / totalAsset) : 0
    const safetyMonths =
      monthlyEssentialExpense === null
        ? null
        : Math.round((cashAsset / monthlyEssentialExpense) * 10) / 10
    const concentrationItems = structure.filter((item) => item.ratio >= 0.5)
    const concentrationRisks = concentrationItems.map(
      (item) => `${item.label}占总资产 ${item.ratioText}，财富较集中于单一类型资产。`,
    )
    const trend = getTrend()
    const advantages: string[] = []
    const reminders: string[] = []

    if (totalAsset === 0) {
      reminders.push('先在财富管家记录资产，才能生成完整的财富体检。')
    } else {
      if (safetyMonths === null) {
        reminders.push('完善生活成本后，可以评估安全储备。')
      } else if (safetyMonths >= 6) {
        advantages.push('安全储备充足，可覆盖至少 6 个月基础生活。')
      } else if (safetyMonths >= 3) {
        advantages.push('已具备基础安全储备。')
      } else {
        reminders.push('现金安全储备不足 3 个月，需要关注短期收入中断风险。')
      }

      if (growthAssetRatio < 0.2) {
        reminders.push('增长资产比例偏低，可结合自身风险承受能力持续观察。')
      } else if (growthAssetRatio > 0.7) {
        reminders.push('增长资产占比较高，需要关注波动对自由计划的影响。')
      } else {
        advantages.push('安全资产与增长资产保持了一定平衡。')
      }

      if (concentrationRisks.length === 0 && structure.length > 1) {
        advantages.push('资产分布在多个类型，集中度相对可控。')
      } else {
        reminders.push(...concentrationRisks)
      }

      if (trend.assetGrowthRate !== null && trend.assetGrowthRate > 0) {
        advantages.push('过去 12 个月财富保持增长。')
      } else if (trend.assetGrowthRate !== null && trend.assetGrowthRate < 0) {
        reminders.push('过去 12 个月总资产有所下降，建议回顾阶段性变化原因。')
      }
    }

    return {
      hasAssets: totalAsset > 0,
      profileType: getProfileType(
        totalAsset,
        safetyMonths,
        safeAssetRatio,
        growthAssetRatio,
        concentrationRisks.length > 0,
        trend.assetGrowthRate,
      ),
      totalAsset,
      totalAssetText: formatAmount(totalAsset),
      cashAsset,
      cashAssetText: formatAmount(cashAsset),
      monthlyEssentialExpense,
      monthlyEssentialExpenseText:
        monthlyEssentialExpense === null ? null : formatAmount(monthlyEssentialExpense),
      safetyMonths,
      safetyMonthsText: safetyMonths === null ? null : `${safetyMonths} 个月`,
      safeAssetRatio,
      safeAssetRatioText: formatProgress(safeAssetRatio),
      growthAssetRatio,
      growthAssetRatioText: formatProgress(growthAssetRatio),
      otherAssetRatio,
      otherAssetRatioText: formatProgress(otherAssetRatio),
      structure,
      concentrationRisks,
      trend,
      advantages,
      reminders,
    }
  },
}
