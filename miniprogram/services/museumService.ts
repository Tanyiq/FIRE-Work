import {
  MuseumCollection,
  MuseumCollectionInput,
  MuseumCollectionStatus,
  MuseumCollectionType,
  MuseumCollectionView,
  LegacyMuseumCollectionType,
  MuseumStatusOption,
  MuseumTypeOption,
} from '../models/museum'
import { storageService } from './storageService'
import { formatAmount } from '../utils/format'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const TYPE_OPTIONS: ReadonlyArray<MuseumTypeOption> = [
  { value: 'physical', label: '实物' },
  { value: 'experience', label: '经历' },
]

const STATUS_LABELS: Record<
  MuseumCollectionType,
  Record<MuseumCollectionStatus, string>
> = {
  physical: { active: '使用中', retired: '已退役' },
  experience: { active: '体验中', retired: '已结束' },
}

type StoredMuseumCollection = Omit<MuseumCollection, 'type'> & {
  type: MuseumCollectionType | LegacyMuseumCollectionType
}

const padNumber = (value: number): string => String(value).padStart(2, '0')

const getToday = (): string => {
  const today = new Date()
  return `${today.getFullYear()}-${padNumber(today.getMonth() + 1)}-${padNumber(today.getDate())}`
}

const parseDate = (value: string): number | null => {
  if (!DATE_PATTERN.test(value)) {
    return null
  }

  const parts = value.split('-').map(Number)
  const timestamp = Date.UTC(parts[0], parts[1] - 1, parts[2])
  const parsed = new Date(timestamp)
  if (
    parsed.getUTCFullYear() !== parts[0] ||
    parsed.getUTCMonth() !== parts[1] - 1 ||
    parsed.getUTCDate() !== parts[2]
  ) {
    return null
  }

  return timestamp
}

const normalizeCollectionType = (value: unknown): MuseumCollectionType | null => {
  if (value === 'physical') return 'physical'
  if (value === 'experience' || value === 'life_event' || value === 'income_event') {
    return 'experience'
  }
  return null
}

const isCollectionType = (value: unknown): value is MuseumCollectionType =>
  value === 'physical' || value === 'experience'

const isCollectionStatus = (value: unknown): value is MuseumCollectionStatus =>
  value === 'active' || value === 'retired'

const isValidInput = (input: MuseumCollectionInput): boolean => {
  const startTimestamp = parseDate(input.startDate)
  const todayTimestamp = parseDate(getToday())
  if (
    !isCollectionType(input.type) ||
    !isCollectionStatus(input.status) ||
    !input.name.trim() ||
    !Number.isFinite(input.amount) ||
    input.amount < 0 ||
    startTimestamp === null ||
    todayTimestamp === null ||
    startTimestamp > todayTimestamp
  ) {
    return false
  }

  if (input.status === 'retired') {
    const retiredTimestamp = parseDate(input.retiredDate || '')
    return (
      retiredTimestamp !== null &&
      retiredTimestamp >= startTimestamp &&
      retiredTimestamp <= todayTimestamp
    )
  }

  return true
}

const isStoredCollection = (value: unknown): value is StoredMuseumCollection => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const collection = value as StoredMuseumCollection
  const normalizedType = normalizeCollectionType(collection.type)
  return (
    typeof collection.id === 'string' &&
    typeof collection.name === 'string' &&
    typeof collection.amount === 'number' &&
    typeof collection.startDate === 'string' &&
    (collection.retiredDate === null || typeof collection.retiredDate === 'string') &&
    typeof collection.story === 'string' &&
    (collection.photoPath === undefined ||
      collection.photoPath === null ||
      typeof collection.photoPath === 'string') &&
    typeof collection.createdAt === 'number' &&
    typeof collection.updatedAt === 'number' &&
    normalizedType !== null &&
    isValidInput({ ...collection, type: normalizedType })
  )
}

const saveCollectionList = (collections: MuseumCollection[]): boolean =>
  storageService.set(storageService.keys.museumCollections, collections)

