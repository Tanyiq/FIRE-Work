import { InvestmentRecordView } from '../../models/investment'
import { investmentService } from '../../services/investmentService'
import { themeService } from '../../services/themeService'

const createFormData = () => ({
  selectedTypeIndex: 0,
  selectedTypeLabel: '股票',
  selectedStatusIndex: 0,
  selectedStatusLabel: '持有',
  nameInput: '',
  investedAmountInput: '',
  currentAmountInput: '',
  startDate: investmentService.getCurrentMonth(),
  endDate: investmentService.getCurrentMonth(),
  reasonInput: '',
  lessonInput: '',
  validationMessage: '',
})

Page({
  data: {
    records: investmentService.getRecordViews(),
    selectedRecord: null as InvestmentRecordView | null,
    showForm: false,
    editingRecordId: '',
    typeOptions: investmentService.getTypeOptions(),
    statusOptions: investmentService.getStatusOptions(),
    currentMonth: investmentService.getCurrentMonth(),
    themePageStyle: themeService.getPageStyle(),
    ...createFormData(),
  },

  onShow() {
    this.refreshRecords()
  },

  refreshRecords() {
    this.setData({
      records: investmentService.getRecordViews(),
      themePageStyle: themeService.getPageStyle(),
    })
  },

  onToggleForm() {
    if (this.data.showForm) {
      this.setData({ showForm: false, editingRecordId: '', validationMessage: '' })
      return
    }
    this.setData({
      ...createFormData(),
      showForm: true,
      editingRecordId: '',
      selectedRecord: null,
    })
  },

  onTypeChange(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const selectedTypeIndex = Number(event.detail.value)
    this.setData({
      selectedTypeIndex,
      selectedTypeLabel: this.data.typeOptions[selectedTypeIndex].label,
      validationMessage: '',
    })
  },

  onStatusChange(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const selectedStatusIndex = Number(event.detail.value)
    this.setData({
      selectedStatusIndex,
      selectedStatusLabel: this.data.statusOptions[selectedStatusIndex].label,
      validationMessage: '',
    })
  },

  onNameInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ nameInput: event.detail.value, validationMessage: '' })
  },

  onInvestedAmountInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ investedAmountInput: event.detail.value, validationMessage: '' })
  },

  onCurrentAmountInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ currentAmountInput: event.detail.value, validationMessage: '' })
  },

  onStartDateChange(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ startDate: event.detail.value, validationMessage: '' })
  },

  onEndDateChange(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ endDate: event.detail.value, validationMessage: '' })
  },

  onReasonInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ reasonInput: event.detail.value, validationMessage: '' })
  },

  onLessonInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ lessonInput: event.detail.value })
  },

  onSaveRecord() {
    const investedAmount = Number(this.data.investedAmountInput.trim())
    const currentAmount = Number(this.data.currentAmountInput.trim())
    const status = this.data.statusOptions[this.data.selectedStatusIndex].value
    if (!this.data.nameInput.trim()) {
      this.setData({ validationMessage: '请输入投资记录名称' })
      return
    }
    if (!Number.isFinite(investedAmount) || investedAmount <= 0) {
      this.setData({ validationMessage: '请输入大于 0 的投入金额' })
      return
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      this.setData({ validationMessage: '请输入有效的当前金额' })
      return
    }
    if (!this.data.reasonInput.trim()) {
      this.setData({ validationMessage: '请记录当时的投资理由' })
      return
    }
    if (status === 'closed' && this.data.endDate < this.data.startDate) {
      this.setData({ validationMessage: '结束时间不能早于开始时间' })
      return
    }

    const input = {
      name: this.data.nameInput,
      type: this.data.typeOptions[this.data.selectedTypeIndex].value,
      investedAmount: Math.round(investedAmount * 100) / 100,
      currentAmount: Math.round(currentAmount * 100) / 100,
      startDate: this.data.startDate,
      endDate: status === 'closed' ? this.data.endDate : undefined,
      status,
      reason: this.data.reasonInput,
      lesson: this.data.lessonInput,
    }
    const saved = this.data.editingRecordId
      ? investmentService.updateRecord(this.data.editingRecordId, input)
      : investmentService.addRecord(input)
    if (!saved) {
      this.setData({ validationMessage: '保存失败，请检查内容后重试' })
      return
    }

    this.setData({ ...createFormData(), showForm: false, editingRecordId: '' })
    this.refreshRecords()
  },

  onViewRecord(event: WechatMiniprogram.BaseEvent<{}, { id: string }>) {
    const selectedRecord = this.data.records.find(
      (item) => item.id === event.currentTarget.dataset.id,
    )
    if (selectedRecord) this.setData({ selectedRecord, showForm: false })
  },

  onCloseDetail() {
    this.setData({ selectedRecord: null })
  },

  onEditRecord() {
    const record = this.data.selectedRecord
    if (!record) return
    const selectedTypeIndex = this.data.typeOptions.findIndex((item) => item.value === record.type)
    const selectedStatusIndex = this.data.statusOptions.findIndex((item) => item.value === record.status)
    this.setData({
      showForm: true,
      selectedRecord: null,
      editingRecordId: record.id,
      selectedTypeIndex,
      selectedTypeLabel: this.data.typeOptions[selectedTypeIndex].label,
      selectedStatusIndex,
      selectedStatusLabel: this.data.statusOptions[selectedStatusIndex].label,
      nameInput: record.name,
      investedAmountInput: String(record.investedAmount),
      currentAmountInput: String(record.currentAmount),
      startDate: record.startDate,
      endDate: record.endDate || investmentService.getCurrentMonth(),
      reasonInput: record.reason,
      lessonInput: record.lesson,
      validationMessage: '',
    })
  },

  onDeleteRecord() {
    const record = this.data.selectedRecord
    if (!record) return
    wx.showModal({
      title: '删除投资记录',
      content: `确认删除“${record.name}”的复盘记录吗？`,
      confirmColor: '#b5473c',
      success: (result) => {
        if (result.confirm && investmentService.deleteRecord(record.id)) {
          this.setData({ selectedRecord: null })
          this.refreshRecords()
        }
      },
    })
  },
})
