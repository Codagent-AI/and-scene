import { expect, test, vi, afterEach } from 'vitest'
// @ts-expect-error Browser-evaluated JavaScript module.
import { inspectDocument } from '../scripts/diagnostics.mjs'
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })
function fixture(content: string) {
  document.body.innerHTML = `<main data-presentation data-step-index="2">${content}</main>`
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: 100, height: 20, x: 10, y: 10, left: 10, top: 10, right: 110, bottom: 30, toJSON: () => ({}) }))
  vi.spyOn(Range.prototype, 'getClientRects').mockReturnValue([{ left: 10, top: 10, right: 110, bottom: 30 }] as unknown as DOMRectList)
}
// jsdom does not implement text-range geometry; classification logic receives controlled rectangles.
if (!Range.prototype.getClientRects) Range.prototype.getClientRects = () => [] as unknown as DOMRectList
const attribution = '<a data-presentation-attribution style="color: rgb(170,180,190); font-size: 12px; text-decoration: none" href="#">made by and-scene</a>'
test('I-47 overlap classification warns for unmarked text and exempts explicitly marked ancestor subtree', () => {
  fixture(`<span>collision a</span><span>collision b</span><div data-presentation-allow-overlap><span>allowed a</span><span>allowed b</span></div>${attribution}`)
  const warnings: string[] = inspectDocument()
  expect(warnings.some(w => w.includes('step 2: overlap') && w.includes('collision a') && w.includes('collision b'))).toBe(true)
  expect(warnings.some(w => w.includes('allowed'))).toBe(false)
})
test('I-47 fully transparent ancestor text does not generate overlap warnings', () => {
  fixture(`<div style="opacity:0"><span>invisible</span></div><span>visible</span>${attribution}`)
  expect(inspectDocument().some((w: string) => w.includes('invisible'))).toBe(false)
})
test('I-48 indistinct progress and ToC warn; distinct active states do not', () => {
  const controls = ['progress-step','toc-entry'].map(h => `<button data-presentation-${h}="0" data-presentation-active="true">active</button><button data-presentation-${h}="1" data-presentation-active="false">inactive</button>`).join('')
  fixture(controls + attribution)
  expect(inspectDocument().filter((w: string) => w.includes('indistinct'))).toHaveLength(2)
  document.querySelectorAll<HTMLElement>('[data-presentation-active="true"]').forEach(el => { el.style.backgroundColor = 'red' })
  expect(inspectDocument().filter((w: string) => w.includes('indistinct'))).toHaveLength(0)
})
test('I-49 missing undersized and browser-default attribution warn; polished attribution does not', () => {
  fixture(attribution)
  expect(inspectDocument().some((w: string) => w.includes('attribution'))).toBe(false)
  const link = document.querySelector<HTMLElement>('[data-presentation-attribution]')!
  link.style.fontSize = '8px'
  expect(inspectDocument().join(' ')).toContain('unpolished attribution; style [data-presentation-attribution]')
  link.style.fontSize = '16px'; link.style.color = 'rgb(0, 0, 238)'; link.style.textDecorationLine = 'underline'
  expect(inspectDocument().join(' ')).toContain('browser-default')
  link.remove()
  expect(inspectDocument().join(' ')).toContain('missing attribution')
})
