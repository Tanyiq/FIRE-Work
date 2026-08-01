import { WealthAdviceReport } from '../../models/advice'
import { adviceService } from '../../services/adviceService'

Page({
  data: {
    report: adviceService.getAdviceReport() as WealthAdviceReport,
  },

  onShow() {
    this.setData({ report: adviceService.getAdviceReport() })
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
