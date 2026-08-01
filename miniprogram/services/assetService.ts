import {
  Asset,
  AssetCategorySummary,
  AssetInput,
  AssetType,
  AssetTypeOption,
} from '../models/asset'
import { storageService } from './storageService'

const ASSET_TYPE_OPTIONS: ReadonlyArray<AssetTypeOption> = [
  { value: 'cash', label: '活钱' },
  { value: 'deposit', label: '定存' },
  { value: 'fund', label: '基金' },
  { value: 'dividend', label: '红利资产' },
  { value: 'stock', label: '股票' },
  { value: 'gold', label: '黄金' },
  { value: 'other', label: '其他资产' },
]

const ASSET_TYPES = ASSET_TYPE_OPTIONS.map((option) => option.value)

let assetChangeListener: (() => void) | null = null

const isAssetType = (value: unknown): value is AssetType =>
  typeof value === 'string' && ASSET_TYPES.includes(value as AssetType)

const isValidAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const isAsset = (value: unknown): value is Asset => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const asset = value as Asset
  return (
    typeof asset.id === 'string' &&
    isAssetType(asset.type) &&
    typeof asset.name === 'string' &&
    asset.name.trim().length > 0 &&
    isValidAmount(asset.currentAmount) &&
    typeof asset.createdAt === 'number' &&
    typeof asset.updatedAt === 'number'
  )
}

const isValidInput = (input: AssetInput): boolean =>
  isAssetType(input.type) && input.name.trim().length > 0 && isValidAmount(input.currentAmount)

const saveAssetList = (assets: Asset[]): boolean => {
  const saved = storageService.set(storageService.keys.assets, assets)
  if (saved && assetChangeListener) {
    assetChangeListener()
  }
  return saved
}

const createAssetId = (): string =>
  `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export const assetService = {
  registerAssetChangeListener(listener: () => void) {
    assetChangeListener = listener
  },

  getAssetTypeOptions(): AssetTypeOption[] {
    return ASSET_TYPE_OPTIONS.map((option) => ({ ...option }))
  },

  getAssetList(): Asset[] {
    const storedAssets = storageService.get<unknown>(storageService.keys.assets)
    if (!Array.isArray(storedAssets)) {
      return []
    }

    return storedAssets.filter(isAsset).map((asset) => ({ ...asset }))
  },

  addAsset(input: AssetInput): Asset | null {
    if (!isValidInput(input)) {
      return null
    }

    const now = Date.now()
    const asset: Asset = {
      id: createAssetId(),
      type: input.type,
      name: input.name.trim(),
      currentAmount: input.currentAmount,
      createdAt: now,
      updatedAt: now,
    }
    const assets = [...this.getAssetList(), asset]
    return saveAssetList(assets) ? asset : null
  },

  deleteAsset(id: string): boolean {
    const assets = this.getAssetList()
    const nextAssets = assets.filter((asset) => asset.id !== id)
    return nextAssets.length !== assets.length && saveAssetList(nextAssets)
  },

  updateAsset(id: string, updates: Partial<AssetInput>): Asset | null {
    const assets = this.getAssetList()
    const index = assets.findIndex((asset) => asset.id === id)
    if (index < 0) {
      return null
    }

    const current = assets[index]
    const nextInput: AssetInput = {
      type: updates.type ?? current.type,
      name: updates.name ?? current.name,
      currentAmount: updates.currentAmount ?? current.currentAmount,
    }
    if (!isValidInput(nextInput)) {
      return null
    }

    const updatedAsset: Asset = {
      ...current,
      ...nextInput,
      name: nextInput.name.trim(),
      updatedAt: Date.now(),
    }
    assets[index] = updatedAsset
    return saveAssetList(assets) ? updatedAsset : null
  },

  calculateTotalAsset(): number {
    const total = this.getAssetList().reduce((sum, asset) => sum + asset.currentAmount, 0)
    return Math.round(total * 100) / 100
  },

  getCategorySummaries(): AssetCategorySummary[] {
    const assets = this.getAssetList()
    return ASSET_TYPE_OPTIONS.map((option) => {
      const categoryAssets = assets.filter((asset) => asset.type === option.value)
      const totalAmount = categoryAssets.reduce((total, asset) => total + asset.currentAmount, 0)
      return { ...option, totalAmount, assets: categoryAssets }
    }).filter((category) => category.assets.length > 0)
  },
}
