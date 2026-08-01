import { OnboardingFlowState, OnboardingStep } from '../models/onboarding'
import { storageService } from './storageService'

const STEPS: OnboardingStep[] = ['asset', 'living_cost', 'museum']

const isStep = (value: unknown): value is OnboardingStep =>
  typeof value === 'string' && STEPS.indexOf(value as OnboardingStep) >= 0

export const onboardingFlowService = {
  getStep(): OnboardingStep | null {
    const state = storageService.get<OnboardingFlowState>(storageService.keys.onboardingFlow)
    return state && isStep(state.step) ? state.step : null
  },

  setStep(step: OnboardingStep): boolean {
    return storageService.set<OnboardingFlowState>(storageService.keys.onboardingFlow, {
      step,
      updatedAt: Date.now(),
    })
  },

  clear(): boolean {
    return storageService.remove(storageService.keys.onboardingFlow)
  },
}
