export interface LivingCostInput {
  rent: number
  food: number
  transport: number
  other: number
}

export interface LivingCostProfile extends LivingCostInput {
  monthlyTotal: number
  fireReferenceAsset: number
  updatedAt: number
}

export interface LivingCostSummary extends LivingCostProfile {
  rentText: string
  foodText: string
  transportText: string
  otherText: string
  monthlyTotalText: string
  fireReferenceAssetText: string
}
