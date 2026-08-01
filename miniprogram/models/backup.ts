import { Asset } from './asset'
import { FreedomGoal } from './freedom'
import { InvestmentRecord } from './investment'
import { LivingCostProfile } from './livingCost'
import { MuseumCollection } from './museum'
import { WealthReport } from './report'
import { AssetSnapshot } from './snapshot'
import { ThemeProfile } from './theme'

export interface BackupUserData {
  joinedAt: number
  freedomGoal: FreedomGoal | null
}

export interface WealthBackup {
  version: '1.0'
  exportedAt: number
  user: BackupUserData
  assets: Asset[]
  snapshots: AssetSnapshot[]
  reports: WealthReport[]
  museum: MuseumCollection[]
  livingCost: LivingCostProfile | null
  investments: InvestmentRecord[]
  theme?: ThemeProfile
}

export interface WealthArchiveStats {
  joinedAt: number
  joinedDays: number
  assetCount: number
  snapshotCount: number
  reportCount: number
  museumCount: number
  investmentCount: number
}

export interface BackupCheck {
  lastBackupAt: number | null
  lastBackupText: string
  state: 'never' | 'outdated' | 'current'
  title: string
  description: string
}

export interface BackupOperationResult {
  success: boolean
  message: string
  usedClipboard?: boolean
}
