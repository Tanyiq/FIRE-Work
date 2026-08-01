import { WealthChangeSource, WealthReportView } from '../../models/report'
import { reportService } from '../../services/reportService'

Page({
  data: {
    sourceOptions: reportService.getChangeSourceOptions(),
    selectedSource: 'salary_saving' as WealthChangeSource,
    report: null as WealthReportView | null,
    generatedMessage: '',
  },

  onShow() {
    this.refreshReport()
  },

  refreshReport() {
    this.setData({
      report: reportService.getCurrentReportView(this.data.selectedSource),
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

    this.setData({ report, generatedMessage: '本期报告已保存到本地' })
  },

  onGoToWealth() {
    wx.switchTab({ url: '/pages/wealth/wealth' })
  },
})
