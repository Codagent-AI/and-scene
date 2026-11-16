import { afterEach, expect, it, vi } from 'vitest'
// @ts-expect-error Executable browser script has no TypeScript declarations.
import { collectDiagnostics } from '../scripts/diagnostics.mjs'
const rect = (x: number, y: number, width = 50, height = 20) => ({ left: x, right: x + width, top: y, bottom: y + height, width, height, x, y, toJSON: () => ({}) })
function setup(marked = false) {
  document.body.innerHTML = `<main data-presentation-root data-step-index="2"><div ${marked ? 'data-presentation-allow-overlap' : ''}><span id="first">First</span><span id="second">Second</span></div><nav><button data-presentation-progress-item data-presentation-active="true">1</button><button data-presentation-progress-item data-presentation-active="false">2</button></nav><a data-presentation-attribution style="font-size: 9px; color: rgb(0, 0, 238)" href="#">made by and-scene</a></main>`
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function(this: Element) {
    const x = this.hasAttribute('data-x') ? Number(this.getAttribute('data-x')) : this.tagName === 'BUTTON' ? (this.textContent === '1' ? 100 : 200) : this.tagName === 'A' ? 300 : 0
    return [rect(x, 0)] as unknown as DOMRectList
  })
  if (!Range.prototype.getClientRects) Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] })
  vi.spyOn(Range.prototype, 'getClientRects').mockImplementation(function(this: Range) {
    const parent = this.startContainer.parentElement
    const x = parent?.id === 'first' || parent?.id === 'second' ? 0 : parent?.tagName === 'BUTTON' ? (parent.textContent === '1' ? 100 : 200) : 300
    return [rect(x, 0)] as unknown as DOMRectList
  })
}
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })
it('I-36 collision detector reports painted aria-hidden overlap and exempts only marked or visually hidden text', () => {
  setup()
  expect(collectDiagnostics().some((warning: string) => /step 2: overlap/.test(warning))).toBe(true)
  const subtree = document.querySelector('#first')!.parentElement!
  subtree.setAttribute('aria-hidden', 'true')
  expect(collectDiagnostics().some((warning: string) => /overlap span:First \/ span:Second/.test(warning))).toBe(true)
  subtree.setAttribute('data-presentation-allow-overlap', '')
  expect(collectDiagnostics().some((warning: string) => /overlap/.test(warning))).toBe(false)
  subtree.removeAttribute('data-presentation-allow-overlap')
  document.querySelector('button')!.setAttribute('data-x', '0')
  expect(collectDiagnostics().some((warning: string) => /overlap.*button:1/.test(warning))).toBe(true)
  document.querySelector('button')!.removeAttribute('data-x')
  document.querySelector('#first')!.setAttribute('style', 'visibility:hidden')
  expect(collectDiagnostics().some((warning: string) => /overlap/.test(warning))).toBe(false)
  vi.restoreAllMocks(); setup(true)
  expect(collectDiagnostics().some((warning: string) => /overlap/.test(warning))).toBe(false)
})
it('I-37 chrome diagnostics distinguish active styling and detect bad or missing attribution', () => {
  setup()
  expect(collectDiagnostics()).toContain('step 2: indistinct active progress')
  expect(collectDiagnostics()).toContain('step 2: unpolished attribution; style [data-presentation-attribution]')
  document.querySelector('[data-presentation-active="true"]')!.setAttribute('style', 'background-color: red')
  const link = document.querySelector('[data-presentation-attribution]')!
  link.setAttribute('style', 'font-size:12px; color:rgb(20, 50, 40)')
  expect(collectDiagnostics().some((warning: string) => /indistinct|unpolished/.test(warning))).toBe(false)
  link.remove(); expect(collectDiagnostics()).toContain('step 2: missing attribution; style [data-presentation-attribution]')
})
