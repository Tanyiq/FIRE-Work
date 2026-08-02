export interface DataProtectionRule {
  id: 'snapshot-history' | 'report-history' | 'museum-attribution'
  title: string
  description: string
}

export interface DataIntegritySummary {
  version: 'v1.1.1'
  snapshotCount: number
  reportCount: number
  rules: DataProtectionRule[]
}
