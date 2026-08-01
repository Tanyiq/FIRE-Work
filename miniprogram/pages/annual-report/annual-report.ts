import { AnnualWealthReport } from '../../models/annualReport'
import { annualReportService } from '../../services/annualReportService'
import { drawAnnualPoster } from '../../utils/annualPoster'

const yearOptions = annualReportService.getAvailableYears()

Page({
  data: {
    yearOptions,
    selectedYearIndex: 0,
    report: annualReportService.getAnnualReport(yearOptions[0]) as AnnualWealthReport,
    isGeneratingPoster: false,
  },

  onShow() {
    const years = annualReportService.getAvailableYears()
    const selectedYear = this.data.yearOptions[this.data.selectedYearIndex]
    const selectedYearIndex = Math.max(0, years.indexOf(selectedYear))
    this.setData({
      yearOptions: years,
      selectedYearIndex,
      report: annualReportService.getAnnualReport(years[selectedYearIndex]),
    })
  },

  onYearChange(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const selectedYearIndex = Number(event.detail.value)
    const year = this.data.yearOptions[selectedYearIndex]
    this.setData({
      selectedYearIndex,
      report: annualReportService.getAnnualReport(year),
    })
  },

  onGoToWealth() {
    wx.switchTab({ url: '/pages/wealth/wealth' })
  },

  onGoToInvestment() {
    wx.navigateTo({ url: '/pages/investment/investment' })
  },

  onGoToMuseum() {
    wx.switchTab({ url: '/pages/museum/museum' })
  },

  onSharePoster() {
    if (this.data.isGeneratingPoster) return
    this.setData({ isGeneratingPoster: true })
    drawAnnualPoster('annualShareCanvas', this.data.report, this, () => {
      wx.canvasToTempFilePath({
        canvasId: 'annualShareCanvas',
        width: 600,
        height: 800,
        destWidth: 1200,
        destHeight: 1600,
        fileType: 'png',
        success: (result) => {
          wx.showShareImageMenu({
            path: result.tempFilePath,
            complete: () => this.setData({ isGeneratingPoster: false }),
          })
        },
        fail: () => {
          this.setData({ isGeneratingPoster: false })
          wx.showToast({ title: '分享图生成失败', icon: 'none' })
        },
      }, this)
    })
  },
})
