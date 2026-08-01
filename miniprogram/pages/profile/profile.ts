import { WealthArchiveStats } from '../../models/backup'
import { LivingCostSummary } from '../../models/livingCost'
import { backupService } from '../../services/backupService'
import { livingCostService } from '../../services/livingCostService'
import { themeService } from '../../services/themeService'
import { getNextPageMotionClass } from '../../utils/pageMotion'

Page({
  data: {
    livingCost: null as LivingCostSummary | null,
    archiveStats: null as WealthArchiveStats | null,
    themePageStyle: themeService.getPageStyle(),
    themeColor: themeService.getProfile().primaryColor,
    pageMotionClass: '',
  },

  onShow() {
    this.setData({
      livingCost: livingCostService.getSummary(),
      archiveStats: backupService.getArchiveStats(),
      themePageStyle: themeService.getPageStyle(),
      themeColor: themeService.getProfile().primaryColor,
      pageMotionClass: getNextPageMotionClass(this.data.pageMotionClass),
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
