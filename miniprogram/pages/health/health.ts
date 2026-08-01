import { healthService } from '../../services/healthService'
import { noviceTipService } from '../../services/noviceTipService'
import { themeService } from '../../services/themeService'

Page({
  data: {
    report: healthService.getHealthReport(),
    showNoviceTip: noviceTipService.shouldShow('wealth_health'),
    themePageStyle: themeService.getPageStyle(),
  },

  onShow() {
    this.refreshReport()
  },

  refreshReport() {
    this.setData({
      report: healthService.getHealthReport(),
      themePageStyle: themeService.getPageStyle(),
    })
  },

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },

  onBackToWealth() {
    wx.navigateBack()
  },

  onDismissNoviceTip() {
    noviceTipService.dismiss('wealth_health')
    this.setData({ showNoviceTip: false })
  },
})
