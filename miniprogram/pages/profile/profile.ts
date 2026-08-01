import { WealthArchiveStats } from '../../models/backup'
import { LivingCostSummary } from '../../models/livingCost'
import { backupService } from '../../services/backupService'
import { livingCostService } from '../../services/livingCostService'

Page({
  data: {
    livingCost: null as LivingCostSummary | null,
    archiveStats: null as WealthArchiveStats | null,
  },

  onShow() {
    this.setData({
      livingCost: livingCostService.getSummary(),
      archiveStats: backupService.getArchiveStats(),
    })
  },

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },

  onGoToDataManagement() {
    wx.navigateTo({ url: '/pages/data-management/data-management' })
  },
})
