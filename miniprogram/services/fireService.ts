import { FireScenario, FireScenarioView } from '../models/fire'
import { formatAmount, formatProgress } from '../utils/format'

type FireScenarioDefinition = Omit<FireScenario, 'requiredAsset'>

const SCENARIOS: ReadonlyArray<FireScenarioDefinition> = [
  {
    id: 'conservative',
    name: '保守自由',
    description: '主要依靠低风险资产收益维持生活。',
    expectedRate: 0.02,
  },
  {
    id: 'balanced',
    name: '平衡自由',
    description: '定存、红利资产与稳健投资组合。',
    expectedRate: 0.05,
  },
  {
    id: 'investing',
    name: '投资自由',
    description: '长期投资组合，接受一定波动。',
    expectedRate: 0.08,
  },
]

const calculateRequiredAsset = (monthlyCost: number, expectedRate: number): number => {
  if (!Number.isFinite(monthlyCost) || monthlyCost <= 0 || expectedRate <= 0) {
    return 0
  }
  return Math.round(((monthlyCost * 12) / expectedRate) * 100) / 100
}

const toView = (scenario: FireScenario): FireScenarioView => ({
  ...scenario,
  expectedRateText: formatProgress(scenario.expectedRate),
  requiredAssetText: formatAmount(scenario.requiredAsset),
})

export const fireService = {
  calculateRequiredAsset,

  getScenarios(monthlyCost: number): FireScenario[] {
    return SCENARIOS.map((scenario) => ({
      ...scenario,
      requiredAsset: calculateRequiredAsset(monthlyCost, scenario.expectedRate),
    }))
  },

  getScenarioViews(monthlyCost: number): FireScenarioView[] {
    return this.getScenarios(monthlyCost).map(toView)
  },

  getScenarioView(monthlyCost: number, id: string): FireScenarioView | null {
    const scenario = this.getScenarios(monthlyCost).find((item) => item.id === id)
    return scenario ? toView(scenario) : null
  },
}
