import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AnimatePresence } from 'motion/react'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { Presentation } from '../src/presentation-kit/Presentation'
import { GuideScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import type { SceneProps, Step } from '../src/presentation-kit/types'

// Real Motion projection and presence with deterministic DOM geometry, not a motion mock.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const live = this.closest('[data-presentation]')?.getAttribute('data-presentation-mode') === 'present'
    const left = (parseFloat(this.style.left) || 0) + (live ? 200 : 0)
    const top = parseFloat(this.style.top) || 0
    const width = parseFloat(this.style.width) || 100
    const height = parseFloat(this.style.height) || 50
    return { x: left, y: top, left, right: left + width, top, bottom: top + height, width, height, toJSON: () => ({}) }
  })
})
afterEach(() => vi.restoreAllMocks())
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('I-15 real entity lifecycle', () => {
  it('retains the departing node while it fades and removes it only after exit completes', async () => {
    const completed = vi.fn()
    const view = (shown: boolean) => <AnimatePresence>{shown && <Appear key="leaving" onAnimationComplete={completed}>departing entity</Appear>}</AnimatePresence>
    const { rerender } = render(view(true))
    await waitFor(() => expect(completed).toHaveBeenCalled(), { timeout: 2000 })
    const node = screen.getByText('departing entity')
    rerender(view(false))
    expect(node.isConnected).toBe(true)
    await waitFor(() => {
      expect(node.isConnected).toBe(true)
      expect(Number(node.style.opacity)).toBeGreaterThan(0)
      expect(Number(node.style.opacity)).toBeLessThan(1)
    })
    await waitFor(() => expect(node.isConnected).toBe(false))
  })
  it('starts newcomer visibility only after continuing layout motion completes', async () => {
    let settledAt = 0
    const view = (next: boolean) => <div>
      <Box entityId="continuing" style={{ position: 'absolute', left: next ? 300 : 0, width: 100, height: 50 }} onLayoutAnimationComplete={() => { settledAt = performance.now() }}>continuing entity</Box>
      <AnimatePresence>{next && <Appear key="new">newcomer</Appear>}</AnimatePresence>
    </div>
    const { rerender } = render(view(false))
    const continuing = screen.getByText('continuing entity')
    await act(() => delay(50))
    rerender(view(true))
    expect(screen.getByText('continuing entity')).toBe(continuing)
    const newcomer = screen.getByText('newcomer')
    expect(Number(newcomer.style.opacity)).toBe(0)
    let appearedAt = 0
    await waitFor(() => {
      expect(Number(newcomer.style.opacity)).toBeGreaterThan(0)
      appearedAt = performance.now()
    }, { timeout: 2000, interval: 5 })
    // Assert at the FIRST visible sample; do not let waitFor retry until layout completes.
    expect(settledAt).toBeGreaterThan(0)
    expect(appearedAt).toBeGreaterThanOrEqual(settledAt)
  })
})
describe('I-16 real continuing entities', () => {
  it('keeps the original wrapper fully visible throughout a grouped payload update', async () => {
    const { container, rerender } = render(<GuideScene payload={1} />)
    const you = container.querySelector('[data-entity="you"]')!
    const wrapper = you.parentElement!
    await waitFor(() => expect(Number(wrapper.style.opacity)).toBe(1), { timeout: 2000 })
    rerender(<GuideScene payload={2} />)
    for (let frame = 0; frame < 40; frame++) {
      expect(container.querySelector('[data-entity="you"]')?.parentElement).toBe(wrapper)
      expect(Number(wrapper.style.opacity)).toBe(1)
      await act(() => delay(20))
    }
  })
})
describe('I-21 real mode projection', () => {
  it('snaps both mode changes without layout animation while normal step movement still animates', async () => {
    const started = vi.fn()
    function Scene({ payload }: SceneProps<number>) {
      return <Box entityId="mode-entity" style={{ position: 'absolute', left: payload * 100, width: 100, height: 50 }} onLayoutAnimationStart={started}>mode entity</Box>
    }
    const steps: Step<number>[] = [0, 1, 2].map(payload => ({ id: String(payload), era: 'era', title: 'Title', caption: 'Caption', groupKey: 'one', Scene, payload }))
    render(<Presentation steps={steps} title="Real motion" />)
    await act(() => delay(50))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(started).toHaveBeenCalled(), { timeout: 2000 })
    await act(() => delay(600))
    started.mockClear()
    const node = screen.getByText('mode entity')
    for (const action of [() => fireEvent.keyDown(window, { key: 'p' }), () => fireEvent.click(screen.getByLabelText('Toggle presentation mode'))]) {
      action()
      await act(() => delay(100))
      expect(started).not.toHaveBeenCalled()
      expect(screen.getByText('mode entity')).toBe(node)
      expect(document.querySelector('[data-presentation]')?.getAttribute('data-step-index')).toBe('1')
    }
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(started).toHaveBeenCalled(), { timeout: 2000 })
  })
})
