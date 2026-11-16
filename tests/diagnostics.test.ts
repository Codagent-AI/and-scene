// @vitest-environment node
import { JSDOM } from 'jsdom'
import { describe, it, expect, vi } from 'vitest'
import { warningsFor, collectDiagnostics } from '../scripts/diagnostics.mjs'
import { failure, validateReference } from '../scripts/verify.mjs'
import { settle, stopProcess, closeBrowser } from '../scripts/browser.mjs'
import { EventEmitter } from 'node:events'
import reference from '../scripts/reference.json'
const text = (label: string, x: number) => ({ label, rect: { x, y: 0, width: 20, height: 20 } })
const good = { fontSize: 12, color: 'rgb(50, 60, 50)', fontFamily: 'ui-monospace', text: 'made by and-scene', href: 'https://github.com/Codagent-AI/and-scene' }
const data = () => ({ texts: [], chrome: [], attribution: good })
describe('diagnostics and verifier contracts', () => {
  it('I-37 reference validation rejects missing count order title caption and era', () => {
    expect(() => validateReference(reference, reference)).not.toThrow()
    for (const actual of [[], reference.slice(1), [...reference].reverse(), reference.map((s, i) => i ? s : { ...s, title: 'bad' }), reference.map((s, i) => i ? s : { ...s, caption: 'bad' }), reference.map((s, i) => i ? s : { ...s, era: 'bad' })]) expect(() => validateReference(actual, reference)).toThrow(/sample/)
  })
  it('I-39 failure formatting names phase and offending step', () => {
    expect(failure('render', 4, 'console fault')).toBe('FAIL render step 4: console fault')
    expect(failure('transition', 2, 'did not advance')).toContain('transition step 2')
    expect(failure('build', undefined, 'type error')).toBe('FAIL build: type error')
  })
  it('I-40 process cleanup terminates running children and ignores exited ones', async () => {
    const child = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null, kill: vi.fn(() => { queueMicrotask(() => child.emit('exit', 0)); return true }) })
    // The double implements only the lifecycle fields used by cleanup.
    await stopProcess(child)
    expect(child.kill).toHaveBeenCalledWith('SIGTERM')
    await stopProcess({ exitCode: 0, signalCode: null, kill: () => { throw new Error('should not kill') } })
  })
  it('I-40 browser connection and server close after success and close failure', async () => {
    const events: string[] = []
    const server = { close: vi.fn(async () => { events.push('server closed') }) }
    const browser = { close: vi.fn(async () => { events.push('connection closed') }) }
    await closeBrowser(browser, server)
    expect(events).toEqual(['connection closed', 'server closed'])
    browser.close.mockRejectedValueOnce(new Error('connection close fault'))
    await expect(closeBrowser(browser, server)).rejects.toThrow('connection close fault')
    expect(server.close).toHaveBeenCalledTimes(2)
    await closeBrowser(undefined, server)
    expect(server.close).toHaveBeenCalledTimes(3)
  })
  it('I-42 settle sequencing waits configured interval before capture', async () => {
    const events: string[] = []
    await settle({ waitForTimeout: async (ms: number) => { expect(ms).toBe(123); events.push('settled') } }, 123)
    events.push('capture'); expect(events).toEqual(['settled', 'capture'])
  })
  it('I-43 overlapping bounds warn; separated bounds do not', () => {
    expect(warningsFor({ ...data(), texts: [text('one', 0), text('two', 10)] }, 2)).toEqual(['step 2: overlap "one" / "two"'])
    expect(warningsFor({ ...data(), texts: [text('one', 0), text('two', 30)] }, 2)).toEqual([])
  })
  it('I-43 invisible text and explicit allow-overlap subtrees are excluded', () => {
    const dom = new JSDOM('<main data-presentation-root><div data-presentation-allow-overlap="true"><span>allowed</span></div><span style="display:none">hidden</span><span style="opacity:0">transparent</span></main>')
    const { document, Element } = dom.window
    vi.stubGlobal('document', document); vi.stubGlobal('NodeFilter', dom.window.NodeFilter); vi.stubGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window))
    const range = document.createRange()
    vi.spyOn(document, 'createRange').mockReturnValue(Object.assign(range, { getClientRects: () => [{ x: 0, y: 0, width: 10, height: 10 }] }))
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, toJSON() {} })
    expect(collectDiagnostics().texts).toEqual([])
    vi.restoreAllMocks(); vi.unstubAllGlobals(); dom.window.close()
  })

  it('I-43 chrome collision uses full control bounds without duplicate nested text', () => {
    const dom = new JSDOM('<main data-presentation-root><button aria-label="Next">→</button><button style="display:none">hidden</button></main>')
    const { document, Element } = dom.window
    vi.stubGlobal('document', document); vi.stubGlobal('NodeFilter', dom.window.NodeFilter); vi.stubGlobal('getComputedStyle', dom.window.getComputedStyle.bind(dom.window))
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ x: 5, y: 10, width: 40, height: 30, top: 10, left: 5, right: 45, bottom: 40, toJSON() {} })
    expect(collectDiagnostics().texts).toEqual([{ label: 'Next', rect: { x: 5, y: 10, width: 40, height: 30 } }])
    vi.restoreAllMocks(); vi.unstubAllGlobals(); dom.window.close()
  })
  it('I-44 active styles and attribution diagnostics cover defective and polished states', () => {
    expect(warningsFor(data(), 0)).toEqual([])
    for (const kind of ['toc', 'progress']) {
      expect(warningsFor({ ...data(), chrome: [{ kind, active: 'same', inactive: ['same'] }] }, 3).join()).toContain(`step 3: indistinct active ${kind}`)
      expect(warningsFor({ ...data(), chrome: [{ kind, active: 'different', inactive: ['same'] }] }, 3)).toEqual([])
      expect(warningsFor({ ...data(), chrome: [{ kind, active: 'same', inactive: ['other', 'same'] }] }, 3).join()).toContain(`indistinct active ${kind}`)
    }
    for (const attribution of [null, { ...good, fontSize: 9 }, { ...good, color: 'rgb(0, 0, 238)' }, { ...good, fontFamily: '"Times New Roman"' }]) expect(warningsFor({ ...data(), attribution }, 1).join()).toContain('[data-presentation-attribution]')
  })
})

it('browseRoot normalizes present-first apps and preserves browse apps', async () => {
  const { browseRoot } = await import('../scripts/browser.mjs')
  for (const mode of ['browse', 'present']) {
    const hook = { waitFor: vi.fn(), getAttribute: vi.fn(async () => mode) }
    const press = vi.fn()
    expect(await browseRoot({ locator: () => hook, keyboard: { press } })).toBe(hook)
    expect(press.mock.calls).toEqual(mode === 'present' ? [['p']] : [])
  }
})
