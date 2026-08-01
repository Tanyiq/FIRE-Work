import { AnnualWealthReport } from '../../models/annualReport'
import { annualReportService } from '../../services/annualReportService'

const yearOptions = annualReportService.getAvailableYears()

Page({
  data: {
    yearOptions,
    selectedYearIndex: 0,
    report: annualReportService.getAnnualReport(yearOptions[0]) as AnnualWealthReport,
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
})
