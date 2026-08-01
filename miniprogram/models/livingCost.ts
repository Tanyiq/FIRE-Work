export interface LivingCostCategories {
  rent: number
  food: number
  transport: number
  other: number
}

export interface LivingCostInput extends LivingCostCategories {
  comfortableExtraCost: number
}

export interface LivingCostProfile extends LivingCostInput {
  essentialMonthlyCost: number
  comfortableMonthlyCost: number
  updatedAt: number
}

export interface LivingCostSummary extends LivingCostProfile {
  rentText: string
  foodText: string
  transportText: string
  otherText: string
  essentialMonthlyCostText: string
  comfortableExtraCostText: string
  comfortableMonthlyCostText: string
}
