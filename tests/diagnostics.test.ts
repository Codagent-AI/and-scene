import { afterEach, expect, it, vi } from 'vitest'
import { visualDiagnostics } from '../scripts/diagnostics.mjs'
import { assertClean, waitStep } from '../scripts/browser.mjs'
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })
function fixture() {
  document.body.innerHTML = `<main data-presentation><span id="a">Collision A</span><span id="b">Collision B</span><div data-presentation-allow-overlap><span>Allowed A</span><span>Allowed B</span></div><button data-presentation-progress-entry data-presentation-active="true">1</button><button data-presentation-progress-entry data-presentation-active="false">2</button><button data-presentation-toc-entry data-presentation-active="true">intro</button><button data-presentation-toc-entry data-presentation-active="false">end</button><a data-presentation-attribution style="font: 10px serif; color: rgb(0,0,238)">made by and-scene</a></main>`
  const rect = { left: 1, top: 1, right: 51, bottom: 21, width: 50, height: 20, x: 1, y: 1, toJSON: () => ({}) }
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(rect)
  Range.prototype.getClientRects = () => [rect] as unknown as DOMRectList
}
it('I-53 overlap diagnostics identify text and exempt only marked subtrees', () => {
  fixture(); const warnings = visualDiagnostics(); expect(warnings.some((w: string) => w.includes('Collision A') && w.includes('Collision B'))).toBe(true); expect(warnings.some((w: string) => w.includes('Allowed'))).toBe(false)
  document.querySelector('#b')?.setAttribute('data-presentation-allow-overlap', '')
  expect(visualDiagnostics().some((w: string) => w.includes('Collision B'))).toBe(false)
})
it('I-53 text crossing empty chrome bounds warns without a label collision', () => {
  fixture()
  const control = document.createElement('button')
  control.setAttribute('data-presentation-prev', '')
  control.setAttribute('aria-label', 'Empty chrome control')
  document.querySelector('[data-presentation]')!.append(control)
  expect(visualDiagnostics().some((w: string) => w.includes('Empty chrome control') && w.includes('Collision A'))).toBe(true)
})
it('I-54 active progress ToC and undersized default attribution warn', () => {
  fixture(); const warnings = visualDiagnostics(); expect(warnings).toContain('indistinct active progress: data-presentation-progress-entry'); expect(warnings).toContain('indistinct active toc: data-presentation-toc-entry'); expect(warnings).toContain('unpolished attribution: style data-presentation-attribution')
  for (const el of document.querySelectorAll<HTMLElement>('[data-presentation-active="true"]')) { el.style.backgroundColor = 'green'; el.style.fontWeight = '700' }
  const a = document.querySelector<HTMLElement>('[data-presentation-attribution]')!; a.style.cssText = 'font: 14px Arial; color: rgb(30,80,50)'
  expect(visualDiagnostics().some((w: string) => w.includes('indistinct') || w.includes('unpolished'))).toBe(false)
  a.remove(); expect(visualDiagnostics()).toContain('missing attribution: data-presentation-attribution')
})
it('I-49 errors and failed transitions identify offending step', async () => {
  expect(() => assertClean(['uncaught fault'], 4)).toThrow('render phase step 4: uncaught fault'); expect(() => assertClean([], 2)).not.toThrow()
  await expect(waitStep({ waitForFunction: () => Promise.reject(new Error('timeout')) }, 5)).rejects.toThrow('transition phase step 5')
})

it('I-46 sample validation rejects missing malformed and out-of-order metadata', async () => {
  const { validateCount, validateStep } = await import('../scripts/validation.mjs')
  const expected = [{ title: 'First', caption: 'Opening', era: 'one' }, { title: 'Second', caption: 'Closing', era: 'two' }]
  expect(() => validateCount(0, expected)).toThrow('sample phase')
  expect(() => validateCount(1, expected)).toThrow('sample phase')
  expect(() => validateStep({}, expected[0], 0)).toThrow('sample phase step 0')
  expect(() => validateStep(expected[1], expected[0], 0)).toThrow('sample phase step 0')
  expect(() => validateStep(expected[0], undefined, 0)).toThrow('sample phase step 0')
  expect(() => validateCount(2, expected)).not.toThrow()
  expect(() => validateStep(expected[0], expected[0], 0)).not.toThrow()
})
it('I-52 settle interval covers motion and rejects invalid configuration', async () => {
  const { SETTLE_MS } = await import('../scripts/browser.mjs')
  const { inspectPresentation } = await import('../scripts/inspect-presentation.mjs')
  const { LAYOUT_T, ENTER_T } = await import('../src/presentation-kit/constants')
  expect(SETTLE_MS).toBeGreaterThanOrEqual((LAYOUT_T + ENTER_T) * 1000)
  await expect(inspectPresentation({ settleMs: -1 })).rejects.toThrow('Invalid settle interval')
  await expect(inspectPresentation({ settleMs: NaN })).rejects.toThrow('Invalid settle interval')
})
