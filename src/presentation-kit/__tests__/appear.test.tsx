// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { createElement, forwardRef, type ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'
import { Appear, Box, Label } from '../index'

// Records the props Appear hands to the real motion element.
const spy = vi.hoisted(() => ({ divProps: [] as Array<Record<string, unknown>> }))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const Spy = forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => {
    spy.divProps.push(props)
    return createElement(actual.motion.div as unknown as ComponentType<Record<string, unknown>>, { ...props, ref })
  })
  return { ...actual, motion: Object.assign(Object.create(null), actual.motion, { div: Spy }) }
})

describe('Appear entry', () => {
  it('hands motion a hidden initial state, a visible target, and the settle delay', () => {
    spy.divProps.length = 0
    render(
      <Appear>
        <span>newcomer</span>
      </Appear>,
    )
    const props = spy.divProps.find((p) => 'data-presentation-appear' in p)!
    expect(props.initial).toEqual({ opacity: 0 })
    expect(props.animate).toEqual({ opacity: 1 })
    expect(props.transition).toEqual({ delay: ENTER_DELAY, duration: ENTER_T, ease: expect.any(Array) })
  })

  it('starts entry only after the layout morph has settled', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('does not fade the exit of a newcomer in the same delayed timing', () => {
    spy.divProps.length = 0
    render(<Appear>x</Appear>)
    const props = spy.divProps.find((p) => 'data-presentation-appear' in p)!
    expect((props.exit as { transition: { delay: number } }).transition.delay).toBe(0)
  })

  it('passes the stable layoutId and layout projection to the real motion element', () => {
    spy.divProps.length = 0
    render(<Box layoutId="presentation:demo:you" style={{ left: 0, top: 0, width: 1, height: 1 }}>kept</Box>)
    const props = spy.divProps.find((p) => p.layoutId === 'presentation:demo:you')!
    expect(props.layout).toBe(true)
    expect(props.style).toEqual({ position: 'absolute', left: 0, top: 0, width: 1, height: 1 })
  })

  it('animates a removed node out with an exit that is not delayed', () => {
    spy.divProps.length = 0
    render(<Label layoutId="presentation:demo:gone">gone</Label>)
    const props = spy.divProps.find((p) => p.layoutId === 'presentation:demo:gone')!
    expect(props.exit).toEqual({ opacity: 0 })
    expect(props.transition).toEqual({ duration: LAYOUT_T, ease: expect.any(Array) })
  })

  it('forwards changed state to the same motion element when a continuing entity updates', () => {
    spy.divProps.length = 0
    const view = render(
      <Box layoutId="presentation:demo:card" data-presentation-state="plain" style={{ left: 10, top: 10, width: 1, height: 1 }}>
        card
      </Box>,
    )
    view.rerender(
      <Box layoutId="presentation:demo:card" data-presentation-state="edited" style={{ left: 10, top: 10, width: 1, height: 1 }}>
        card
      </Box>,
    )
    const latest = spy.divProps.filter((p) => p.layoutId === 'presentation:demo:card').at(-1)!
    expect(latest['data-presentation-state']).toBe('edited')
    expect(latest.layoutId).toBe('presentation:demo:card')
  })

  it('is never applied to a continuing entity by a primitive', () => {
    spy.divProps.length = 0
    render(<Box layoutId="continuing" style={{ left: 0, top: 0, width: 1, height: 1 }}>kept</Box>)
    expect(spy.divProps.some((p) => 'data-presentation-appear' in p)).toBe(false)
  })
})
