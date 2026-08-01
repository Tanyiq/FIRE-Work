import { MuseumCollectionType, MuseumCollectionView } from '../../models/museum'
import { museumService } from '../../services/museumService'
import { onboardingFlowService } from '../../services/onboardingFlowService'
import { themeService } from '../../services/themeService'

const initialCollections = museumService.getCollectionViews()
const initialMuseumGuide = onboardingFlowService.getStep() === 'museum'

const getStatusFieldLabel = (type: MuseumCollectionType): string => {
  if (type === 'physical') return '使用状态'
  if (type === 'income_event') return '收益状态'
  return '当前状态'
}

const getRetiredDateLabel = (type: MuseumCollectionType): string =>
  type === 'physical' ? '退役 / 牺牲日期' : '结束日期'

const createFormData = () => ({
  editingCollectionId: '',
  selectedTypeIndex: 0,
  selectedTypeLabel: '实物',
  statusOptions: museumService.getStatusOptions('physical'),
  selectedStatusIndex: 0,
  statusFieldLabel: '使用状态',
  retiredDateLabel: '退役 / 牺牲日期',
  nameInput: '',
  amountInput: '',
  startDate: museumService.getToday(),
  retiredDate: museumService.getToday(),
  storyInput: '',
  photoPathInput: '',
  originalPhotoPath: '',
  isChoosingPhoto: false,
  validationMessage: '',
})

Page({
  data: {
    collections: initialCollections,
    selectedCollection: null as MuseumCollectionView | null,
    showAddForm: initialMuseumGuide && initialCollections.length === 0,
    typeOptions: museumService.getTypeOptions(),
    today: museumService.getToday(),
    isGuidedMuseumStep: initialMuseumGuide,
    themePageStyle: themeService.getPageStyle(),
    ...createFormData(),
  },

  onShow() {
    this.refreshCollections()
  },

  onUnload() {
    if (
      this.data.showAddForm &&
      this.data.photoPathInput &&
      this.data.photoPathInput !== this.data.originalPhotoPath
    ) {
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
    if (
      this.data.showAddForm &&
      this.data.photoPathInput &&
      this.data.photoPathInput !== this.data.originalPhotoPath
    ) {
      wx.removeSavedFile({ filePath: this.data.photoPathInput })
    }
    const showAddForm = !this.data.showAddForm
    this.setData({
      ...createFormData(),
      showAddForm,
      selectedCollection: null,
    }, () => {
      if (showAddForm) wx.pageScrollTo({ selector: '#collectionForm', duration: 250 })
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
            if (previousPath && previousPath !== this.data.originalPhotoPath) {
              wx.removeSavedFile({ filePath: previousPath })
            }
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
    if (photoPath && photoPath !== this.data.originalPhotoPath) {
      wx.removeSavedFile({ filePath: photoPath })
    }
    this.setData({ photoPathInput: '' })
  },

  onTypeChange(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const selectedTypeIndex = Number(event.detail.value)
    const type = this.data.typeOptions[selectedTypeIndex].value
    const statusOptions = museumService.getStatusOptions(type)
    this.setData({
      selectedTypeIndex,
      selectedTypeLabel: this.data.typeOptions[selectedTypeIndex].label,
      statusOptions,
      statusFieldLabel: getStatusFieldLabel(type),
      retiredDateLabel: getRetiredDateLabel(type),
      validationMessage: '',
    })
  },

  onStatusSelect(
    event: WechatMiniprogram.BaseEvent<{}, { index: number }>,
  ) {
    const selectedStatusIndex = Number(event.currentTarget.dataset.index)
    this.setData({
      selectedStatusIndex,
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

  onSaveCollection() {
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

    const input = {
      type,
      name: this.data.nameInput,
      amount: Math.round(amount * 100) / 100,
      startDate: this.data.startDate,
      status,
      retiredDate: status === 'retired' ? this.data.retiredDate : null,
      story: this.data.storyInput,
      photoPath: this.data.photoPathInput || null,
    }
    const collection = this.data.editingCollectionId
      ? museumService.updateCollection(this.data.editingCollectionId, input)
      : museumService.addCollection(input)
    if (!collection) {
      this.setData({ validationMessage: '保存失败，请检查日期后重试' })
      return
    }

    this.setData({
      ...createFormData(),
      showAddForm: false,
    })
    this.refreshCollections()
    if (this.data.isGuidedMuseumStep) {
      onboardingFlowService.clear()
      wx.switchTab({
        url: '/pages/freedom/freedom',
        success: () => wx.showToast({ title: '财富档案已建立', icon: 'success' }),
      })
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

  onEditCollection() {
    const collection = this.data.selectedCollection
    if (!collection) return
    const selectedTypeIndex = this.data.typeOptions.findIndex(
      (option) => option.value === collection.type,
    )
    const selectedStatusIndex = collection.status === 'retired' ? 1 : 0
    const statusOptions = museumService.getStatusOptions(collection.type)
    this.setData({
      editingCollectionId: collection.id,
      selectedCollection: null,
      showAddForm: true,
      selectedTypeIndex,
      selectedTypeLabel: this.data.typeOptions[selectedTypeIndex].label,
      statusOptions,
      selectedStatusIndex,
      statusFieldLabel: getStatusFieldLabel(collection.type),
      retiredDateLabel: getRetiredDateLabel(collection.type),
      nameInput: collection.name,
      amountInput: String(collection.amount),
      startDate: collection.startDate,
      retiredDate: collection.retiredDate || museumService.getToday(),
      storyInput: collection.story,
      photoPathInput: collection.photoPath || '',
      originalPhotoPath: collection.photoPath || '',
      validationMessage: '',
    }, () => wx.pageScrollTo({ selector: '#collectionForm', duration: 250 }))
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
