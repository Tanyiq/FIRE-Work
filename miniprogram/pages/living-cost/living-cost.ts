import { FireScenarioView } from '../../models/fire'
import {
  LivingCostCategories,
  LivingCostInput,
} from '../../models/livingCost'
import { fireService } from '../../services/fireService'
import { livingCostService } from '../../services/livingCostService'
import { museumService } from '../../services/museumService'
import { onboardingFlowService } from '../../services/onboardingFlowService'
import { themeService } from '../../services/themeService'
import { formatAmount } from '../../utils/format'

type CostField = keyof LivingCostInput

const emptyForm = (): Record<CostField, string> => ({
  rent: '',
  food: '',
  transport: '',
  other: '',
  comfortableExtraCost: '',
})

const parseAmount = (value: string): number => {
  const amount = Number(value.trim())
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

Page({
  data: {
    form: emptyForm(),
    essentialMonthlyCostText: formatAmount(0),
    comfortableMonthlyCostText: formatAmount(0),
    fireScenarios: [] as FireScenarioView[],
    validationMessage: '',
    isGuidedLivingCostStep: false,
    themePageStyle: themeService.getPageStyle(),
  },

  onLoad() {
    const profile = livingCostService.getProfile()
    if (profile) {
      this.setData({
        form: {
          rent: profile.rent ? String(profile.rent) : '',
          food: profile.food ? String(profile.food) : '',
          transport: profile.transport ? String(profile.transport) : '',
          other: profile.other ? String(profile.other) : '',
          comfortableExtraCost: profile.comfortableExtraCost
            ? String(profile.comfortableExtraCost)
            : '',
        },
      })
      this.refreshPreview()
    }
  },

  onShow() {
    this.setData({
      themePageStyle: themeService.getPageStyle(),
      isGuidedLivingCostStep: onboardingFlowService.getStep() === 'living_cost',
    })
  },

  onAmountInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const field = event.currentTarget.dataset.field as CostField
    if (!field || !Object.prototype.hasOwnProperty.call(this.data.form, field)) {
      return
    }

    this.setData({
      [`form.${field}`]: event.detail.value,
      validationMessage: '',
    })
    this.refreshPreview()
  },

  getCategories(): LivingCostCategories {
    return {
      rent: parseAmount(this.data.form.rent),
      food: parseAmount(this.data.form.food),
      transport: parseAmount(this.data.form.transport),
      other: parseAmount(this.data.form.other),
    }
  },

  refreshPreview() {
    const essentialMonthlyCost = livingCostService.calculateEssentialMonthlyCost(
      this.getCategories(),
    )
    const comfortableExtraCost = this.data.form.comfortableExtraCost.trim()
      ? parseAmount(this.data.form.comfortableExtraCost)
      : 0
    const comfortableMonthlyCost = essentialMonthlyCost + comfortableExtraCost
    this.setData({
      essentialMonthlyCostText: formatAmount(essentialMonthlyCost),
      comfortableMonthlyCostText: formatAmount(comfortableMonthlyCost),
      fireScenarios: fireService.getScenarioViews(essentialMonthlyCost),
    })
  },

  getInput(): LivingCostInput {
    const categories = this.getCategories()
    return {
      ...categories,
      comfortableExtraCost: this.data.form.comfortableExtraCost.trim()
        ? parseAmount(this.data.form.comfortableExtraCost)
        : 0,
    }
  },

  onSave() {
    const values = Object.values(this.data.form)
    if (
      values.some(
        (value) =>
          value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0),
      )
    ) {
      this.setData({ validationMessage: '请输入有效且不小于 0 的金额' })
      return
    }

    const input = this.getInput()
    const essentialMonthlyCost = livingCostService.calculateEssentialMonthlyCost(input)
    if (essentialMonthlyCost <= 0) {
      this.setData({ validationMessage: '每月基础生活成本需要大于 0' })
      return
    }
    if (!livingCostService.saveProfile(input)) {
      this.setData({ validationMessage: '保存失败，请稍后重试' })
      return
    }

    wx.showToast({ title: '已保存', icon: 'success' })
    if (this.data.isGuidedLivingCostStep) {
      setTimeout(() => {
        if (museumService.getCollectionList().length === 0) {
          onboardingFlowService.setStep('museum')
          wx.switchTab({ url: '/pages/museum/museum' })
          return
        }
        onboardingFlowService.clear()
        wx.switchTab({ url: '/pages/freedom/freedom' })
      }, 350)
      return
    }
    setTimeout(() => wx.navigateBack(), 500)
  },

  onExitGuide() {
    onboardingFlowService.clear()
    this.setData({ isGuidedLivingCostStep: false })
  },
})
