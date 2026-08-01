import { assetService } from '../../services/assetService'
import { livingCostService } from '../../services/livingCostService'
import { museumService } from '../../services/museumService'
import { onboardingFlowService } from '../../services/onboardingFlowService'
import { snapshotService } from '../../services/snapshotService'
import { themeService } from '../../services/themeService'
import { drawAssetTrendChart } from '../../utils/chart'
import { formatAmount, formatSignedAmount } from '../../utils/format'
import { getNextPageMotionClass } from '../../utils/pageMotion'

const getCategoryViews = () =>
  assetService.getCategorySummaries().map((category) => ({
    ...category,
    totalAmountText: formatAmount(category.totalAmount),
    assets: category.assets.map((asset) => ({
      ...asset,
      currentAmountText: formatAmount(asset.currentAmount),
    })),
  }))

Page({
  data: {
    totalAsset: 0,
    totalAssetText: formatAmount(0),
    categories: getCategoryViews(),
    assetTypeOptions: assetService.getAssetTypeOptions(),
    selectedTypeIndex: 0,
    selectedTypeLabel: '活钱',
    showAssetForm: false,
    assetNameInput: '',
    assetAmountInput: '',
    editingAssetId: '',
    validationMessage: '',
    isGuidedAssetStep: false,
    guidedAssetCompleted: false,
    trendRange: 'month' as 'month' | 'year',
    trendPoints: snapshotService.getTrendPoints('month'),
    trendStartAsset: 0,
    trendEndAsset: 0,
    trendChange: 0,
    trendStartAssetText: formatAmount(0),
    trendEndAssetText: formatAmount(0),
    trendChangeText: formatSignedAmount(0),
    themePageStyle: themeService.getPageStyle(),
    pageMotionClass: '',
  },

  onShow() {
    this.setData({
      themePageStyle: themeService.getPageStyle(),
      pageMotionClass: getNextPageMotionClass(this.data.pageMotionClass),
    })
    this.refreshAssets()
    if (!this.data.isGuidedAssetStep) this.refreshTrend()
  },

  onReady() {
    this.renderTrend()
  },

  refreshAssets() {
    const totalAsset = assetService.calculateTotalAsset()
    const isGuidedAssetStep = onboardingFlowService.getStep() === 'asset'
    this.setData({
      totalAsset,
      totalAssetText: formatAmount(totalAsset),
      categories: getCategoryViews(),
      isGuidedAssetStep,
      guidedAssetCompleted: isGuidedAssetStep && totalAsset > 0,
      showAssetForm: isGuidedAssetStep && totalAsset <= 0 ? true : this.data.showAssetForm,
    })
  },

  refreshTrend() {
    const trendPoints = snapshotService.getTrendPoints(this.data.trendRange)
    const firstPoint = trendPoints[0]
    const lastPoint = trendPoints[trendPoints.length - 1]
    this.setData(
      {
        trendPoints,
        trendStartAsset: firstPoint ? firstPoint.value : 0,
        trendEndAsset: lastPoint ? lastPoint.value : 0,
        trendChange: firstPoint && lastPoint ? lastPoint.value - firstPoint.value : 0,
        trendStartAssetText: formatAmount(firstPoint ? firstPoint.value : 0),
        trendEndAssetText: formatAmount(lastPoint ? lastPoint.value : 0),
        trendChangeText: formatSignedAmount(
          firstPoint && lastPoint ? lastPoint.value - firstPoint.value : 0,
        ),
      },
      () => this.renderTrend(),
    )
  },

  renderTrend() {
    if (this.data.trendPoints.length > 1) {
      drawAssetTrendChart('wealthTrendCanvas', this.data.trendPoints, this)
    }
  },

  onTrendRangeChange(
    event: WechatMiniprogram.BaseEvent<{}, { range: 'month' | 'year' }>,
  ) {
    this.setData({ trendRange: event.currentTarget.dataset.range }, () => this.refreshTrend())
  },

  onGoToHealth() {
    wx.navigateTo({ url: '/pages/health/health' })
  },

  onGoToAdvice() {
    wx.navigateTo({ url: '/pages/advice/advice' })
  },

  onGoToInvestment() {
    wx.navigateTo({ url: '/pages/investment/investment' })
  },

  onToggleAssetForm() {
    const showAssetForm = !this.data.showAssetForm
    this.setData({
      showAssetForm,
      editingAssetId: '',
      assetNameInput: '',
      assetAmountInput: '',
      validationMessage: '',
    }, () => {
      if (showAssetForm) wx.pageScrollTo({ selector: '#assetForm', duration: 250 })
    })
  },

  onTypeChange(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const selectedTypeIndex = Number(event.detail.value)
    const selectedOption = this.data.assetTypeOptions[selectedTypeIndex]
    this.setData({
      selectedTypeIndex,
      selectedTypeLabel: selectedOption.label,
      validationMessage: '',
    })
  },

  onNameInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ assetNameInput: event.detail.value, validationMessage: '' })
  },

  onAmountInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ assetAmountInput: event.detail.value, validationMessage: '' })
  },

  onAddAsset() {
    const amountInWan = Number(this.data.assetAmountInput.trim())
    const selectedOption = this.data.assetTypeOptions[this.data.selectedTypeIndex]
    if (!this.data.assetNameInput.trim()) {
      this.setData({ validationMessage: '请输入资产名称' })
      return
    }
    if (!Number.isFinite(amountInWan) || amountInWan <= 0) {
      this.setData({ validationMessage: '请输入大于 0 的资产金额' })
      return
    }

    const assetInput = {
      type: selectedOption.value,
      name: this.data.assetNameInput,
      currentAmount: Math.round(amountInWan * 10000 * 100) / 100,
    }
    const asset = this.data.editingAssetId
      ? assetService.updateAsset(this.data.editingAssetId, assetInput)
      : assetService.addAsset(assetInput)
    if (!asset) {
      this.setData({ validationMessage: '保存失败，请稍后重试' })
      return
    }

    this.setData({
      showAssetForm: false,
      assetNameInput: '',
      assetAmountInput: '',
      editingAssetId: '',
      validationMessage: '',
    })
    this.refreshAssets()
    if (this.data.isGuidedAssetStep) {
      wx.showToast({ title: '资产基线已建立', icon: 'success' })
      setTimeout(() => this.advanceOnboarding(), 350)
      return
    }
    this.refreshTrend()
  },

  advanceOnboarding() {
    if (!livingCostService.getProfile()) {
      onboardingFlowService.setStep('living_cost')
      wx.navigateTo({ url: '/pages/living-cost/living-cost' })
      return
    }
    if (museumService.getCollectionList().length === 0) {
      onboardingFlowService.setStep('museum')
      wx.switchTab({ url: '/pages/museum/museum' })
      return
    }
    onboardingFlowService.clear()
    wx.switchTab({ url: '/pages/freedom/freedom' })
  },

  onContinueGuide() {
    this.advanceOnboarding()
  },

  onExitGuide() {
    onboardingFlowService.clear()
    this.setData({
      isGuidedAssetStep: false,
      guidedAssetCompleted: false,
      showAssetForm: false,
    })
    this.refreshTrend()
  },

  onEditAsset(event: WechatMiniprogram.BaseEvent<{}, { id: string }>) {
    const asset = assetService
      .getAssetList()
      .find((item) => item.id === event.currentTarget.dataset.id)
    if (!asset) {
      return
    }

    const selectedTypeIndex = this.data.assetTypeOptions.findIndex(
      (option) => option.value === asset.type,
    )
    this.setData({
      showAssetForm: true,
      editingAssetId: asset.id,
      selectedTypeIndex,
      selectedTypeLabel: this.data.assetTypeOptions[selectedTypeIndex].label,
      assetNameInput: asset.name,
      assetAmountInput: String(asset.currentAmount / 10000),
      validationMessage: '',
    }, () => wx.pageScrollTo({ selector: '#assetForm', duration: 250 }))
  },

  onDeleteAsset(event: WechatMiniprogram.BaseEvent<{}, { id: string }>) {
    const assetId = event.currentTarget.dataset.id
    wx.showModal({
      title: '删除资产',
      content: '确认从资产列表中删除这条记录吗？',
      confirmColor: '#b5473c',
      success: (result) => {
        if (result.confirm && assetService.deleteAsset(assetId)) {
          this.refreshAssets()
          this.refreshTrend()
        }
      },
    })
  },
})
