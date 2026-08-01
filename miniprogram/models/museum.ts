export type MuseumCollectionType =
  | 'physical'
  | 'experience'
  | 'life_event'
  | 'income_event'

export type MuseumCollectionStatus = 'active' | 'retired'

export interface MuseumCollection {
  id: string
  type: MuseumCollectionType
  name: string
  amount: number
  startDate: string
  status: MuseumCollectionStatus
  retiredDate: string | null
  story: string
  photoPath: string | null
  createdAt: number
  updatedAt: number
}

export interface MuseumCollectionInput {
  type: MuseumCollectionType
  name: string
  amount: number
  startDate: string
  status: MuseumCollectionStatus
  retiredDate?: string | null
  story?: string
  photoPath?: string | null
}

export interface MuseumTypeOption {
  value: MuseumCollectionType
  label: string
}

export interface MuseumStatusOption {
  value: MuseumCollectionStatus
  label: string
}

export interface MuseumCollectionView extends MuseumCollection {
  typeLabel: string
  statusLabel: string
  usageDays: number
  dailyCost: number | null
  amountText: string
  dailyCostText: string | null
}
