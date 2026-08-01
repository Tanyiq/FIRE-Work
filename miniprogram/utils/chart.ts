import { AssetTrendPoint } from '../models/snapshot'

const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 160
const PADDING_LEFT = 14
const PADDING_RIGHT = 14
const PADDING_TOP = 18
const PADDING_BOTTOM = 24

export const drawAssetTrendChart = (
  canvasId: string,
  points: AssetTrendPoint[],
  page: WechatMiniprogram.Page.TrivialInstance,
) => {
  const context = wx.createCanvasContext(canvasId, page)
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (points.length === 0) {
    context.draw()
    return
  }

  const values = points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = Math.max(1, maxValue - minValue)
  const chartWidth = CANVAS_WIDTH - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = CANVAS_HEIGHT - PADDING_TOP - PADDING_BOTTOM

  context.setStrokeStyle('#e4e8e4')
  context.setLineWidth(1)
  for (let index = 0; index < 4; index += 1) {
    const y = PADDING_TOP + (chartHeight / 3) * index
    context.beginPath()
    context.moveTo(PADDING_LEFT, y)
    context.lineTo(CANVAS_WIDTH - PADDING_RIGHT, y)
    context.stroke()
  }

  const coordinates = points.map((point, index) => ({
    x:
      points.length === 1
        ? CANVAS_WIDTH / 2
        : PADDING_LEFT + (chartWidth * index) / (points.length - 1),
    y: PADDING_TOP + chartHeight - ((point.value - minValue) / valueRange) * chartHeight,
  }))

  context.setStrokeStyle('#2f6b4f')
  context.setLineWidth(3)
  context.setLineJoin('round')
  context.beginPath()
  coordinates.forEach((coordinate, index) => {
    if (index === 0) {
      context.moveTo(coordinate.x, coordinate.y)
    } else {
      context.lineTo(coordinate.x, coordinate.y)
    }
  })
  context.stroke()

  context.setFillStyle('#d5a94e')
  coordinates.forEach((coordinate) => {
    context.beginPath()
    context.arc(coordinate.x, coordinate.y, 3.5, 0, Math.PI * 2)
    context.fill()
  })

  context.setFillStyle('#7a817d')
  context.setFontSize(10)
  context.setTextAlign('left')
  context.fillText(points[0].label, PADDING_LEFT, CANVAS_HEIGHT - 6)
  if (points.length > 1) {
    context.setTextAlign('right')
    context.fillText(points[points.length - 1].label, CANVAS_WIDTH - PADDING_RIGHT, CANVAS_HEIGHT - 6)
  }
  context.draw()
}
