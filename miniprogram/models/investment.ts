export type InvestmentRecordType = 'stock' | 'fund' | 'etf' | 'other'

export type InvestmentRecordStatus = 'holding' | 'closed'

export interface InvestmentRecord {
  id: string
  name: string
  type: InvestmentRecordType
  investedAmount: number
  currentAmount: number
  startDate: string
  endDate?: string
  status: InvestmentRecordStatus
  reason: string
  lesson: string
  createdAt: number
}

export interface InvestmentRecordInput {
  name: string
  type: InvestmentRecordType
  investedAmount: number
  currentAmount: number
  startDate: string
  endDate?: string
  status: InvestmentRecordStatus
  reason: string
  lesson: string
}

export interface InvestmentOption<T extends string> {
  value: T
  label: string
}

export interface InvestmentRecordView extends InvestmentRecord {
  typeLabel: string
  statusLabel: string
  investedAmountText: string
  currentAmountText: string
  resultAmount: number
  resultAmountText: string
  resultRate: number | null
  resultRateText: string
}
