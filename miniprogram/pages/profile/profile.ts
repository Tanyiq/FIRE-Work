import { WealthArchiveStats } from '../../models/backup'
import { LivingCostSummary } from '../../models/livingCost'
import { backupService } from '../../services/backupService'
import { livingCostService } from '../../services/livingCostService'
import { themeService } from '../../services/themeService'

Page({
  data: {
    livingCost: livingCostService.getSummary() as LivingCostSummary | null,
    archiveStats: backupService.getArchiveStats() as WealthArchiveStats,
    themePageStyle: themeService.getPageStyle(),
    themeColor: themeService.getProfile().primaryColor,
  },

  onShow() {
    this.setData({
      livingCost: livingCostService.getSummary(),
      archiveStats: backupService.getArchiveStats(),
      themePageStyle: themeService.getPageStyle(),
      themeColor: themeService.getProfile().primaryColor,
    })
  },

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },

  onGoToDataManagement() {
    wx.navigateTo({ url: '/pages/data-management/data-management' })
  },

  onGoToTheme() {
    wx.navigateTo({ url: '/pages/theme/theme' })
  },
})
