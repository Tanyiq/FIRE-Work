import { LivingCostSummary } from '../../models/livingCost'
import { livingCostService } from '../../services/livingCostService'

Page({
  data: {
    livingCost: null as LivingCostSummary | null,
  },

  onShow() {
    this.setData({ livingCost: livingCostService.getSummary() })
  },

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },
})
