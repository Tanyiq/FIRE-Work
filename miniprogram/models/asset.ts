export type AssetType =
  | 'cash'
  | 'deposit'
  | 'fund'
  | 'dividend'
  | 'stock'
  | 'gold'
  | 'other'

export interface Asset {
  id: string
  type: AssetType
  name: string
  currentAmount: number
  createdAt: number
  updatedAt: number
}

export interface AssetInput {
  type: AssetType
  name: string
  currentAmount: number
}

export interface AssetTypeOption {
  value: AssetType
  label: string
}

export interface AssetCategorySummary extends AssetTypeOption {
  totalAmount: number
  assets: Asset[]
}
