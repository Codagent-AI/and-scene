import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it, vi } from 'vitest'
// JavaScript script contracts are exercised directly; real browser checks are separate.
// @ts-expect-error JavaScript script has no declaration file.
import { validateSample, browserFailure, parseVerifyArgs } from '../scripts/verify.mjs'
// @ts-expect-error JavaScript script has no declaration file.
import { captureStep, inspectPresentation } from '../scripts/inspect-presentation.mjs'
// @ts-expect-error JavaScript script has no declaration file.
import { inspectDOM } from '../scripts/diagnostics.mjs'
// @ts-expect-error JavaScript helper has no declaration file.
import { resolveTemplate } from '../skills/presentation/resolve-template.mjs'
import reference from '../scripts/reference.json'
it('I-39 sample validation rejects missing count order and altered metadata', () => {
  expect(() => validateSample(reference, reference)).not.toThrow()
  expect(() => validateSample([], reference)).toThrow('expected 9')
  expect(() => validateSample([...reference].reverse(), reference)).toThrow('step 0')
  for (const key of ['id', 'era', 'title', 'caption']) {
    const altered = reference.map(row => ({ ...row })); altered[4] = { ...altered[4], [key]: 'wrong' }
    expect(() => validateSample(altered, reference)).toThrow(`step 4: ${key}`)
  }
})
it('I-42 console and page failures identify the active step', () => {
  expect(() => browserFailure([], 3)).not.toThrow()
  for (const error of ['console: broken', 'pageerror: broken']) expect(() => browserFailure([error], 3)).toThrow(`render step 3: ${error}`)
})
it('I-45 configured settling precedes diagnostics and screenshot capture', async () => {
  vi.useFakeTimers()
  const calls: string[] = []
  const page = { waitForFunction: vi.fn(async () => { calls.push('index') }), evaluate: vi.fn(async () => { calls.push('diagnostics'); return [] }), screenshot: vi.fn(async () => { calls.push('screenshot') }) }
  const pending = captureStep(page, 1, 900, 'step-02.png')
  await vi.advanceTimersByTimeAsync(899)
  expect(calls).toEqual(['index'])
  await vi.advanceTimersByTimeAsync(1); await pending
  expect(calls).toEqual(['index', 'diagnostics', 'screenshot'])
  vi.useRealTimers()
})
function diagnosticFixture({ allowed = false, hidden = false, activeDifferent = false, size = '9px', defaultLink = false } = {}) {
  document.body.innerHTML = `<main data-presentation-root><div ${allowed ? 'data-presentation-allow-overlap' : ''}><span id="one">collision one</span><span id="two" ${hidden ? 'style="display:none"' : ''}>collision two</span></div><nav data-presentation-progress><button data-presentation-active="true" style="color:${activeDifferent ? 'red' : 'black'}">current</button><button data-presentation-active="false" style="color:black">other</button></nav><aside data-presentation-attribution><a style="font-size:${size};color:${defaultLink ? 'rgb(0, 0, 238)' : 'rgb(30, 60, 40)'};text-decoration-line:${defaultLink ? 'underline' : 'none'}">made by and-scene</a></aside></main>`
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function(this: Element) { const overlap = ['one', 'two'].includes(this.id); const x = overlap ? 10 : Array.from(document.querySelectorAll('*')).indexOf(this) * 100; return { left: x, top: 10, right: x + 50, bottom: 30, width: 50, height: 20, x, y: 10, toJSON() {} } })
  Object.defineProperty(Element.prototype, 'checkVisibility', { configurable: true, value() { return true } })
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value(this: Range) { return [this.startContainer.parentElement!.getBoundingClientRect()] } })
}
it('I-46 collision classifier reports unmarked overlap and skips hidden and exempt text', () => {
  diagnosticFixture(); expect(inspectDOM().some((s: string) => s.includes('overlap: collision one / collision two'))).toBe(true)
  diagnosticFixture({ allowed: true }); expect(inspectDOM().some((s: string) => s.startsWith('overlap:'))).toBe(false)
  diagnosticFixture({ hidden: true }); expect(inspectDOM().some((s: string) => s.startsWith('overlap:'))).toBe(false)
  vi.restoreAllMocks()
})
it('I-47 diagnostic classifier distinguishes active styling and attribution polish', () => {
  diagnosticFixture(); expect(inspectDOM()).toContain('indistinct active progress: style [data-presentation-active="true"]'); expect(inspectDOM()).toContain('unpolished attribution: style [data-presentation-attribution]')
  diagnosticFixture({ activeDifferent: true, size: '12px' }); expect(inspectDOM().some((s: string) => /indistinct|attribution/.test(s))).toBe(false)
  diagnosticFixture({ size: '16px', defaultLink: true }); expect(inspectDOM()).toContain('unpolished attribution: style [data-presentation-attribution]')
  document.querySelector('aside')!.remove(); expect(inspectDOM()).toContain('missing attribution: style [data-presentation-attribution]')
  vi.restoreAllMocks()
})
it('inspection rejects invalid slug without launching a browser', async () => {
  await expect(inspectPresentation('../escape')).rejects.toThrow('registered presentation slug')
})

it('I-29 explicit target overrides bootstrap default and missing values fail', () => {
  expect(parseVerifyArgs([])).toBeUndefined()
  expect(parseVerifyArgs(['--slug', 'starter'])).toBe('starter')
  expect(parseVerifyArgs(['--slug', 'starter', '--slug', 'generated-probe'])).toBe('generated-probe')
  expect(() => parseVerifyArgs(['--slug', 'starter', '--slug'])).toThrow('requires a registered slug')
  expect(() => parseVerifyArgs(['--slug', '--other'])).toThrow('requires a registered slug')
})
it('I-24 template lookup is skill-relative and rejects unknown template names', () => {
  for (const name of ['bootstrap', 'presentation']) expect(resolveTemplate(name)).toBe(resolve(dirname(fileURLToPath(import.meta.url)), '../skills/presentation/templates', name))
  expect(() => resolveTemplate('../escape')).toThrow('Template must be')
})
