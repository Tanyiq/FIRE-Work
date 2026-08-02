import { DataIntegritySummary, DataProtectionRule } from '../models/dataIntegrity'
import { reportService } from './reportService'
import { snapshotService } from './snapshotService'

const RULES: ReadonlyArray<DataProtectionRule> = [
  {
    id: 'snapshot-history',
    title: '历史快照不会随资产删除而消失',
    description: '资产增删只更新今天的快照；此前日期的资产总额和自由进度保持原样。',
  },
  {
    id: 'report-history',
    title: '已生成报告保持独立',
    description: '新的资产调整不会回写旧报告；同一天仍视为一个可更新的工作记录。',
  },
  {
    id: 'museum-attribution',
    title: '收藏归档年份保持稳定',
    description: '修改收藏生命周期会重算陪伴天数和每日成本，但不会改变它加入档案的年份。',
  },
]

export const dataIntegrityService = {
  getSummary(): DataIntegritySummary {
    return {
      version: 'v1.1',
      snapshotCount: snapshotService.getSnapshotList().length,
      reportCount: reportService.getReportList().length,
      rules: RULES.map((rule) => ({ ...rule })),
    }
  },
}
