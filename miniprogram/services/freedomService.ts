import {
  FreedomDashboard,
  FreedomGoal,
  FreedomGoalView,
  FreedomLevel,
  FreedomStatus,
  FreedomStage,
  SaveFreedomResult,
  SelectableFreedomLevel,
} from '../models/freedom'
import { UserFreedomProfile } from '../models/user'
import { formatAmount, formatProgress } from '../utils/format'
import { assetService } from './assetService'
import { storageService } from './storageService'

const TEN_THOUSAND = 10000

let freedomConfigurationChangeListener: (() => void) | null = null

const FREEDOM_STAGES: ReadonlyArray<FreedomStage> = [
  {
    level: 'Lv0',
    name: '生存模式',
    description: '完全依赖劳动收入，尚未建立安全储备。',
    targetAsset: 0,
  },
  {
    level: 'Lv1',
    name: '最低自由',
    description: '满足吃饭、住房等基本生活需求。',
    targetAsset: 60 * TEN_THOUSAND,
  },
  {
    level: 'Lv2',
    name: '稳定自由',
    description: '在小城市正常生活，并能应对突发事件。',
    targetAsset: 120 * TEN_THOUSAND,
  },
  {
    level: 'Lv3',
    name: '舒适自由',
    description: '发展兴趣、偶尔旅行，不为日常消费焦虑。',
    targetAsset: 200 * TEN_THOUSAND,
  },
  {
    level: 'Lv4',
    name: '富足自由',
    description: '拥有高质量生活，并有能力支持家庭。',
    targetAsset: 500 * TEN_THOUSAND,
  },
]

const isSelectableLevel = (value: unknown): value is SelectableFreedomLevel =>
  value === 'Lv1' || value === 'Lv2' || value === 'Lv3' || value === 'Lv4'

const isValidGoal = (value: unknown): value is FreedomGoal => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const goal = value as FreedomGoal
  return (
    isSelectableLevel(goal.level) &&
    typeof goal.name === 'string' &&
    typeof goal.description === 'string' &&
    typeof goal.targetAsset === 'number' &&
    Number.isFinite(goal.targetAsset) &&
    goal.targetAsset > 0
  )
}

const getGoalByLevel = (level: SelectableFreedomLevel): FreedomGoal => {
  const stage = FREEDOM_STAGES.find((item) => item.level === level)
  if (!stage) {
    throw new Error(`Unknown freedom level: ${level}`)
  }

  return { ...stage, level }
}

const getCurrentStage = (currentAsset: number): FreedomStage => {
  return FREEDOM_STAGES.reduce((current, stage) => {
    return currentAsset >= stage.targetAsset ? stage : current
  }, FREEDOM_STAGES[0])
}

const calculateContinuousFreedomIndex = (currentAsset: number): number => {
  const thresholds = FREEDOM_STAGES.map((stage) => stage.targetAsset)
  if (currentAsset >= thresholds[thresholds.length - 1]) return 4
  for (let index = 0; index < thresholds.length - 1; index += 1) {
    const start = thresholds[index]
    const end = thresholds[index + 1]
    if (currentAsset < end) {
      return Math.round((index + (currentAsset - start) / (end - start)) * 10) / 10
    }
  }
  return 4
}

const getAccumulationStageName = (continuousLevel: number): string => {
  if (continuousLevel < 1) return '财富起步阶段'
  if (continuousLevel < 2) return '稳定积累阶段'
  if (continuousLevel < 3) return '舒适成长阶段'
  if (continuousLevel < 4) return '富足积累阶段'
  return '目标生活阶段'
}

const createDashboard = (profile: UserFreedomProfile): FreedomDashboard => {
  const currentAsset = assetService.calculateTotalAsset()
  const currentStage = getCurrentStage(currentAsset)
  const rawProgress = (currentAsset / profile.freedomGoal.targetAsset) * 100
  const progressPercent = Math.min(100, Math.round(rawProgress * 10) / 10)
  const remainingProgress = Math.max(0, Math.round((1 - progressPercent / 100) * 10000) / 10000)
  const continuousLevel = calculateContinuousFreedomIndex(currentAsset)
  const remainingAsset = Math.max(0, profile.freedomGoal.targetAsset - currentAsset)

  return {
    currentLevel: currentStage.level,
    currentLevelName: currentStage.name,
    currentAsset,
    currentAssetText: formatAmount(currentAsset),
    goal: profile.freedomGoal,
    targetAssetText: formatAmount(profile.freedomGoal.targetAsset),
    progressPercent,
    progressText: formatProgress(progressPercent / 100),
    remainingProgress,
    remainingProgressText: formatProgress(remainingProgress),
    continuousLevel,
    continuousLevelText: `Lv${continuousLevel.toFixed(1)}`,
    accumulationStageName: getAccumulationStageName(continuousLevel),
    remainingAsset,
    remainingAssetText: formatAmount(remainingAsset),
    isGoalReached: remainingAsset === 0,
  }
}

const getProfile = (): UserFreedomProfile | null => {
  const freedomGoal = storageService.get<FreedomGoal>(storageService.keys.freedomGoal)
  if (!isValidGoal(freedomGoal)) {
    return null
  }

  return { freedomGoal }
}

export const freedomService = {
  registerConfigurationChangeListener(listener: () => void) {
    freedomConfigurationChangeListener = listener
  },

  getGoalOptions(): FreedomGoalView[] {
    return FREEDOM_STAGES.filter((stage) => stage.level !== 'Lv0').map((stage) =>
      {
        const goal = getGoalByLevel(stage.level as SelectableFreedomLevel)
        return { ...goal, targetAssetText: formatAmount(goal.targetAsset) }
      },
    )
  },

  getDashboard(): FreedomDashboard | null {
    const profile = getProfile()
    return profile ? createDashboard(profile) : null
  },

  calculateContinuousFreedomIndex,

  calculateFreedomStatus(currentAsset: number): FreedomStatus {
    const currentStage = getCurrentStage(currentAsset)
    const freedomGoal = storageService.get<FreedomGoal>(storageService.keys.freedomGoal)
    const targetAsset = isValidGoal(freedomGoal) ? freedomGoal.targetAsset : null
    const progress = targetAsset ? Math.min(1, currentAsset / targetAsset) : 0

    return {
      level: currentStage.level,
      levelName: currentStage.name,
      progress: Math.round(progress * 10000) / 10000,
      targetAsset,
    }
  },

  saveConfiguration(level: FreedomLevel | ''): SaveFreedomResult {
    if (!isSelectableLevel(level)) {
      return { success: false, message: '请选择一个目标生活等级', dashboard: null }
    }

    const freedomGoal = getGoalByLevel(level)
    const goalSaved = storageService.set(storageService.keys.freedomGoal, freedomGoal)

    if (!goalSaved) {
      return { success: false, message: '保存失败，请检查本地存储后重试', dashboard: null }
    }

    if (freedomConfigurationChangeListener) {
      freedomConfigurationChangeListener()
    }

    return {
      success: true,
      message: '',
      dashboard: createDashboard({ freedomGoal }),
    }
  },
}
