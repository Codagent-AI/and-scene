import { afterEach, expect, it, vi } from 'vitest'
import { collectVisualWarnings } from '../scripts/visual-diagnostics.mjs'
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })
function setup(markup: string) {
  document.body.innerHTML = `<main data-presentation>${markup}</main>`
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20, toJSON: () => ({}) })
  Range.prototype.getClientRects = () => [{ left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20 }] as unknown as DOMRectList
}
it('I-45 overlap identifies elements and explicit subtree exempts', () => {
  setup('<p>A</p><p>B</p>')
  expect(collectVisualWarnings().some((w: string) => w.includes('overlap:') && w.includes('[A]') && w.includes('[B]'))).toBe(true)
  setup('<div data-presentation-allow-overlap><p>A</p><p>B</p></div>')
  expect(collectVisualWarnings().some((w: string) => w.includes('overlap:'))).toBe(false)
})
it('I-46 active and attribution warning classification', () => {
  setup('<button data-presentation-progress-step data-presentation-active="true">1</button><button data-presentation-progress-step>2</button><a data-presentation-attribution style="font-size: 8px">made by and-scene</a>')
  expect(collectVisualWarnings()).toEqual(expect.arrayContaining([expect.stringContaining('indistinct active chrome'), expect.stringContaining('unpolished attribution')]))
  document.querySelector('a')!.remove(); expect(collectVisualWarnings()).toContain('missing attribution: style [data-presentation-attribution]')
  document.querySelector('button')!.setAttribute('style', 'background-color: green')
  expect(collectVisualWarnings().some((w: string) => w.includes('indistinct active'))).toBe(false)
})
it('I-46 browser default hidden and polished attribution variants', () => {
  setup('<a data-presentation-attribution style="font-size:16px;color:rgb(0,0,238);text-decoration:underline">made by and-scene</a>')
  expect(collectVisualWarnings()).toEqual([expect.stringContaining('unpolished attribution')])
  document.querySelector('a')!.setAttribute('style', 'font-size:12px;color:rgb(40,60,50);text-decoration:none')
  expect(collectVisualWarnings()).toEqual([])
  document.querySelector('a')!.setAttribute('style', 'display:none')
  expect(collectVisualWarnings()).toEqual([expect.stringContaining('missing attribution')])
})

it('I-45 detects text over chrome padding without colliding labels', () => {
  setup('<p>A</p><button data-presentation-next>B</button>')
  Range.prototype.getClientRects = function () {
    const left = this.startContainer.textContent === 'A' ? 50 : 0
    return [{ left, right: left + 20, top: 0, bottom: 20, width: 20, height: 20 }] as unknown as DOMRectList
  }
  expect(collectVisualWarnings().some((w: string) => w.includes('overlap:') && w.includes('[A]') && w.includes('[chrome]'))).toBe(true)
})
