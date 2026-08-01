export type OnboardingStep = 'asset' | 'living_cost' | 'museum'

export type NoviceTipId = 'wealth_health' | 'investment_review'

export interface OnboardingFlowState {
  step: OnboardingStep
  updatedAt: number
}
