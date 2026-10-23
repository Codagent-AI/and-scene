// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants'

// Captures the props motion receives, so the newcomer timing can be asserted without animating.
const captured: Record<string, unknown>[] = []

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  const div = (props: Record<string, unknown>) => {
    captured.push(props)
    const { children } = props as { children?: ReactNode }
    return createElement('div', { 'data-presentation-appear': '' }, children)
  }
  return { ...actual, motion: new Proxy(actual.motion, { get: (target, key) => (key === 'div' ? div : Reflect.get(target, key)) }) }
})

const { Appear } = await import('../../src/presentation-kit/nodes/Appear')

describe('Appear newcomer timing', () => {
  it('starts newcomers invisible and delays their fade until persisting entities have moved', () => {
    captured.length = 0
    render(createElement(Appear, null, createElement('span', null, 'new')))
    const props = captured[0] as {
      initial: { opacity: number }
      animate: { opacity: number }
      transition: { delay: number; duration: number }
    }
    expect(props.initial.opacity).toBe(0)
    expect(props.animate.opacity).toBe(1)
    expect(props.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(props.transition.delay).toBe(ENTER_DELAY)
    expect(props.transition.duration).toBe(ENTER_T)
  })
})
