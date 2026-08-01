import { FireScenarioView } from '../../models/fire'
import { FreedomDashboard, SelectableFreedomLevel } from '../../models/freedom'
import { fireService } from '../../services/fireService'
import { assetService } from '../../services/assetService'
import { freedomService } from '../../services/freedomService'
import { livingCostService } from '../../services/livingCostService'
import { museumService } from '../../services/museumService'
import { onboardingFlowService } from '../../services/onboardingFlowService'
import { snapshotService } from '../../services/snapshotService'
import { themeService } from '../../services/themeService'
import { formatAmount, formatProgress } from '../../utils/format'
import { CancelGrowthAnimation, playGrowthAnimation } from '../../utils/growthAnimation'

let cancelHeroAnimation: CancelGrowthAnimation | null = null

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
    animatedCurrentAssetText: formatAmount(0),
    animatedRemainingProgressText: formatProgress(1),
    animatedProgressPercent: 0,
    themePageStyle: themeService.getPageStyle(),
  },

  onShow() {
    this.refreshPage()
  },

  onHide() {
    this.stopHeroAnimation()
  },

  onUnload() {
    this.stopHeroAnimation()
  },

  stopHeroAnimation() {
    if (cancelHeroAnimation) cancelHeroAnimation()
    cancelHeroAnimation = null
  },

  refreshPage() {
    const dashboard = freedomService.getDashboard()
    const recentChange = snapshotService.getRecentYearChange()
    const livingCost = livingCostService.getProfile()
    const museumCollectionCount = museumService.getCollectionList().length
    const hasAssets = Boolean(dashboard && dashboard.currentAsset > 0)
    const onboardingCompletedCount = [dashboard !== null, hasAssets, livingCost !== null, museumCollectionCount > 0]
      .filter(Boolean).length
    this.stopHeroAnimation()
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
      animatedCurrentAssetText: formatAmount(0),
      animatedRemainingProgressText: formatProgress(1),
      animatedProgressPercent: 0,
      themePageStyle: themeService.getPageStyle(),
    }, () => {
      if (!dashboard) return
      cancelHeroAnimation = playGrowthAnimation({
        currentAsset: dashboard.currentAsset,
        progressPercent: dashboard.progressPercent,
        remainingProgress: dashboard.remainingProgress,
      }, (values) => {
        this.setData({
          animatedCurrentAssetText: formatAmount(values.currentAsset),
          animatedRemainingProgressText: formatProgress(values.remainingProgress),
          animatedProgressPercent: Math.round(values.progressPercent * 10) / 10,
        })
      })
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
    const isFirstConfiguration = !this.data.isEditingGoal
    const result = freedomService.saveConfiguration(this.data.selectedLevel)

    if (!result.success || !result.dashboard) {
      this.setData({ validationMessage: result.message })
      return
    }

    this.setData({
      validationMessage: '',
    })
    if (isFirstConfiguration && assetService.calculateTotalAsset() <= 0) {
      onboardingFlowService.setStep('asset')
      wx.switchTab({ url: '/pages/wealth/wealth' })
      return
    }
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

  onStartAssetGuide() {
    onboardingFlowService.setStep('asset')
    wx.switchTab({ url: '/pages/wealth/wealth' })
  },

  onStartLivingCostGuide() {
    onboardingFlowService.setStep('living_cost')
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
  },

  onStartMuseumGuide() {
    onboardingFlowService.setStep('museum')
    wx.switchTab({ url: '/pages/museum/museum' })
  },
})
