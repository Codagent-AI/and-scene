import { afterEach, expect, test, vi } from 'vitest'
import { inspectStep } from '../scripts/visual-diagnostics.mjs'

afterEach(() => { document.body.replaceChildren() })

test('diagnostics compare visible text and chrome and honor explicit exemptions', () => {
  document.body.innerHTML = `<main data-presentation>
    <div id="first">Visible label</div>
    <div id="hidden" style="opacity:0">Hidden label</div>
    <div data-presentation-allow-overlap><div id="intentional">Stacked label</div></div>
    <span id="offscreen">Off-screen label</span>
    <button id="chrome" data-presentation-next></button>
  </main>`
  const rects = {
    first: [10, 10, 70, 25],
    hidden: [10, 10, 70, 25],
    intentional: [10, 10, 70, 25],
    offscreen: [-100, 10, 70, 25],
    chrome: [15, 15, 70, 25],
  }
  function bounds(element: Element) {
    const rect = rects[element.id as keyof typeof rects]
    return rect ? [new DOMRect(...rect)] : []
  }
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value(this: Range) { return bounds(this.startContainer.parentElement!) },
  })
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return bounds(this) as unknown as DOMRectList
  })
  try {
    expect(inspectStep()).toEqual([
      'Overlap: "Visible label" with "data-presentation-next"',
      'Missing or hidden attribution. Style [data-presentation-attribution].',
    ])
  } finally {
    Reflect.deleteProperty(Range.prototype, 'getClientRects')
  }
})

test('attribution warns for default and undersized links while accepting explicit styling', () => {
  const attribution = document.createElement('a')
  attribution.href = '/source'
  attribution.setAttribute('data-presentation-attribution', '')
  document.body.innerHTML = '<main data-presentation></main>'
  document.querySelector('main')!.append(attribution)

  attribution.style.cssText = 'color: rgb(0, 0, 238); font-size: 16px; text-decoration-line: underline'
  expect(inspectStep()[0]).toMatch(/Attribution appears undersized or browser-default/)
  attribution.style.cssText = 'color: teal; font-size: 11px'
  expect(inspectStep()[0]).toMatch(/Attribution appears undersized or browser-default/)
  attribution.style.cssText = 'color: teal; font-size: 14px; font-weight: 700'
  expect(inspectStep()).toEqual([])
})

test('scene text legibility uses the fitted font size even inside overlap exemptions', () => {
  document.body.innerHTML = `<main data-presentation><div data-presentation-canvas>
    <span style="font-size:15px" data-presentation-allow-overlap>Small card label</span>
    <span style="font-size:30px">Readable card label</span>
  </div></main>`
  const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
  Object.defineProperty(canvas, 'offsetWidth', { value: 880 })
  const bounds = vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 366, 158))
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value() { return [new DOMRect(10, 10, 70, 20)] },
  })

  try {
    const smallTextWarnings = () => inspectStep().filter(warning => warning.startsWith('Small scene text'))
    expect(smallTextWarnings()).toEqual(['Small scene text: "Small card label" renders at 6.2px'])
    bounds.mockReturnValue(new DOMRect(0, 0, 880, 380))
    expect(smallTextWarnings()).toEqual([])
  } finally {
    Reflect.deleteProperty(Range.prototype, 'getClientRects')
  }
})

test('active controls can be distinguished by pseudo-element and font styling', () => {
  document.body.innerHTML = `<main data-presentation>
    <button data-presentation-progress-step data-presentation-active aria-label="Current step"></button>
    <button data-presentation-progress-step aria-label="Other step"></button>
    <button data-presentation-era data-presentation-active aria-label="Current era" style="font-weight: 700"></button>
    <button data-presentation-era aria-label="Other era" style="font-weight: 400"></button>
  </main>`
  const getStyle = window.getComputedStyle.bind(window)
  const current = document.querySelector('[data-presentation-progress-step][data-presentation-active]')!
  let decoratedProgress = true
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    if (!pseudo) return getStyle(element)
    const style = document.createElement('span').style
    style.content = decoratedProgress && pseudo === '::before' && element === current ? '""' : 'none'
    return style
  })

  expect(inspectStep().filter(warning => warning.includes('Indistinct active'))).toEqual([])
  decoratedProgress = false
  document.querySelector<HTMLButtonElement>('[data-presentation-era][data-presentation-active]')!.style.fontWeight = '400'
  expect(inspectStep().filter(warning => warning.includes('Indistinct active'))).toEqual([
    'Indistinct active progress indicator: Current step',
    'Indistinct active table of contents: Current era',
  ])
})
