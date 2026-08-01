import { WealthChangeSource, WealthReportView } from '../../models/report'
import { reportService } from '../../services/reportService'
import { noviceTipService } from '../../services/noviceTipService'
import { snapshotService } from '../../services/snapshotService'
import { themeService } from '../../services/themeService'

const initialSource: WealthChangeSource = 'salary_saving'
const initialReport = reportService.getCurrentReportView(initialSource)
const initialReports = reportService.getReportList()
const initialSnapshotCount = snapshotService.getSnapshotList().length

Page({
  data: {
    sourceOptions: reportService.getChangeSourceOptions(),
    selectedSource: initialSource as WealthChangeSource,
    report: initialReport as WealthReportView | null,
    generatedMessage: '',
    snapshotCount: initialSnapshotCount,
    savedReportCount: initialReports.length,
    hasSavedCurrentReport: initialReport
      ? initialReports.some((item) => item.date === initialReport.currentDate)
      : false,
    showBaselineTip: noviceTipService.shouldShow('snapshot_baseline'),
    themePageStyle: themeService.getPageStyle(),
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
      themePageStyle: themeService.getPageStyle(),
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

  onGoToAnnualReport() {
    wx.navigateTo({ url: '/pages/annual-report/annual-report' })
  },

  onDismissBaselineTip() {
    noviceTipService.dismiss('snapshot_baseline')
    this.setData({ showBaselineTip: false })
  },
})
