const trimDecimal = (value: number, maximumFractionDigits: number): string => {
  const fixed = value.toFixed(maximumFractionDigits)
  return fixed.replace(/\.?0+$/, '')
}

export const formatAmount = (amount: number): string => {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  if (Math.abs(safeAmount) >= 10000) {
    return `${trimDecimal(safeAmount / 10000, 2)} 万元`
  }
  return `${trimDecimal(safeAmount, 2)} 元`
}

export const formatSignedAmount = (amount: number): string => {
  const prefix = amount > 0 ? '+' : ''
  return `${prefix}${formatAmount(amount)}`
}

export const formatProgress = (progress: number): string => {
  const safeProgress = Number.isFinite(progress) ? progress : 0
  return `${trimDecimal(safeProgress * 100, 1)}%`
}

export const formatSignedProgress = (progress: number): string => {
  const prefix = progress > 0 ? '+' : ''
  return `${prefix}${formatProgress(progress)}`
}