const createCollectionId = (): string =>
  `museum_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const getTypeLabel = (type: MuseumCollectionType): string => {
  const option = TYPE_OPTIONS.find((item) => item.value === type)
  return option ? option.label : '收藏'
}

const createStatusOptions = (type: MuseumCollectionType): MuseumStatusOption[] => [
  { value: 'active', label: STATUS_LABELS[type].active },
  { value: 'retired', label: STATUS_LABELS[type].retired },
]

const getStatusLabel = (
  type: MuseumCollectionType,
  status: MuseumCollectionStatus,
): string => STATUS_LABELS[type][status]

const calculateUsageDays = (
  collection: MuseumCollection,
  referenceDate: string = getToday(),
): number => {
  const startTimestamp = parseDate(collection.startDate)
  const endDate =
    collection.status === 'retired' && collection.retiredDate
      ? collection.retiredDate
      : referenceDate
  const endTimestamp = parseDate(endDate)
  if (startTimestamp === null || endTimestamp === null || endTimestamp < startTimestamp) {
    return 0
  }

  return Math.max(1, Math.floor((endTimestamp - startTimestamp) / MILLISECONDS_PER_DAY))
}

const calculateDailyCost = (
  collection: MuseumCollection,
  referenceDate: string = getToday(),
): number | null => {
  const usageDays = calculateUsageDays(collection, referenceDate)
  if (usageDays === 0) {
    return null
  }

  return Math.round((collection.amount / usageDays) * 100) / 100
}

const toCollectionView = (collection: MuseumCollection): MuseumCollectionView => {
  const dailyCost = calculateDailyCost(collection)
  return {
    ...collection,
    typeLabel: getTypeLabel(collection.type),
    statusLabel: getStatusLabel(collection.type, collection.status),
    usageDays: calculateUsageDays(collection),
    dailyCost,
    amountText: formatAmount(collection.amount),
    dailyCostText: dailyCost === null ? null : formatAmount(dailyCost),
  }
}

export const museumService = {
  getToday,

  getTypeOptions(): MuseumTypeOption[] {
    return TYPE_OPTIONS.map((option) => ({ ...option }))
  },

  getStatusOptions(type: MuseumCollectionType = 'physical'): MuseumStatusOption[] {
    return createStatusOptions(type)
  },

  getCollectionList(): MuseumCollection[] {
    const storedCollections = storageService.get<unknown>(storageService.keys.museumCollections)
    if (!Array.isArray(storedCollections)) {
      return []
    }

    const stored = storedCollections.filter(isStoredCollection)
    const collections = stored
      .map((collection): MuseumCollection => ({
        ...collection,
        type: normalizeCollectionType(collection.type) as MuseumCollectionType,
        photoPath: collection.photoPath || null,
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
    if (stored.some((collection) => collection.type !== 'physical' && collection.type !== 'experience')) {
      saveCollectionList(collections)
    }
    return collections
  },

  getCollectionViews(): MuseumCollectionView[] {
    return this.getCollectionList().map(toCollectionView)
  },

  addCollection(input: MuseumCollectionInput): MuseumCollection | null {
    if (!isValidInput(input)) {
      return null
    }

    const now = Date.now()
    const collection: MuseumCollection = {
      id: createCollectionId(),
      type: input.type,
      name: input.name.trim(),
      amount: input.amount,
      startDate: input.startDate,
      status: input.status,
      retiredDate: input.status === 'retired' ? input.retiredDate || null : null,
      story: (input.story || '').trim(),
      photoPath: input.photoPath || null,
      createdAt: now,
      updatedAt: now,
    }
    const collections = [collection, ...this.getCollectionList()]
    return saveCollectionList(collections) ? collection : null
  },

  deleteCollection(id: string): boolean {
    const collections = this.getCollectionList()
    const collection = collections.find((item) => item.id === id)
    const nextCollections = collections.filter((collection) => collection.id !== id)
    const deleted = nextCollections.length !== collections.length && saveCollectionList(nextCollections)
    if (deleted && collection && collection.photoPath) {
      wx.removeSavedFile({ filePath: collection.photoPath })
    }
    return deleted
  },

  updateCollection(
    id: string,
    updates: Partial<MuseumCollectionInput>,
  ): MuseumCollection | null {
    const collections = this.getCollectionList()
    const index = collections.findIndex((collection) => collection.id === id)
    if (index < 0) {
      return null
    }

    const current = collections[index]
    const nextInput: MuseumCollectionInput = {
      type: updates.type !== undefined ? updates.type : current.type,
      name: updates.name !== undefined ? updates.name : current.name,
      amount: updates.amount !== undefined ? updates.amount : current.amount,
      startDate: updates.startDate !== undefined ? updates.startDate : current.startDate,
      status: updates.status !== undefined ? updates.status : current.status,
      retiredDate: updates.retiredDate === undefined ? current.retiredDate : updates.retiredDate,
      story: updates.story !== undefined ? updates.story : current.story,
      photoPath:
        updates.photoPath === undefined ? current.photoPath : updates.photoPath,
    }
    if (!isValidInput(nextInput)) {
      return null
    }

    const updatedCollection: MuseumCollection = {
      ...current,
      ...nextInput,
      createdAt: current.createdAt,
      name: nextInput.name.trim(),
      retiredDate: nextInput.status === 'retired' ? nextInput.retiredDate || null : null,
      story: (nextInput.story || '').trim(),
      photoPath: nextInput.photoPath || null,
      updatedAt: Date.now(),
    }
    collections[index] = updatedCollection
    if (!saveCollectionList(collections)) return null
    if (current.photoPath && current.photoPath !== updatedCollection.photoPath) {
      wx.removeSavedFile({ filePath: current.photoPath })
    }
    return updatedCollection
  },

  calculateUsageDays,
  calculateDailyCost,
}
