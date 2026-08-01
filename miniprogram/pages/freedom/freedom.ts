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
let hasPlayedHeroAnimation = false

const initialDashboard = freedomService.getDashboard()
const initialRecentChange = snapshotService.getRecentYearChange()
const initialLivingCost = livingCostService.getProfile()
const initialMuseumCollectionCount = museumService.getCollectionList().length
const initialHasAssets = Boolean(initialDashboard && initialDashboard.currentAsset > 0)
const initialOnboardingCompletedCount = [
  initialDashboard !== null,
  initialHasAssets,
  initialLivingCost !== null,
  initialMuseumCollectionCount > 0,
].filter(Boolean).length

Page({
  data: {
    hasConfiguration: initialDashboard !== null,
    goalOptions: freedomService.getGoalOptions(),
    selectedLevel: '' as SelectableFreedomLevel | '',
    validationMessage: '',
    dashboard: initialDashboard as FreedomDashboard | null,
    recentChange: initialRecentChange,
    hasRecentActivity: Boolean(
      initialRecentChange &&
        (initialRecentChange.assetChange !== 0 ||
          initialRecentChange.progressFrom !== initialRecentChange.progressTo ||
          initialRecentChange.museumAddedCount > 0),
    ),
    hasAssets: initialHasAssets,
    balancedFireScenario: initialLivingCost
      ? fireService.getScenarioView(initialLivingCost.essentialMonthlyCost, 'balanced')
      : null as FireScenarioView | null,
    hasLivingCost: initialLivingCost !== null,
    museumCollectionCount: initialMuseumCollectionCount,
    onboardingCompletedCount: initialOnboardingCompletedCount,
    showOnboarding: initialOnboardingCompletedCount < 4,
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
    const shouldAnimateHero = Boolean(dashboard && !hasPlayedHeroAnimation)
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
      animatedCurrentAssetText: formatAmount(
        shouldAnimateHero || !dashboard ? 0 : dashboard.currentAsset,
      ),
      animatedRemainingProgressText: formatProgress(
        shouldAnimateHero || !dashboard ? 1 : dashboard.remainingProgress,
      ),
      animatedProgressPercent: shouldAnimateHero || !dashboard ? 0 : dashboard.progressPercent,
      themePageStyle: themeService.getPageStyle(),
    }, () => {
      if (!dashboard || !shouldAnimateHero) return
      hasPlayedHeroAnimation = true
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
    const isFirstConfiguration = !this.data.hasConfiguration
    const result = freedomService.saveConfiguration(this.data.selectedLevel)

    if (!result.success || !result.dashboard) {
      this.setData({ validationMessage: result.message })
      return
    }

    this.setData({
      validationMessage: '',
      isEditingGoal: false,
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
      selectedLevel: dashboard.goal.level,
      validationMessage: '',
      isEditingGoal: true,
    })
  },

  onCancelEditConfiguration() {
    const dashboard = this.data.dashboard
    this.setData({
      selectedLevel: dashboard ? dashboard.goal.level : '',
      validationMessage: '',
      isEditingGoal: false,
    })
  },

  onGoToWealth() {
    wx.switchTab({ url: '/pages/wealth/wealth' })
  },

  onGoToLivingCost() {
    wx.navigateTo({ url: '/pages/living-cost/living-cost' })
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
