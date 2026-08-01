import {
  InvestmentOption,
  InvestmentRecord,
  InvestmentRecordInput,
  InvestmentRecordStatus,
  InvestmentRecordType,
  InvestmentRecordView,
} from '../models/investment'
import { formatAmount, formatSignedAmount, formatSignedProgress } from '../utils/format'
import { storageService } from './storageService'

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const TYPE_OPTIONS: ReadonlyArray<InvestmentOption<InvestmentRecordType>> = [
  { value: 'stock', label: '股票' },
  { value: 'fund', label: '基金' },
  { value: 'etf', label: 'ETF' },
  { value: 'other', label: '其他' },
]
const STATUS_OPTIONS: ReadonlyArray<InvestmentOption<InvestmentRecordStatus>> = [
  { value: 'holding', label: '持有' },
  { value: 'closed', label: '已结束' },
]

const isType = (value: unknown): value is InvestmentRecordType =>
  value === 'stock' || value === 'fund' || value === 'etf' || value === 'other'

const isStatus = (value: unknown): value is InvestmentRecordStatus =>
  value === 'holding' || value === 'closed'

const isAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const isValidInput = (input: InvestmentRecordInput): boolean => {
  if (
    typeof input.name !== 'string' || !input.name.trim() ||
    !isType(input.type) || !isStatus(input.status) ||
    !isAmount(input.investedAmount) || input.investedAmount <= 0 ||
    !isAmount(input.currentAmount) || !MONTH_PATTERN.test(input.startDate) ||
    typeof input.reason !== 'string' || !input.reason.trim() ||
    typeof input.lesson !== 'string'
  ) {
    return false
  }
  return input.status === 'closed'
    ? Boolean(input.endDate && MONTH_PATTERN.test(input.endDate) && input.endDate >= input.startDate)
    : input.endDate === undefined
}

const isRecord = (value: unknown): value is InvestmentRecord => {
  if (!value || typeof value !== 'object') return false
  const record = value as InvestmentRecord
  return (
    typeof record.id === 'string' && typeof record.createdAt === 'number' &&
    Number.isFinite(record.createdAt) && record.createdAt > 0 && isValidInput(record)
  )
}

const toView = (record: InvestmentRecord): InvestmentRecordView => {
  const resultAmount = Math.round((record.currentAmount - record.investedAmount) * 100) / 100
  const resultRate = record.investedAmount > 0
    ? Math.round((resultAmount / record.investedAmount) * 10000) / 10000
    : null
  const typeOption = TYPE_OPTIONS.find((item) => item.value === record.type)
  const statusOption = STATUS_OPTIONS.find((item) => item.value === record.status)
  return {
    ...record,
    typeLabel: typeOption ? typeOption.label : '其他',
    statusLabel: statusOption ? statusOption.label : record.status,
    investedAmountText: formatAmount(record.investedAmount),
    currentAmountText: formatAmount(record.currentAmount),
    resultAmount,
    resultAmountText: formatSignedAmount(resultAmount),
    resultRate,
    resultRateText: resultRate === null ? '暂无' : formatSignedProgress(resultRate),
  }
}

const saveList = (records: InvestmentRecord[]): boolean => {
  const saved = storageService.set(storageService.keys.investmentRecords, records)
  if (saved) storageService.set(storageService.keys.investmentRecordsUpdatedAt, Date.now())
  return saved
}

export const investmentService = {
  getCurrentMonth(): string {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  },

  getTypeOptions(): InvestmentOption<InvestmentRecordType>[] {
    return TYPE_OPTIONS.map((item) => ({ ...item }))
  },

  getStatusOptions(): InvestmentOption<InvestmentRecordStatus>[] {
    return STATUS_OPTIONS.map((item) => ({ ...item }))
  },

  getRecordList(): InvestmentRecord[] {
    const stored = storageService.get<unknown>(storageService.keys.investmentRecords)
    if (!Array.isArray(stored)) return []
    return stored.filter(isRecord).map((item) => ({ ...item })).sort((a, b) => b.createdAt - a.createdAt)
  },

  getRecordViews(): InvestmentRecordView[] {
    return this.getRecordList().map(toView)
  },

  addRecord(input: InvestmentRecordInput): InvestmentRecord | null {
    if (!isValidInput(input)) return null
    const record: InvestmentRecord = {
      ...input,
      name: input.name.trim(),
      reason: input.reason.trim(),
      lesson: input.lesson.trim(),
      createdAt: Date.now(),
      id: `investment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }
    return saveList([record, ...this.getRecordList()]) ? record : null
  },

  updateRecord(id: string, input: InvestmentRecordInput): InvestmentRecord | null {
    if (!isValidInput(input)) return null
    const records = this.getRecordList()
    const index = records.findIndex((item) => item.id === id)
    if (index < 0) return null
    const record: InvestmentRecord = {
      ...records[index],
      ...input,
      name: input.name.trim(),
      reason: input.reason.trim(),
      lesson: input.lesson.trim(),
    }
    records[index] = record
    return saveList(records) ? record : null
  },

  deleteRecord(id: string): boolean {
    const records = this.getRecordList()
    const nextRecords = records.filter((item) => item.id !== id)
    return nextRecords.length !== records.length && saveList(nextRecords)
  },
}
