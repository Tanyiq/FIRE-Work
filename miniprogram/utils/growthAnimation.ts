export interface GrowthAnimationValues {
  currentAsset: number
  progressPercent: number
  remainingProgress: number
}

export type CancelGrowthAnimation = () => void

const easeOutCubic = (progress: number): number => 1 - Math.pow(1 - progress, 3)

export const interpolateGrowthValues = (
  target: GrowthAnimationValues,
  progress: number,
): GrowthAnimationValues => {
  const eased = easeOutCubic(Math.max(0, Math.min(1, progress)))
  return {
    currentAsset: target.currentAsset * eased,
    progressPercent: target.progressPercent * eased,
    remainingProgress: 1 - (1 - target.remainingProgress) * eased,
  }
}

export const playGrowthAnimation = (
  target: GrowthAnimationValues,
  onFrame: (values: GrowthAnimationValues) => void,
  duration = 420,
): CancelGrowthAnimation => {
  const startedAt = Date.now()
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const tick = () => {
    if (cancelled) return
    const progress = Math.min(1, (Date.now() - startedAt) / duration)
    onFrame(interpolateGrowthValues(target, progress))
    if (progress < 1) timer = setTimeout(tick, 16)
  }

  tick()
  return () => {
    cancelled = true
    if (timer !== null) clearTimeout(timer)
  }
}
