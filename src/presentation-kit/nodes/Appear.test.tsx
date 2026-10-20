import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants.ts'

const captured: Record<string, unknown>[] = []
vi.mock('motion/react', () => ({
  motion: {
    div: (props: Record<string, unknown>) => {
      captured.push(props)
      return null
    },
  },
}))

const { Appear } = await import('./Appear.tsx')

beforeEach(() => {
  captured.length = 0
})

describe('Appear sequencing', () => {
  it('waits for persisting layout motion before fading a newcomer in', () => {
    render(<Appear />)
    const p = captured[0] as { initial: object; animate: object; exit: { opacity: number }; transition: { delay: number; duration: number } }
    expect(p.initial).toEqual({ opacity: 0 })
    expect(p.animate).toEqual({ opacity: 1 })
    expect(p.exit.opacity).toBe(0)
    expect(p.transition.delay).toBe(ENTER_DELAY)
    expect(p.transition.duration).toBe(ENTER_T)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })

  it('honors a delay override and a full transition override', () => {
    render(<Appear delay={2} />)
    expect((captured[0].transition as { delay: number }).delay).toBe(2)
    captured.length = 0
    render(<Appear transition={{ duration: 9 }} />)
    expect(captured[0].transition).toEqual({ duration: 9 })
  })
})
