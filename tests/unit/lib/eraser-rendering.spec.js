// @vitest-environment node
import { expect, it } from 'vitest'

import { getEnv as getNodeEnv } from 'fabric/node'

const { Path, setEnv, StaticCanvas } = await import('fabric')
setEnv(getNodeEnv())
const { PSPoint, PSStroke } = await import('fabricjs-psbrush')
const { EraserBrush, hasVisiblePixels, installEraserObjectSupport } =
  await import('@/lib/players/eraserbrush')

installEraserObjectSupport()

const countVisiblePixels = object => {
  const canvas = object.toCanvasElement({
    enableRetinaScaling: false,
    withoutShadow: true
  })
  const pixels = canvas
    .getContext('2d')
    .getImageData(0, 0, canvas.width, canvas.height).data
  let count = 0
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 0) count += 1
  }
  return count
}

const countCanvasPixels = canvas => {
  canvas.renderAll()
  const element = canvas.getElement()
  const pixels = element
    .getContext('2d')
    .getImageData(0, 0, element.width, element.height).data
  let count = 0
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] !== 0) count += 1
  }
  return count
}

it('renders no pixels when a wider eraser stroke covers a color stroke', async () => {
  const stroke = new PSStroke(
    [new PSPoint(20, 20, 0.5), new PSPoint(80, 80, 0.5)],
    {
      fill: null,
      stroke: '#5e60ba',
      strokeWidth: 20,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      originX: 'left',
      originY: 'top'
    }
  )
  const brush = new EraserBrush({})
  brush.width = 30
  const eraserPath = brush.createPath('M 10 10 L 90 90')

  expect(countVisiblePixels(stroke)).toBeGreaterThan(0)
  await brush._addPathToObjectEraser(stroke, eraserPath)

  expect(countVisiblePixels(stroke)).toBe(0)
})

it('conservatively retains pressure-stroke raster remnants', async () => {
  const stroke = new PSStroke(
    [
      new PSPoint(45.485, 45.5, 0.5),
      new PSPoint(45.5, 45.5, 0.5),
      new PSPoint(46.5, 45.5, 0.5),
      new PSPoint(47.5, 46.5, 0.53),
      new PSPoint(49.5, 50.5, 0.56),
      new PSPoint(54.5, 55.5, 0.53),
      new PSPoint(59.5, 60.5, 0.5),
      new PSPoint(62.5, 63.5, 0.47),
      new PSPoint(64.5, 66.5, 0.44),
      new PSPoint(66.5, 67.5, 0.41),
      new PSPoint(68.5, 68.5, 0.44),
      new PSPoint(71.5, 70.5, 0.47),
      new PSPoint(72.5, 71.5, 0.44),
      new PSPoint(72.5, 72.5, 0.47)
    ],
    {
      fill: null,
      stroke: '#5e60ba',
      strokeWidth: 30,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      originX: 'left',
      originY: 'top'
    }
  )
  const brush = new EraserBrush({})
  brush.width = 30
  const eraserPath = brush.createPath(
    'M 78.5 76.53 Q 78.5 76.5 78.5 76 Q 78.5 75.5 78.5 75 Q 78.5 74.5 78.5 74 Q 78.5 73.5 77 72.5 Q 75.5 71.5 73.5 70 Q 71.5 68.5 69.5 67.5 Q 67.5 66.5 64.5 65 Q 61.5 63.5 58 60.5 Q 54.5 57.5 50.5 54 Q 46.5 50.5 43 46.5 Q 39.5 42.5 37.5 40.5 Q 35.5 38.5 34.5 38 Q 33.5 37.5 32.5 37 L 31.47 36.47',
  )
  const canvas = new StaticCanvas(null, { width: 150, height: 150 })
  canvas.add(stroke)

  expect(countCanvasPixels(canvas)).toBeGreaterThan(0)
  await brush._addPathToObjectEraser(stroke, eraserPath)

  expect(countCanvasPixels(canvas)).toBeGreaterThan(0)
  expect(hasVisiblePixels(stroke)).toBe(true)
})

it('keeps a partially erased stroke visible', async () => {
  const stroke = new PSStroke(
    [new PSPoint(20, 20, 0.5), new PSPoint(80, 80, 0.5)],
    {
      fill: null,
      stroke: '#5e60ba',
      strokeWidth: 20,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      originX: 'left',
      originY: 'top'
    }
  )
  const brush = new EraserBrush({})
  brush.width = 30
  const eraserPath = brush.createPath('M 10 10 L 45 45')

  await brush._addPathToObjectEraser(stroke, eraserPath)

  expect(hasVisiblePixels(stroke)).toBe(true)
})

it('keeps the remaining end of a mostly erased long thin stroke', async () => {
  const stroke = new PSStroke(
    [new PSPoint(20, 20, 0.5), new PSPoint(520, 520, 0.5)],
    {
      fill: null,
      stroke: '#5e60ba',
      strokeWidth: 4,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      originX: 'left',
      originY: 'top'
    }
  )
  const brush = new EraserBrush({})
  brush.width = 10
  const eraserPath = brush.createPath('M 15 15 L 420 420')

  await brush._addPathToObjectEraser(stroke, eraserPath)

  expect(hasVisiblePixels(stroke)).toBe(true)
})

it('keeps a partially erased long thin path', async () => {
  const stroke = new Path('M 20 20 L 520 520', {
    fill: null,
    stroke: '#5e60ba',
    strokeWidth: 4,
    strokeLineCap: 'round',
    strokeLineJoin: 'round'
  })
  const brush = new EraserBrush({})
  brush.width = 10
  const eraserPath = brush.createPath('M 15 15 L 420 420')

  await brush._addPathToObjectEraser(stroke, eraserPath)

  expect(hasVisiblePixels(stroke)).toBe(true)
})
