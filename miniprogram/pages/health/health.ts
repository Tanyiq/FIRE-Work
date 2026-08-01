import { healthService } from '../../services/healthService'
import { themeService } from '../../services/themeService'

Page({
  data: {
    report: healthService.getHealthReport(),
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
})
