import { WealthAdviceReport } from '../../models/advice'
import { adviceService } from '../../services/adviceService'
import { themeService } from '../../services/themeService'

Page({
  data: {
    report: adviceService.getAdviceReport() as WealthAdviceReport,
    themePageStyle: themeService.getPageStyle(),
  },

  onShow() {
    this.setData({
      report: adviceService.getAdviceReport(),
      themePageStyle: themeService.getPageStyle(),
    })
  },

  onGoToWealth() {
    wx.switchTab({ url: '/pages/wealth/wealth' })
  },

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },

  onGoToInvestment() {
    wx.navigateTo({ url: '/pages/investment/investment' })
  },
})
