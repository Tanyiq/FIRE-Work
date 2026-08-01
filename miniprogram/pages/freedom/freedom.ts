import { FreedomDashboard, SelectableFreedomLevel } from '../../models/freedom'
import { freedomService } from '../../services/freedomService'
import { snapshotService } from '../../services/snapshotService'

Page({
  data: {
    hasConfiguration: false,
    goalOptions: freedomService.getGoalOptions(),
    selectedLevel: '' as SelectableFreedomLevel | '',
    validationMessage: '',
    dashboard: null as FreedomDashboard | null,
    recentChange: snapshotService.getRecentYearChange(),
  },

  onShow() {
    const dashboard = freedomService.getDashboard()
    this.setData({
      hasConfiguration: dashboard !== null,
      dashboard,
      recentChange: snapshotService.getRecentYearChange(),
    })
  },

  onSelectGoal(
    event: WechatMiniprogram.BaseEvent<{}, { level: SelectableFreedomLevel }>,
  ) {
    this.setData({
      selectedLevel: event.currentTarget.dataset.level,
      validationMessage: '',
    })
  },

  onSaveConfiguration() {
    const result = freedomService.saveConfiguration(this.data.selectedLevel)

    if (!result.success || !result.dashboard) {
      this.setData({ validationMessage: result.message })
      return
    }

    this.setData({
      hasConfiguration: true,
      dashboard: result.dashboard,
      validationMessage: '',
    })
  },

  onEditConfiguration() {
    const dashboard = this.data.dashboard
    if (!dashboard) {
      return
    }

    this.setData({
      hasConfiguration: false,
      selectedLevel: dashboard.goal.level,
      validationMessage: '',
    })
  },

  onGoToWealth() {
    wx.switchTab({ url: '/pages/wealth/wealth' })
  },
})
