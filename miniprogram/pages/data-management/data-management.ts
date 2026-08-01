import {
  BackupCheck,
  WealthArchiveStats,
} from '../../models/backup'
import { backupService } from '../../services/backupService'

Page({
  data: {
    stats: backupService.getArchiveStats() as WealthArchiveStats,
    backupCheck: backupService.getBackupCheck() as BackupCheck,
    isExporting: false,
    isRestoring: false,
  },

  onShow() {
    this.refreshData()
  },

  refreshData() {
    this.setData({
      stats: backupService.getArchiveStats(),
      backupCheck: backupService.getBackupCheck(),
    })
  },

  async onExport() {
    if (this.data.isExporting || this.data.isRestoring) return
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
    if (this.data.isExporting || this.data.isRestoring) return
    wx.showModal({
      title: '恢复财富档案',
      content: '恢复会替换当前的目标、资产、快照、报告、人生收藏和生活成本。建议先导出当前数据。',
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
})
