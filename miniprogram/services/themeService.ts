import { SaveThemeResult, ThemePalette, ThemePreset, ThemeProfile } from '../models/theme'
import { storageService } from './storageService'

const DEFAULT_COLOR = '#536A8A'
const HEX_PATTERN = /^#[0-9A-F]{6}$/
const MIN_WHITE_TEXT_CONTRAST = 4.5

const PRESETS: ReadonlyArray<ThemePreset> = [
  { id: 'dusk-blue', name: '暮蓝', color: '#536A8A' },
  { id: 'amber', name: '琥珀', color: '#9A6038' },
  { id: 'wisteria', name: '紫藤', color: '#70639A' },
  { id: 'rosewood', name: '玫瑰木', color: '#92566A' },
  { id: 'graphite', name: '石墨', color: '#59636B' },
]

const normalizeColor = (value: string): string => {
  const trimmed = value.trim().toUpperCase()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  return withHash
}

const hexToRgb = (color: string): [number, number, number] => [
  Number.parseInt(color.slice(1, 3), 16),
  Number.parseInt(color.slice(3, 5), 16),
  Number.parseInt(color.slice(5, 7), 16),
]

const mixColor = (color: string, target: '#000000' | '#FFFFFF', ratio: number): string => {
  const source = hexToRgb(color)
  const destination = hexToRgb(target)
  const channels = source.map((value, index) =>
    Math.round(value + (destination[index] - value) * ratio),
  )
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

const hasReadableWhiteText = (color: string): boolean => {
  const channels = hexToRgb(color).map((value) => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return 1.05 / (luminance + 0.05) >= MIN_WHITE_TEXT_CONTRAST
}

const isThemeProfile = (value: unknown): value is ThemeProfile => {
  if (!value || typeof value !== 'object') return false
  const profile = value as ThemeProfile
  return HEX_PATTERN.test(profile.primaryColor) && typeof profile.updatedAt === 'number'
}

const createPalette = (primary: string): ThemePalette => ({
  primary,
  dark: mixColor(primary, '#000000', 0.28),
  end: mixColor(primary, '#FFFFFF', 0.18),
  soft: mixColor(primary, '#FFFFFF', 0.86),
  surface: mixColor(primary, '#FFFFFF', 0.94),
})

const createPageStyle = (primaryColor: string): string => {
  const palette = createPalette(primaryColor)
  return [
    `--color-brand:${palette.primary}`,
    `--color-brand-dark:${palette.dark}`,
    `--color-brand-end:${palette.end}`,
    `--color-brand-soft:${palette.soft}`,
    `--color-brand-surface:${palette.surface}`,
  ].join(';')
}

export const themeService = {
  getPresets(): ThemePreset[] {
    return PRESETS.map((preset) => ({ ...preset }))
  },

  getProfile(): ThemeProfile {
    const stored = storageService.get<unknown>(storageService.keys.themeProfile)
    return isThemeProfile(stored)
      ? { ...stored }
      : { primaryColor: DEFAULT_COLOR, updatedAt: 0 }
  },

  getPageStyle(): string {
    return createPageStyle(this.getProfile().primaryColor)
  },

  getPalette(): ThemePalette {
    return createPalette(this.getProfile().primaryColor)
  },

  saveThemeColor(value: string): SaveThemeResult {
    const primaryColor = normalizeColor(value)
    if (!HEX_PATTERN.test(primaryColor)) {
      return { success: false, message: '请输入 6 位十六进制颜色，例如 #536A8A', profile: null }
    }
    if (!hasReadableWhiteText(primaryColor)) {
      return { success: false, message: '这个颜色下白色文字不够清晰，请选择更深的颜色', profile: null }
    }
    const profile: ThemeProfile = { primaryColor, updatedAt: Date.now() }
    if (!storageService.set(storageService.keys.themeProfile, profile)) {
      return { success: false, message: '主题保存失败，请重试', profile: null }
    }
    this.applyNativeTheme()
    return { success: true, message: '', profile }
  },

  applyNativeTheme() {
    const color = this.getProfile().primaryColor
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#F7F5EF' })
    wx.setTabBarStyle({ selectedColor: color, color: '#7A7D78', backgroundColor: '#FFFFFF' })
  },
}
