export type FreedomLevel = 'Lv0' | 'Lv1' | 'Lv2' | 'Lv3' | 'Lv4'

export type SelectableFreedomLevel = Exclude<FreedomLevel, 'Lv0'>

export interface FreedomStage {
  level: FreedomLevel
  name: string
  description: string
  targetAsset: number
}

export interface FreedomGoal extends FreedomStage {
  level: SelectableFreedomLevel
}

export interface FreedomGoalView extends FreedomGoal {
  targetAssetText: string
}

export interface FreedomDashboard {
  currentLevel: FreedomLevel
  currentLevelName: string
  currentAsset: number
  currentAssetText: string
  goal: FreedomGoal
  targetAssetText: string
  progressPercent: number
  progressText: string
  remainingAsset: number
  remainingAssetText: string
  isGoalReached: boolean
}

export interface SaveFreedomResult {
  success: boolean
  message: string
  dashboard: FreedomDashboard | null
}

export interface FreedomStatus {
  level: FreedomLevel
  levelName: string
  progress: number
  targetAsset: number | null
}
