import { WealthChangeSource, WealthReportView } from '../../models/report'
import { reportService } from '../../services/reportService'
import { snapshotService } from '../../services/snapshotService'

Page({
  data: {
    sourceOptions: reportService.getChangeSourceOptions(),
    selectedSource: 'salary_saving' as WealthChangeSource,
    report: null as WealthReportView | null,
    generatedMessage: '',
    snapshotCount: snapshotService.getSnapshotList().length,
    savedReportCount: reportService.getReportList().length,
    hasSavedCurrentReport: false,
  },

  onShow() {
    this.refreshReport()
  },

  refreshReport() {
    const snapshots = snapshotService.getSnapshotList()
    const report = reportService.getCurrentReportView(this.data.selectedSource)
    const reports = reportService.getReportList()
    this.setData({
      report,
      snapshotCount: snapshots.length,
      savedReportCount: reports.length,
      hasSavedCurrentReport: report
        ? reports.some((item) => item.date === report.currentDate)
        : false,
      generatedMessage: '',
    })
  },

  onSelectSource(
    event: WechatMiniprogram.BaseEvent<{}, { source: WealthChangeSource }>,
  ) {
    const selectedSource = event.currentTarget.dataset.source
    this.setData({
      selectedSource,
      generatedMessage: '',
      report: reportService.getCurrentReportView(selectedSource),
    })
  },

  onGenerateReport() {
    const report = reportService.createReport(this.data.selectedSource)
    if (!report) {
      wx.showToast({ title: '报告生成失败', icon: 'none' })
      return
    }

    const reports = reportService.getReportList()
    this.setData({
      report,
      savedReportCount: reports.length,
      hasSavedCurrentReport: true,
      generatedMessage: '本期报告已保存到本地',
    })
  },

  onGoToWealth() {
    wx.switchTab({ url: '/pages/wealth/wealth' })
  },
})
