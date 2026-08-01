import { NoviceTipId } from '../models/onboarding'
import { storageService } from './storageService'

const getDismissedTips = (): NoviceTipId[] => {
  const tips = storageService.get<unknown>(storageService.keys.dismissedNoviceTips)
  return Array.isArray(tips)
    ? tips.filter(
        (tip): tip is NoviceTipId =>
          tip === 'wealth_health' || tip === 'investment_review' || tip === 'snapshot_baseline',
      )
    : []
}

export const noviceTipService = {
  shouldShow(tipId: NoviceTipId): boolean {
    return getDismissedTips().indexOf(tipId) < 0
  },

  dismiss(tipId: NoviceTipId): boolean {
    const dismissedTips = getDismissedTips()
    if (dismissedTips.indexOf(tipId) >= 0) return true
    return storageService.set(storageService.keys.dismissedNoviceTips, dismissedTips.concat(tipId))
  },
}
