import { AnnualWealthReport } from '../models/annualReport'

const drawText = (
  context: WechatMiniprogram.CanvasContext,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: 'left' | 'center' | 'right' = 'left',
) => {
  context.setFontSize(size)
  context.setFillStyle(color)
  context.setTextAlign(align)
  context.fillText(text, x, y)
}

export const drawAnnualPoster = (
  canvasId: string,
  report: AnnualWealthReport,
  page: WechatMiniprogram.Page.TrivialInstance,
  complete: () => void,
) => {
  const context = wx.createCanvasContext(canvasId, page)
  context.setFillStyle('#f7f5ef')
  context.fillRect(0, 0, 600, 800)

  context.setFillStyle('#2d493b')
  context.fillRect(0, 0, 600, 255)
  drawText(context, String(report.year), 48, 76, 54, '#e4bd6b')
  drawText(context, '我的财富年度回顾', 48, 132, 34, '#ffffff')
  drawText(context, 'RETIREMENT PLAN · YEAR IN REVIEW', 48, 171, 16, 'rgba(255,255,255,0.55)')
  drawText(context, `年度变化  ${report.assetGrowthText}`, 48, 222, 25, '#ffffff')

  drawText(context, '财富变化', 48, 312, 20, '#8a7447')
  drawText(context, report.startAssetText, 48, 362, 31, '#253129')
  drawText(context, '→', 300, 360, 26, '#a4aaa6', 'center')
  drawText(context, report.endAssetText, 552, 362, 31, '#253129', 'right')
  drawText(context, '年初记录', 48, 395, 17, '#858d88')
  drawText(context, '年末 / 当前', 552, 395, 17, '#858d88', 'right')

  context.setStrokeStyle('#dedbd2')
  context.beginPath()
  context.moveTo(48, 440)
  context.lineTo(552, 440)
  context.stroke()

  drawText(context, '自由成长', 48, 493, 20, '#8a7447')
  drawText(context, report.startFreedomText, 48, 545, 35, '#253129')
  drawText(context, '→', 300, 542, 26, '#a4aaa6', 'center')
  drawText(context, report.endFreedomText, 552, 545, 35, '#2f6b4f', 'right')

  context.setFillStyle('#ffffff')
  context.fillRect(48, 598, 504, 116)
  drawText(context, '年度记录', 76, 638, 17, '#858d88')
  drawText(context, `${report.assetUpdateCount} 次资产更新`, 76, 678, 23, '#253129')
  drawText(context, `${report.museumCollectionCount} 件人生收藏`, 524, 678, 23, '#253129', 'right')

  drawText(context, '记录长期变化，而不是预测明天', 300, 762, 17, '#8d948f', 'center')
  context.draw(false, complete)
}
