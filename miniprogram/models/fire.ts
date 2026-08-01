export interface FireScenario {
  id: string
  name: string
  description: string
  expectedRate: number
  requiredAsset: number
}

export interface FireScenarioView extends FireScenario {
  expectedRateText: string
  requiredAssetText: string
}
