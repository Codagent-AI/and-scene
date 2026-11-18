import { afterEach, describe, expect, it, vi } from 'vitest'
import { PNG } from 'pngjs'
import { captureStep, readCaptureState, regionsArePainted } from '../scripts/capture-step.mjs'

vi.mock('../scripts/browser-runtime.mjs', () => ({ sleep: vi.fn(async () => {}) }))
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = '' })
const visible = [{ id: 'seed', x: 100, y: 80, width: 100, height: 40, opacity: 1, visible: true }]
const hidden = [{ ...visible[0], opacity: 0, visible: false }]
const key = { id: 'reading-key', text: 'Scene labels', x: 10, y: 10, width: 20, height: 20, opacity: 1, visible: true, background: 'rgb(255, 253, 247)', probes: [[5, 5], [5, -5]] }
function state(entities = visible, regions: typeof key[] = []) {
  return { viewport: { width: 200, height: 200 }, entities, chrome: [], regions }
}
function image(withKey: boolean) {
  const png = new PNG({ width: 200, height: 200 })
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const color = withKey && x >= 10 && x < 30 && y >= 10 && y < 30 ? [255, 253, 247] : [244, 240, 230]
    const offset = (y * png.width + x) * 4
    png.data.set([...color, 255], offset)
  }
  return PNG.sync.write(png)
}
function pageFor(states = [state()]) {
  let index = 0
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { queueMicrotask(callback); return 1 })
  return {
    bringToFront: vi.fn(async () => {}),
    evaluate: vi.fn(async (callback: () => unknown) => callback === readCaptureState ? states[Math.min(index++, states.length - 1)] : callback()),
    screenshot: vi.fn(async () => Buffer.from('painted screenshot')),
  }
}

describe('F-002 first-step capture readiness', () => {
  it('waits for initially invisible motion entities, fonts and paint, then captures a stable viewport', async () => {
    const page = pageFor([state(hidden), state(hidden), state(), state(), state()])
    const result = await captureStep(page, { index: 0, settle: 1000 })
    expect(page.bringToFront).toHaveBeenCalledOnce()
    expect(page.evaluate.mock.calls.filter(([callback]) => callback === readCaptureState)).toHaveLength(5)
    expect(page.screenshot).toHaveBeenCalledExactlyOnceWith({ fullPage: false, animations: 'allow' })
    expect(result.scene).toEqual(visible)
    expect(result.buffer.toString()).toBe('painted screenshot')
  })
  it('discards a capture invalidated by layout changes and returns only the stable retry', async () => {
    const moved = state([{ ...visible[0], x: 110 }])
    const page = pageFor([state(), state(), moved, moved, moved, moved])
    page.screenshot.mockResolvedValueOnce(Buffer.from('unstable')).mockResolvedValueOnce(Buffer.from('stable'))
    const result = await captureStep(page, { index: 0, settle: 0 })
    expect(page.screenshot).toHaveBeenCalledTimes(2)
    expect(result.buffer.toString()).toBe('stable')
    expect(result.scene).toEqual(moved.entities)
  })
  it('fails with the step index instead of saving a blank first scene', async () => {
    const page = pageFor([state(hidden)])
    await expect(captureStep(page, { index: 0, settle: 0 })).rejects.toThrow('inspection step 0: scene or chrome did not become stable and painted; no screenshot saved')
    expect(page.screenshot).not.toHaveBeenCalled()
  })
  it('supports scenes without kit entity hooks', async () => {
    const page = pageFor([state([])])
    expect((await captureStep(page, { index: 1, settle: 0 })).scene).toEqual([])
  })
  it('reads inherited visibility and transformed viewport bounds rather than animation counts', () => {
    document.body.innerHTML = '<div data-presentation-canvas><div id="parent" style="opacity:0"><div data-presentation-entity="seed" style="opacity:0.5">Seed</div></div></div>'
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 80, 100, 40))
    expect(readCaptureState().entities[0]).toMatchObject({ opacity: 0, visible: false })
    document.getElementById('parent')!.style.opacity = '1'
    expect(readCaptureState().entities[0]).toMatchObject({ x: 100, y: 80, width: 100, height: 40, opacity: 0.5, visible: true })
    document.getElementById('parent')!.style.display = 'none'
    expect(readCaptureState().entities[0].visible).toBe(false)
  })
})

describe('F-003 complete UI capture faithfulness', () => {
  it('retries an image missing the reading key even when canvas and DOM snapshots are unchanged', async () => {
    const page = pageFor([state(visible, [key])])
    page.screenshot.mockResolvedValueOnce(image(false)).mockResolvedValueOnce(image(true))
    const result = await captureStep(page, { index: 8, settle: 0 })
    expect(page.screenshot).toHaveBeenCalledTimes(2)
    expect(regionsArePainted(result.buffer, state(visible, [key]))).toBe(true)
    expect(result.regions[0].id).toBe('reading-key')
  })
  it('fails rather than publishing a persistently omitted panel', async () => {
    const page = pageFor([state(visible, [key])])
    page.screenshot.mockResolvedValue(image(false))
    await expect(captureStep(page, { index: 8, settle: 0 })).rejects.toThrow('inspection step 8: scene or chrome did not become stable and painted; no screenshot saved')
  })
  it('rejects portal layout changes even when all canvas entities remain stable', async () => {
    const initial = state(visible, [{ ...key, probes: [] }])
    const moved = state(visible, [{ ...key, y: 20, probes: [] }])
    const page = pageFor([initial, initial, moved, moved, moved, moved])
    const result = await captureStep(page, { index: 8, settle: 0 })
    expect(page.screenshot).toHaveBeenCalledTimes(2)
    expect(result.regions[0].y).toBe(20)
  })
  it('measures author-marked regions outside the canvas and includes their active text', () => {
    document.body.innerHTML = '<main data-step-index="8"><footer data-presentation-footer>Caption</footer></main><aside data-presentation-capture-region="reading-key" data-presentation-capture-probes="5,14;5,-14" style="background:#fffdf7">Final scene labels</aside>'
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(16, 453, 358, 151))
    document.querySelector('aside')!.scrollTop = 12
    const snapshot = readCaptureState()
    expect(snapshot.entities).toEqual([])
    expect(snapshot.regions[0]).toMatchObject({ id: 'reading-key', text: 'Final scene labels', scrollTop: 12, x: 16, y: 453, probes: [[5, 14], [5, -14]], visible: true })
    expect(snapshot.chrome[0].text).toBe('Caption')
  })
  it('requires opaque valid in-region probes and ignores hidden regions', () => {
    const buffer = image(true)
    expect(regionsArePainted(buffer, state(visible, [key]))).toBe(true)
    for (const region of [{ ...key, probes: [[100, 5]] }, { ...key, probes: [[NaN, 5]] }, { ...key, background: 'rgba(255, 253, 247, 0.5)' }]) expect(regionsArePainted(buffer, state(visible, [region]))).toBe(false)
    expect(regionsArePainted(image(false), state(visible, [{ ...key, visible: false }]))).toBe(true)
  })
})
