import { healthService } from '../../services/healthService'

Page({
  data: {
    report: healthService.getHealthReport(),
  },

  onShow() {
    this.refreshReport()
  },

  refreshReport() {
    this.setData({ report: healthService.getHealthReport() })
  },

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },

  onBackToWealth() {
    wx.navigateBack()
  },
})
