import { assetService } from '../../services/assetService'
import { snapshotService } from '../../services/snapshotService'
import { drawAssetTrendChart } from '../../utils/chart'

Page({
  data: {
    totalAsset: 0,
    categories: assetService.getCategorySummaries(),
    assetTypeOptions: assetService.getAssetTypeOptions(),
    selectedTypeIndex: 0,
    selectedTypeLabel: '活钱',
    showAssetForm: false,
    assetNameInput: '',
    assetAmountInput: '',
    editingAssetId: '',
    validationMessage: '',
    trendRange: 'month' as 'month' | 'year',
    trendPoints: snapshotService.getTrendPoints('month'),
    trendStartAsset: 0,
    trendEndAsset: 0,
    trendChange: 0,
  },

  onShow() {
    this.refreshAssets()
    this.refreshTrend()
  },

  onReady() {
    this.renderTrend()
  },

  refreshAssets() {
    this.setData({
      totalAsset: assetService.calculateTotalAsset(),
      categories: assetService.getCategorySummaries(),
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
      },
      () => this.renderTrend(),
    )
  },

  renderTrend() {
    drawAssetTrendChart('wealthTrendCanvas', this.data.trendPoints, this)
  },

  onTrendRangeChange(
    event: WechatMiniprogram.BaseEvent<{}, { range: 'month' | 'year' }>,
  ) {
    this.setData({ trendRange: event.currentTarget.dataset.range }, () => this.refreshTrend())
  },

  onToggleAssetForm() {
    this.setData({
      showAssetForm: !this.data.showAssetForm,
      editingAssetId: '',
      assetNameInput: '',
      assetAmountInput: '',
      validationMessage: '',
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
    })
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
