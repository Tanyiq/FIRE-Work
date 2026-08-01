import { healthService } from '../../services/healthService'

const initialReport = healthService.getHealthReport()

Page({
  data: {
    report: initialReport,
    showExpenseForm: initialReport.monthlyEssentialExpense === null,
    expenseInput: initialReport.monthlyEssentialExpense
      ? String(initialReport.monthlyEssentialExpense)
      : '',
    validationMessage: '',
  },

  onShow() {
    this.refreshReport()
  },

  refreshReport() {
    this.setData({ report: healthService.getHealthReport() })
  },

  onToggleExpenseForm() {
    this.setData({
      showExpenseForm: !this.data.showExpenseForm,
      expenseInput: this.data.report.monthlyEssentialExpense
        ? String(this.data.report.monthlyEssentialExpense)
        : '',
      validationMessage: '',
    })
  },

  onExpenseInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ expenseInput: event.detail.value, validationMessage: '' })
  },

  onSaveExpense() {
    const amount = Number(this.data.expenseInput.trim())
    if (!Number.isFinite(amount) || amount <= 0) {
      this.setData({ validationMessage: '请输入大于 0 的月基础支出' })
      return
    }
    if (!healthService.saveMonthlyEssentialExpense(amount)) {
      this.setData({ validationMessage: '保存失败，请稍后重试' })
      return
    }

    this.setData({ showExpenseForm: false, validationMessage: '' })
    this.refreshReport()
  },

  onBackToWealth() {
    wx.navigateBack()
  },
})
