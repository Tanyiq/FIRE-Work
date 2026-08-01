import { FireScenarioView } from '../../models/fire'
import { FreedomDashboard, SelectableFreedomLevel } from '../../models/freedom'
import { fireService } from '../../services/fireService'
import { freedomService } from '../../services/freedomService'
import { livingCostService } from '../../services/livingCostService'
import { museumService } from '../../services/museumService'
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
    hasLivingCost: false,
    museumCollectionCount: 0,
    onboardingCompletedCount: 0,
    showOnboarding: true,
    isEditingGoal: false,
  },

  onShow() {
    this.refreshPage()
  },

  refreshPage() {
    const dashboard = freedomService.getDashboard()
    const recentChange = snapshotService.getRecentYearChange()
    const livingCost = livingCostService.getProfile()
    const museumCollectionCount = museumService.getCollectionList().length
    const hasAssets = Boolean(dashboard && dashboard.currentAsset > 0)
    const onboardingCompletedCount = [dashboard !== null, hasAssets, livingCost !== null, museumCollectionCount > 0]
      .filter(Boolean).length
    this.setData({
      hasConfiguration: dashboard !== null,
      dashboard,
      recentChange,
      hasAssets,
      hasLivingCost: livingCost !== null,
      museumCollectionCount,
      onboardingCompletedCount,
      showOnboarding: onboardingCompletedCount < 4,
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
      validationMessage: '',
    })
    this.refreshPage()
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
      isEditingGoal: true,
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

  onGoToMuseum() {
    wx.switchTab({ url: '/pages/museum/museum' })
  },
})
