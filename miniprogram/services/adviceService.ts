import {
  WealthAdviceItem,
  WealthAdviceReport,
  WealthAdviceSource,
} from '../models/advice'
import { assetService } from './assetService'
import { healthService } from './healthService'
import { investmentService } from './investmentService'

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
const SOURCE_LABELS: Record<WealthAdviceSource, string> = {
  living_cost: '生活成本',
  asset_structure: '资产结构',
  wealth_trend: '财富趋势',
  investment_review: '投资复盘',
  data_freshness: '档案更新',
}

const createItem = (
  id: string,
  title: string,
  message: string,
  source: WealthAdviceSource,
): WealthAdviceItem => ({ id, title, message, source, sourceLabel: SOURCE_LABELS[source] })

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const adviceService = {
  getAdviceReport(): WealthAdviceReport {
    const health = healthService.getHealthReport()
    const assets = assetService.getAssetList()
    const investments = investmentService.getRecordList()
    const latestAssetUpdatedAt = assets.length > 0
      ? Math.max(...assets.map((asset) => asset.updatedAt))
      : null
    const daysSinceAssetUpdate = latestAssetUpdatedAt === null
      ? null
      : Math.max(0, Math.floor((Date.now() - latestAssetUpdatedAt) / DAY_IN_MILLISECONDS))
    const concentrationItems = health.structure.filter((item) => item.ratio > 0.5)
    const emptyLessonCount = investments.filter((record) => !record.lesson.trim()).length
    const advantages: WealthAdviceItem[] = []
    const concerns: WealthAdviceItem[] = []

    if (health.hasAssets) {
      if (health.safetyMonths !== null && health.safetyMonths >= 6) {
        advantages.push(createItem(
          'safety-buffer', '安全储备充足',
          `当前安全资产可覆盖约 ${health.safetyMonthsText}的基础生活。`, 'living_cost',
        ))
      }
      if (health.trend.assetGrowthRate !== null && health.trend.assetGrowthRate > 0) {
        advantages.push(createItem(
          'wealth-growing', '财富持续增长',
          `过去一年资产增长 ${health.trend.assetGrowthRateText}。`, 'wealth_trend',
        ))
      }
      if (concentrationItems.length === 0 && health.structure.length > 1) {
        advantages.push(createItem(
          'structure-diversified', '资产分布相对分散',
          '当前没有单一资产类型超过总资产的 50%。', 'asset_structure',
        ))
      }
    } else {
      concerns.push(createItem(
        'no-assets', '资产档案尚未建立',
        '先在财富管家记录资产，建议中心才能形成完整判断。', 'asset_structure',
      ))
    }

    if (health.hasAssets && health.essentialMonthlyCost === null) {
      concerns.push(createItem(
        'missing-living-cost', '生活成本尚未完善',
        '完善基础生活成本后，才能判断安全储备可支撑多久。', 'living_cost',
      ))
    } else if (health.safetyMonths !== null && health.safetyMonths < 3) {
      concerns.push(createItem(
        'low-safety-buffer', '安全储备需要关注',
        `当前安全资产仅可覆盖约 ${health.safetyMonthsText}的基础生活。`, 'living_cost',
      ))
    }

    if (daysSinceAssetUpdate !== null && daysSinceAssetUpdate > 90) {
      concerns.push(createItem(
        'stale-assets', '财富档案长期未更新',
        `你的财富档案已经 ${daysSinceAssetUpdate} 天没有更新，建议重新检查资产状态。`,
        'data_freshness',
      ))
    }

    if (health.hasAssets && health.safeAssetRatio > 0.8) {
      concerns.push(createItem(
        'defensive-structure', '资产结构偏向防御',
        '当前安全资产超过 80%，安全性较高，但增长资产相对较少。', 'asset_structure',
      ))
    }

    concentrationItems.forEach((item) => {
      concerns.push(createItem(
        `concentration-${item.type}`, '财富集中风险较高',
        `${item.label}占总资产 ${item.ratioText}，单一类型资产占比较高。`, 'asset_structure',
      ))
    })

    if (health.trend.assetGrowthRate !== null && health.trend.assetGrowthRate < 0) {
      concerns.push(createItem(
        'wealth-declining', '过去一年资产有所下降',
        `过去一年资产变化为 ${health.trend.assetGrowthRateText}，可以回顾变化来源。`,
        'wealth_trend',
      ))
    }

    if (investments.length === 0) {
      concerns.push(createItem(
        'no-investment-records', '尚未建立投资复盘',
        '如果已有投资经历，可以记录当时的理由和事后的结论。', 'investment_review',
      ))
    } else if (investments.length > 3 && emptyLessonCount > 0) {
      concerns.push(createItem(
        'missing-investment-lessons', '投资经历等待复盘',
        `已有 ${investments.length} 条投资记录，其中 ${emptyLessonCount} 条尚未填写复盘。`,
        'investment_review',
      ))
    } else if (emptyLessonCount === 0) {
      advantages.push(createItem(
        'investment-reviewed', '投资决策保持复盘',
        `已为 ${investments.length} 条投资记录留下复盘结论。`, 'investment_review',
      ))
    }

    if (advantages.length === 0 && health.hasAssets) {
      advantages.push(createItem(
        'archive-started', '财富档案持续积累',
        '你已经开始记录资产，持续更新会让长期变化更加清晰。', 'data_freshness',
      ))
    }

    const summary = !health.hasAssets
      ? '当前数据还不足以形成完整建议，从记录第一项资产开始。'
      : daysSinceAssetUpdate !== null && daysSinceAssetUpdate > 90
        ? '当前结构可供参考，但资产数据较久未更新，应先确认记录是否仍然准确。'
        : '基于当前生活成本、资产结构和历史记录生成，不包含市场预测。'

    return {
      stateType: health.profileType,
      summary,
      hasAssets: health.hasAssets,
      totalAssetText: health.totalAssetText,
      yearGrowthText: health.trend.assetGrowthRateText,
      safetyMonthsText: health.safetyMonthsText || '待完善生活成本',
      safeAssetRatioText: health.safeAssetRatioText,
      investmentRecordCount: investments.length,
      lastAssetUpdateText: latestAssetUpdatedAt === null ? '尚未记录' : formatDate(latestAssetUpdatedAt),
      advantages,
      concerns,
    }
  },
}
