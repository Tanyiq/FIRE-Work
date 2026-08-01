export type OnboardingStep = 'asset' | 'living_cost' | 'museum'

export interface OnboardingFlowState {
  step: OnboardingStep
  updatedAt: number
}
