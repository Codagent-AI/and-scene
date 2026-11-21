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
