import { MuseumCollectionView } from '../../models/museum'
import { museumService } from '../../services/museumService'

Page({
  data: {
    collections: museumService.getCollectionViews(),
    selectedCollection: null as MuseumCollectionView | null,
    showAddForm: false,
    typeOptions: museumService.getTypeOptions(),
    statusOptions: museumService.getStatusOptions(),
    selectedTypeIndex: 0,
    selectedTypeLabel: '实物',
    selectedStatusIndex: 0,
    selectedStatusLabel: '进行中',
    nameInput: '',
    amountInput: '',
    today: museumService.getToday(),
    startDate: museumService.getToday(),
    retiredDate: museumService.getToday(),
    storyInput: '',
    validationMessage: '',
  },

  onShow() {
    this.refreshCollections()
  },

  refreshCollections() {
    this.setData({ collections: museumService.getCollectionViews() })
  },

  onToggleAddForm() {
    this.setData({
      showAddForm: !this.data.showAddForm,
      selectedCollection: null,
      validationMessage: '',
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

  onAmountInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ amountInput: event.detail.value, validationMessage: '' })
  },

  onStoryInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ storyInput: event.detail.value })
  },

  onStartDateChange(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ startDate: event.detail.value, validationMessage: '' })
  },

  onRetiredDateChange(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ retiredDate: event.detail.value, validationMessage: '' })
  },

  onAddCollection() {
    const amount = Number(this.data.amountInput.trim())
    const type = this.data.typeOptions[this.data.selectedTypeIndex].value
    const status = this.data.statusOptions[this.data.selectedStatusIndex].value
    if (!this.data.nameInput.trim()) {
      this.setData({ validationMessage: '请输入收藏名称' })
      return
    }
    if (!Number.isFinite(amount) || amount < 0) {
      this.setData({ validationMessage: '请输入有效金额' })
      return
    }
    if (status === 'retired' && this.data.retiredDate < this.data.startDate) {
      this.setData({ validationMessage: '结束日期不能早于开始日期' })
      return
    }

    const collection = museumService.addCollection({
      type,
      name: this.data.nameInput,
      amount: Math.round(amount * 100) / 100,
      startDate: this.data.startDate,
      status,
      retiredDate: status === 'retired' ? this.data.retiredDate : null,
      story: this.data.storyInput,
    })
    if (!collection) {
      this.setData({ validationMessage: '保存失败，请检查日期后重试' })
      return
    }

    this.setData({
      showAddForm: false,
      selectedTypeIndex: 0,
      selectedTypeLabel: '实物',
      selectedStatusIndex: 0,
      selectedStatusLabel: '进行中',
      nameInput: '',
      amountInput: '',
      startDate: museumService.getToday(),
      retiredDate: museumService.getToday(),
      storyInput: '',
      validationMessage: '',
    })
    this.refreshCollections()
  },

  onViewCollection(event: WechatMiniprogram.BaseEvent<{}, { id: string }>) {
    const selectedCollection = this.data.collections.find(
      (collection) => collection.id === event.currentTarget.dataset.id,
    )
    if (selectedCollection) {
      this.setData({ selectedCollection, showAddForm: false })
    }
  },

  onCloseDetail() {
    this.setData({ selectedCollection: null })
  },

  onDeleteCollection() {
    const selectedCollection = this.data.selectedCollection
    if (!selectedCollection) {
      return
    }

    wx.showModal({
      title: '删除收藏',
      content: `确认删除“${selectedCollection.name}”吗？`,
      confirmColor: '#b5473c',
      success: (result) => {
        if (result.confirm && museumService.deleteCollection(selectedCollection.id)) {
          this.setData({ selectedCollection: null })
          this.refreshCollections()
        }
      },
    })
  },
})
