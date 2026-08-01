import { FireScenarioView } from '../../models/fire'
import { FreedomDashboard, SelectableFreedomLevel } from '../../models/freedom'
import { fireService } from '../../services/fireService'
import { freedomService } from '../../services/freedomService'
import { livingCostService } from '../../services/livingCostService'
import { snapshotService } from '../../services/snapshotService'

Page({
  data: {
    hasConfiguration: false,
    goalOptions: freedomService.getGoalOptions(),
    selectedLevel: '' as SelectableFreedomLevel | '',
    validationMessage: '',
    dashboard: null as FreedomDashboard | null,
    recentChange: snapshotService.getRecentYearChange(),
    hasRecentActivity: false,
    hasAssets: false,
    balancedFireScenario: null as FireScenarioView | null,
  },

  onShow() {
    const dashboard = freedomService.getDashboard()
    const recentChange = snapshotService.getRecentYearChange()
    const livingCost = livingCostService.getProfile()
    this.setData({
      hasConfiguration: dashboard !== null,
      dashboard,
      recentChange,
      hasAssets: Boolean(dashboard && dashboard.currentAsset > 0),
      balancedFireScenario: livingCost
        ? fireService.getScenarioView(livingCost.essentialMonthlyCost, 'balanced')
        : null,
      hasRecentActivity: Boolean(
        recentChange &&
          (recentChange.assetChange !== 0 ||
            recentChange.progressFrom !== recentChange.progressTo ||
            recentChange.museumAddedCount > 0),
      ),
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
      hasAssets: result.dashboard.currentAsset > 0,
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

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },

  onGoToAdvice() {
    wx.navigateTo({ url: '/pages/advice/advice' })
  },
})
