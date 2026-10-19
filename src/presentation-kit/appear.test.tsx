import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Enter timing is measured in real time; allow for parallel test load.
vi.setConfig({ testTimeout: 20000 })
import { cleanup, render, waitFor } from '@testing-library/react'
import { Appear } from './nodes/Appear'
import { ENTER_DELAY, ENTER_T, EASE, LAYOUT_T } from './constants'

// Records the props motion.div receives so Appear's transition wiring can be asserted directly.
const captured = vi.hoisted(() => ({ divs: [] as Array<Record<string, unknown>> }))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const React = await import('react')
  const Real = actual.motion.div
  const Recording = React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => {
    captured.divs.push(props)
    return React.createElement(Real, { ...props, ref })
  })
  return { ...actual, motion: { ...actual.motion, div: Recording } }
})

afterEach(cleanup)
beforeEach(() => {
  captured.divs.length = 0
})

describe('newcomer timing constants (L-5)', () => {
  it('ENTER_DELAY is at least LAYOUT_T, so newcomers wait for persisting entities to settle', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_T).toBeGreaterThan(0)
  })

  it("Appear's motion transition uses ENTER_DELAY, ENTER_T and EASE for entering", () => {
    render(
      <Appear>
        <span>newcomer</span>
      </Appear>,
    )
    const props = captured.divs.find((p) => p['data-presentation-appear'] !== undefined)
    expect(props, 'Appear renders a motion.div').toBeDefined()
    const animate = props?.animate as { opacity: number; transition: { delay: number; duration: number; ease: unknown } }
    expect(animate.opacity).toBe(1)
    expect(animate.transition.delay).toBe(ENTER_DELAY)
    expect(animate.transition.duration).toBe(ENTER_T)
    expect(animate.transition.ease).toEqual(EASE)
    expect(props?.initial).toEqual({ opacity: 0 })
  })
})

describe('newcomer enters after the layout interval (L-5)', () => {
  it('keeps the newcomer hidden until ENTER_DELAY and then fades it in', async () => {
    const t0 = performance.now()
    const { container } = render(
      <Appear>
        <span>newcomer</span>
      </Appear>,
    )
    const el = container.querySelector('[data-presentation-appear]') as HTMLElement
    let firstVisibleAt: number | undefined
    const observer = new MutationObserver(() => {
      if (firstVisibleAt === undefined && Number(el.style.opacity) > 0) firstVisibleAt = performance.now() - t0
    })
    observer.observe(el, { attributes: true, attributeFilter: ['style'] })

    // Still hidden while persisting entities are moving.
    await new Promise((r) => setTimeout(r, Math.round(LAYOUT_T * 1000 * 0.5)))
    expect(el.style.opacity).toBe('0')

    await waitFor(() => expect(el.style.opacity).toBe('1'), { timeout: 5000 })
    observer.disconnect()
    expect(firstVisibleAt, 'entering opacity started').toBeDefined()
    // Entering starts only after the layout interval (small slack for timer resolution).
    expect(firstVisibleAt ?? 0).toBeGreaterThanOrEqual(LAYOUT_T * 1000 - 20)
  })
})
