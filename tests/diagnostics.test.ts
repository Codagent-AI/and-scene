import { afterEach, expect, it, vi } from 'vitest'
import { collectDiagnostics } from '../scripts/diagnostics.mjs'
const rect = (left: number, top = 0) => ({ left, right: left + 80, top, bottom: top + 20, width: 80, height: 20, toJSON() {} })
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })
function fixture(content: string) {
  document.body.innerHTML = `<main data-presentation data-step-index="2">${content}<a data-presentation-attribution style="font-size:12px;color:rgb(50,60,70);text-decoration:none">credit</a></main>`
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function(this: Element) { return rect(this.hasAttribute('data-presentation-attribution') ? 500 : Number(this.getAttribute('data-x') ?? 0)) as DOMRect })
  if (!Range.prototype.getClientRects) Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, writable: true, value: () => [] })
  vi.spyOn(Range.prototype, 'getClientRects').mockImplementation(function(this: Range) {
    const el = this.startContainer.parentElement!
    const x = el.hasAttribute('data-presentation-attribution') ? 500 : Number(el.getAttribute('data-x') ?? 0)
    return [rect(x)] as unknown as DOMRectList
  })
}
it('I-41 overlap warnings identify step and elements and exempt marked subtrees', () => {
  fixture('<span>collision A</span><span>collision B</span><div data-presentation-allow-overlap><span>allowed A</span><span>allowed B</span></div>')
  const warnings = collectDiagnostics()
  expect(warnings.some((w: string) => w.includes('step 2: overlap: collision A / collision B'))).toBe(true)
  expect(warnings.some((w: string) => w.includes('allowed'))).toBe(false)
})
it('I-41 hidden text does not produce collision warnings', () => {
  fixture('<span>visible</span><span style="display:none">hidden</span><span style="visibility:hidden">hidden too</span><div style="opacity:0"><span>faded</span></div>')
  expect(collectDiagnostics().some((w: string) => w.includes('overlap'))).toBe(false)
})
it('I-42 indistinct progress and ToC warn while distinct states pass', () => {
  fixture(['progress-entry', 'toc-entry'].map(hook => `<button data-presentation-${hook} data-presentation-active="true" data-x="0">active</button><button data-presentation-${hook} data-presentation-active="false" data-x="200">inactive</button>`).join(''))
  expect(collectDiagnostics()).toContain('step 2: indistinct active progress-entry')
  expect(collectDiagnostics()).toContain('step 2: indistinct active toc-entry')
  for (const active of document.querySelectorAll<HTMLElement>('[data-presentation-active="true"]')) active.style.fontWeight = '700'
  expect(collectDiagnostics().some((w: string) => w.includes('indistinct'))).toBe(false)
})
it('I-43 missing undersized and browser-default attribution warn with hook guidance', () => {
  fixture('')
  const link = document.querySelector<HTMLElement>('[data-presentation-attribution]')!
  expect(collectDiagnostics().some((w: string) => w.includes('attribution'))).toBe(false)
  link.style.fontSize = '8px'
  expect(collectDiagnostics()).toContain('step 2: unpolished attribution; style [data-presentation-attribution]')
  link.style.fontSize = '16px'; link.style.color = 'rgb(0, 0, 238)'; link.style.textDecorationLine = 'underline'
  expect(collectDiagnostics()).toContain('step 2: unpolished attribution; style [data-presentation-attribution]')
  link.remove()
  expect(collectDiagnostics()).toContain('step 2: missing attribution; style [data-presentation-attribution]')
})
