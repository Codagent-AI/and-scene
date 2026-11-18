import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureStep, readSceneState } from '../scripts/capture-step.mjs'

vi.mock('../scripts/browser-runtime.mjs', () => ({ sleep: vi.fn(async () => {}) }))
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })
const visible = [{ id: 'seed', x: 100, y: 80, width: 100, height: 40, opacity: 1, visible: true }]
const hidden = [{ ...visible[0], opacity: 0, visible: false }]
function pageFor(states = [visible]) {
  let index = 0
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { queueMicrotask(callback); return 1 })
  return {
    bringToFront: vi.fn(async () => {}),
    evaluate: vi.fn(async (callback: () => unknown) => callback === readSceneState ? states[Math.min(index++, states.length - 1)] : callback()),
    screenshot: vi.fn(async () => Buffer.from('painted screenshot')),
  }
}

describe('F-002 first-step capture readiness', () => {
  it('waits for initially invisible motion entities, fonts and paint, then captures a stable viewport', async () => {
    const page = pageFor([hidden, hidden, visible, visible, visible])
    const result = await captureStep(page, { index: 0, settle: 1000 })
    expect(page.bringToFront).toHaveBeenCalledOnce()
    expect(page.evaluate.mock.calls.filter(([callback]) => callback === readSceneState)).toHaveLength(5)
    expect(page.screenshot).toHaveBeenCalledExactlyOnceWith({ fullPage: false, animations: 'allow' })
    expect(result.scene).toEqual(visible)
    expect(result.buffer.toString()).toBe('painted screenshot')
  })
  it('discards a capture invalidated by layout changes and returns only the stable retry', async () => {
    const moved = [{ ...visible[0], x: 110 }]
    const page = pageFor([visible, visible, moved, moved, moved, moved])
    page.screenshot.mockResolvedValueOnce(Buffer.from('unstable')).mockResolvedValueOnce(Buffer.from('stable'))
    const result = await captureStep(page, { index: 0, settle: 0 })
    expect(page.screenshot).toHaveBeenCalledTimes(2)
    expect(result.buffer.toString()).toBe('stable')
    expect(result.scene).toEqual(moved)
  })
  it('fails with the step index instead of saving a blank first scene', async () => {
    const page = pageFor([hidden])
    await expect(captureStep(page, { index: 0, settle: 0 })).rejects.toThrow('inspection step 0: scene did not become visible and settle; no screenshot saved')
    expect(page.screenshot).not.toHaveBeenCalled()
  })
  it('supports scenes without kit entity hooks', async () => {
    const page = pageFor([[]])
    expect((await captureStep(page, { index: 1, settle: 0 })).scene).toEqual([])
  })
  it('reads inherited visibility and transformed viewport bounds rather than animation counts', () => {
    document.body.innerHTML = '<div data-presentation-canvas><div id="parent" style="opacity:0"><div data-presentation-entity="seed" style="opacity:0.5">Seed</div></div></div>'
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 80, 100, 40))
    expect(readSceneState()[0]).toMatchObject({ opacity: 0, visible: false })
    document.getElementById('parent')!.style.opacity = '1'
    expect(readSceneState()[0]).toMatchObject({ x: 100, y: 80, width: 100, height: 40, opacity: 0.5, visible: true })
    document.getElementById('parent')!.style.display = 'none'
    expect(readSceneState()[0].visible).toBe(false)
  })
})
