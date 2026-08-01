import { ThemePreset } from '../../models/theme'
import { themeService } from '../../services/themeService'

const normalizePreviewColor = (value: string): string => {
  const trimmed = value.trim().toUpperCase()
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

Page({
  data: {
    presets: themeService.getPresets() as ThemePreset[],
    selectedColor: themeService.getProfile().primaryColor,
    customColor: themeService.getProfile().primaryColor,
    previewColor: themeService.getProfile().primaryColor,
    themePageStyle: themeService.getPageStyle(),
    validationMessage: '',
  },

  onShow() {
    const profile = themeService.getProfile()
    this.setData({
      selectedColor: profile.primaryColor,
      customColor: profile.primaryColor,
      previewColor: profile.primaryColor,
      themePageStyle: themeService.getPageStyle(),
    })
  },

  onSelectPreset(event: WechatMiniprogram.BaseEvent<{}, { color: string }>) {
    const color = event.currentTarget.dataset.color
    this.setData({
      selectedColor: color,
      customColor: color,
      previewColor: color,
      validationMessage: '',
    })
  },

  onCustomColorInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const customColor = event.detail.value
    const normalized = normalizePreviewColor(customColor)
    this.setData({
      customColor,
      previewColor: /^#[0-9A-F]{6}$/.test(normalized) ? normalized : this.data.previewColor,
      validationMessage: '',
    })
  },

  onSaveTheme() {
    const result = themeService.saveThemeColor(this.data.customColor)
    if (!result.success || !result.profile) {
      this.setData({ validationMessage: result.message })
      return
    }
    this.setData({
      selectedColor: result.profile.primaryColor,
      customColor: result.profile.primaryColor,
      previewColor: result.profile.primaryColor,
      themePageStyle: themeService.getPageStyle(),
      validationMessage: '',
    })
    wx.showToast({ title: '主题已更新', icon: 'success' })
  },
})
