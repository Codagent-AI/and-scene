import { AnimatePresence } from 'motion/react'
import { act, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Stage } from '../src/presentation-kit/Stage'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import type { SceneProps, Step } from '../src/presentation-kit/types'

// jsdom has no layout engine. Supply measured geometry only; Motion, its presence
// host, frame loop, layout projection, and opacity animations remain unmocked.
afterEach(() => vi.restoreAllMocks())
const pause = async (ms: number) => { await act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) }) }

it('I-3 actual presence host sequences newcomers after layout and retains departures until exit finishes', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const left = Number.parseFloat(this.style.left) || 0
    const top = Number.parseFloat(this.style.top) || 0
    const width = Number.parseFloat(this.style.width) || 0
    const height = Number.parseFloat(this.style.height) || 0
    return { x: left, y: top, left, top, right: left + width, bottom: top + height, width, height, toJSON() {} }
  })
  const started = vi.fn()
  function Diagram({ payload: { next } }: SceneProps<{ next: boolean }>) {
    return <AnimatePresence>
      <Box key="continuing" id="continuing" onLayoutAnimationStart={started} style={{ left: next ? 120 : 20, top: 20, width: next ? 140 : 100, height: 40 }}>{next ? 'Updated' : 'Original'}</Box>
      {!next && <Box key="departing" id="departing" style={{ left: 200, top: 20, width: 100, height: 40 }}>Departing</Box>}
      {next && <Box key="newcomer" id="newcomer" style={{ left: 340, top: 20, width: 100, height: 40 }}>Newcomer</Box>}
    </AnimatePresence>
  }
  const step = (next: boolean): Step<{ next: boolean }> => ({ id: next ? 'after' : 'before', era: 'motion', title: 'Motion', caption: 'Motion lifecycle.', groupKey: 'same-scene', Scene: Diagram, payload: { next } })
  const { container, rerender } = render(<Stage step={step(false)} scale={1} />)
  const find = (id: string) => container.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)
  await waitFor(() => expect(Number(find('departing')!.style.opacity)).toBeCloseTo(1, 2), { timeout: 2500 })
  const continuing = find('continuing')!
  const departing = find('departing')!
  started.mockClear()
  rerender(<Stage step={step(true)} scale={1} />)
  expect(find('continuing')).toBe(continuing)
  expect(continuing.textContent).toBe('Updated')
  expect(continuing.style.left).toBe('120px')
  expect(continuing.style.width).toBe('140px')
  expect(find('departing')).toBe(departing)
  expect(Number(find('newcomer')!.style.opacity)).toBe(0)

  // Before the layout interval finishes, a continuing entity is projected from
  // its old geometry, the departing entity fades, and the newcomer stays hidden.
  await pause(100)
  expect(started).toHaveBeenCalled()
  expect(continuing.style.transform).not.toBe('none')
  expect(continuing.style.transform).not.toBe('')
  expect(Number(find('newcomer')!.style.opacity)).toBe(0)
  expect(find('departing')).toBe(departing)
  expect(Number(departing.style.opacity)).toBeGreaterThan(0)
  expect(Number(departing.style.opacity)).toBeLessThan(1)
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  await pause(200)
  expect(Number(find('newcomer')!.style.opacity)).toBe(0)

  await waitFor(() => expect(find('departing')).toBeNull(), { timeout: 1500 })
  await waitFor(() => expect(Number(find('newcomer')!.style.opacity)).toBeCloseTo(1, 2), { timeout: (ENTER_DELAY + ENTER_T) * 1000 + 1500 })
  await waitFor(() => expect(continuing.style.transform).toBe('none'), { timeout: 1500 })
  expect(find('continuing')).toBe(continuing)
  expect(Number(continuing.style.opacity)).toBeCloseTo(1, 2)
}, 8000)
