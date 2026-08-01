import {
  BackupCheck,
  WealthArchiveStats,
} from '../../models/backup'
import { backupService } from '../../services/backupService'
import { DataIntegritySummary } from '../../models/dataIntegrity'
import { dataIntegrityService } from '../../services/dataIntegrityService'
import { themeService } from '../../services/themeService'

let clearCountdownTimer: number | null = null

Page({
  data: {
    stats: backupService.getArchiveStats() as WealthArchiveStats,
    backupCheck: backupService.getBackupCheck() as BackupCheck,
    isExporting: false,
    isRestoring: false,
    isClearing: false,
    isClearWaiting: false,
    showClearModal: false,
    canConfirmClear: false,
    clearConfirmText: '请等待 2 秒',
    integrity: dataIntegrityService.getSummary() as DataIntegritySummary,
    themePageStyle: themeService.getPageStyle(),
  },

  onShow() {
    this.refreshData()
  },

  onUnload() {
    if (clearCountdownTimer !== null) clearInterval(clearCountdownTimer)
    clearCountdownTimer = null
  },

  refreshData() {
    this.setData({
      stats: backupService.getArchiveStats(),
      backupCheck: backupService.getBackupCheck(),
      integrity: dataIntegrityService.getSummary(),
      themePageStyle: themeService.getPageStyle(),
    })
  },

  async onExport() {
    if (
      this.data.isExporting ||
      this.data.isRestoring ||
      this.data.isClearing ||
      this.data.isClearWaiting
    ) return
    this.setData({ isExporting: true })
    const result = await backupService.exportBackup()
    this.setData({ isExporting: false })
    this.refreshData()

    if (result.success && !result.usedClipboard) {
      wx.showToast({ title: '备份已生成', icon: 'success' })
      return
    }
    wx.showModal({
      title: result.success ? '备份已复制' : '导出失败',
      content: result.message,
      showCancel: false,
    })
  },

  onRestore() {
    if (
      this.data.isExporting ||
      this.data.isRestoring ||
      this.data.isClearing ||
      this.data.isClearWaiting
    ) return
    wx.showModal({
      title: '恢复财富档案',
      content: '恢复会替换当前的目标、资产、快照、报告、人生收藏、生活成本、投资复盘和备份中的外观主题。建议先导出当前数据。',
      confirmText: '选择备份',
      confirmColor: '#a64b3c',
      success: (modalResult) => {
        if (!modalResult.confirm) return
        this.restoreSelectedBackup()
      },
    })
  },

  async restoreSelectedBackup() {
    this.setData({ isRestoring: true })
    const result = await backupService.chooseAndRestore()
    this.setData({ isRestoring: false })

    if (!result.success) {
      wx.showModal({ title: '未能恢复', content: result.message, showCancel: false })
      return
    }
    wx.showModal({
      title: '恢复完成',
      content: '财富档案已恢复，小程序将重新载入数据。',
      showCancel: false,
      success: () => wx.reLaunch({ url: '/pages/freedom/freedom' }),
    })
  },

  onClearData() {
    if (
      this.data.isExporting ||
      this.data.isRestoring ||
      this.data.isClearing ||
      this.data.isClearWaiting
    ) return
    this.setData({
      showClearModal: true,
      canConfirmClear: false,
    })
    this.startClearCountdown()
  },

  startClearCountdown() {
    let remainingSeconds = 2
    this.setData({
      isClearWaiting: true,
      clearConfirmText: `请等待 ${remainingSeconds} 秒`,
    })
    clearCountdownTimer = setInterval(() => {
      remainingSeconds -= 1
      if (remainingSeconds > 0) {
        this.setData({ clearConfirmText: `请等待 ${remainingSeconds} 秒` })
        return
      }
      if (clearCountdownTimer !== null) clearInterval(clearCountdownTimer)
      clearCountdownTimer = null
      this.setData({
        isClearWaiting: false,
        canConfirmClear: true,
        clearConfirmText: '确认清空',
      })
    }, 1000)
  },

  onCancelClear() {
    if (this.data.isClearing) return
    if (clearCountdownTimer !== null) clearInterval(clearCountdownTimer)
    clearCountdownTimer = null
    this.setData({
      showClearModal: false,
      isClearWaiting: false,
      canConfirmClear: false,
      clearConfirmText: '请等待 2 秒',
    })
  },

  onConfirmClear() {
    if (!this.data.canConfirmClear || this.data.isClearing) return
    this.setData({ isClearing: true })
    const success = backupService.clearAllData()
    if (!success) {
      this.setData({ isClearing: false })
      wx.showModal({ title: '清空失败', content: '请稍后重试。', showCancel: false })
      return
    }
    this.setData({ showClearModal: false, isClearing: false })
    wx.showToast({ title: '数据已清空', icon: 'success' })
    setTimeout(() => wx.reLaunch({ url: '/pages/freedom/freedom' }), 500)
  },

  onPreventTouchMove() {},
})
