import { MuseumCollectionView } from '../../models/museum'
import { museumService } from '../../services/museumService'
import { onboardingFlowService } from '../../services/onboardingFlowService'
import { themeService } from '../../services/themeService'

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
    photoPathInput: '',
    isChoosingPhoto: false,
    validationMessage: '',
    isGuidedMuseumStep: false,
    themePageStyle: themeService.getPageStyle(),
  },

  onShow() {
    this.refreshCollections()
  },

  onUnload() {
    if (this.data.showAddForm && this.data.photoPathInput) {
      wx.removeSavedFile({ filePath: this.data.photoPathInput })
    }
  },

  refreshCollections() {
    const collections = museumService.getCollectionViews()
    const isGuidedMuseumStep = onboardingFlowService.getStep() === 'museum'
    this.setData({
      collections,
      isGuidedMuseumStep,
      showAddForm: isGuidedMuseumStep && collections.length === 0 ? true : this.data.showAddForm,
      themePageStyle: themeService.getPageStyle(),
    })
  },

  onToggleAddForm() {
    if (this.data.showAddForm && this.data.photoPathInput) {
      wx.removeSavedFile({ filePath: this.data.photoPathInput })
    }
    this.setData({
      showAddForm: !this.data.showAddForm,
      selectedCollection: null,
      photoPathInput: '',
      validationMessage: '',
    })
  },

  onChoosePhoto() {
    if (this.data.isChoosingPhoto) return
    this.setData({ isChoosingPhoto: true, validationMessage: '' })
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (result) => {
        const photo = result.tempFiles[0]
        if (!photo || photo.size > 5 * 1024 * 1024) {
          this.setData({
            isChoosingPhoto: false,
            validationMessage: '请选择小于 5MB 的照片',
          })
          return
        }
        wx.saveFile({
          tempFilePath: photo.tempFilePath,
          success: (saveResult) => {
            const previousPath = this.data.photoPathInput
            this.setData({
              photoPathInput: saveResult.savedFilePath,
              isChoosingPhoto: false,
            })
            if (previousPath) wx.removeSavedFile({ filePath: previousPath })
          },
          fail: () => {
            this.setData({
              isChoosingPhoto: false,
              validationMessage: '照片保存失败，请检查本地存储空间',
            })
          },
        })
      },
      fail: () => this.setData({ isChoosingPhoto: false }),
    })
  },

  onRemovePhoto() {
    const photoPath = this.data.photoPathInput
    if (photoPath) wx.removeSavedFile({ filePath: photoPath })
    this.setData({ photoPathInput: '' })
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
      photoPath: this.data.photoPathInput || null,
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
      photoPathInput: '',
      isChoosingPhoto: false,
      validationMessage: '',
    })
    this.refreshCollections()
    if (this.data.isGuidedMuseumStep) {
      onboardingFlowService.clear()
      wx.showToast({ title: '财富档案已建立', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/freedom/freedom' }), 350)
    }
  },

  onExitGuide() {
    onboardingFlowService.clear()
    this.setData({
      isGuidedMuseumStep: false,
      showAddForm: false,
    })
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
