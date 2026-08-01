import { LivingCostInput } from '../../models/livingCost'
import { livingCostService } from '../../services/livingCostService'
import { formatAmount } from '../../utils/format'

type CostField = keyof LivingCostInput

const emptyForm = (): Record<CostField, string> => ({
  rent: '',
  food: '',
  transport: '',
  other: '',
})

const parseAmount = (value: string): number => {
  const amount = Number(value.trim())
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

Page({
  data: {
    form: emptyForm(),
    monthlyTotalText: formatAmount(0),
    fireReferenceAssetText: formatAmount(0),
    validationMessage: '',
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
        },
      })
      this.refreshPreview()
    }
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

  refreshPreview() {
    const input = this.getInput()
    const monthlyTotal = livingCostService.calculateMonthlyTotal(input)
    this.setData({
      monthlyTotalText: formatAmount(monthlyTotal),
      fireReferenceAssetText: formatAmount(
        livingCostService.calculateFireReferenceAsset(monthlyTotal),
      ),
    })
  },

  getInput(): LivingCostInput {
    return {
      rent: parseAmount(this.data.form.rent),
      food: parseAmount(this.data.form.food),
      transport: parseAmount(this.data.form.transport),
      other: parseAmount(this.data.form.other),
    }
  },

  onSave() {
    const values = Object.values(this.data.form)
    if (values.some((value) => value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      this.setData({ validationMessage: '请输入有效且不小于 0 的金额' })
      return
    }

    if (!livingCostService.saveProfile(this.getInput())) {
      this.setData({ validationMessage: '每月基础生活成本需要大于 0' })
      return
    }

    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  },
})
