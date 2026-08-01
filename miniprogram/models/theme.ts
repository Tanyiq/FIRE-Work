export interface ThemeProfile {
  primaryColor: string
  updatedAt: number
}

export interface ThemePreset {
  id: string
  name: string
  color: string
}

export interface SaveThemeResult {
  success: boolean
  message: string
  profile: ThemeProfile | null
}

export interface ThemePalette {
  primary: string
  dark: string
  end: string
  soft: string
  surface: string
}
