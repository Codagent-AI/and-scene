import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const seen = vi.hoisted(() => ({
  motion: [] as Record<string, unknown>[],
  presence: [] as Record<string, unknown>[],
  layoutGroups: 0,
}))

vi.mock('motion/react', async () => {
  const React = await import('react')
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        function MockMotion({ initial, animate, exit, transition, layout, layoutId, ...rest }: Record<string, unknown>) {
          seen.motion.push({ tag, initial, animate, exit, transition, layout, layoutId, ...rest })
          return React.createElement(tag, rest as object)
        },
    },
  )
  return {
    motion,
    AnimatePresence: ({ children, ...props }: { children: unknown }) => {
      seen.presence.push(props)
      return children
    },
    LayoutGroup: ({ children }: { children: unknown }) => {
      seen.layoutGroups++
      return children
    },
  }
})

import { ENTER_DELAY, ENTER_T, LAYOUT_T, STEP_FADE_T } from '../constants'
import { Presentation } from '../Presentation'
import { makeSteps } from '../../test-utils/steps'
import { Appear } from './Appear'
import { Box } from './primitives'

describe('applied motion configuration', () => {
  it('Appear fades newcomers in after the layout morph and out on removal', () => {
    seen.motion.length = 0
    render(
      <Appear>
        <i />
      </Appear>,
    )
    const p = seen.motion.find((m) => m['data-presentation-appear'] !== undefined)!
    expect(p.initial).toEqual({ opacity: 0 })
    const animate = p.animate as { opacity: number; transition: { duration: number; delay: number } }
    expect(animate.opacity).toBe(1)
    expect(animate.transition.duration).toBe(ENTER_T)
    expect(animate.transition.duration).toBeGreaterThan(0)
    expect(animate.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(animate.transition.delay).toBe(ENTER_DELAY)
    expect((p.exit as { opacity: number }).opacity).toBe(0)
  })

  it('primitives carry layout projection with their entity id as layoutId', () => {
    seen.motion.length = 0
    render(<Box id="entity-x" />)
    const p = seen.motion.find((m) => m.layoutId === 'entity-x')!
    expect(p.layout).toBe(true)
  })

  it('Stage wires LayoutGroup, AnimatePresence and an opacity cross-fade for scenes', () => {
    seen.motion.length = 0
    seen.presence.length = 0
    seen.layoutGroups = 0
    render(<Presentation steps={makeSteps([{ id: 'a' }])} title="t" />)
    expect(seen.layoutGroups).toBeGreaterThan(0)
    expect(seen.presence.some((p) => p.initial === false)).toBe(true)
    const scene = seen.motion.find((m) => m['data-presentation-scene'] !== undefined)!
    expect(scene.initial).toEqual({ opacity: 0 })
    expect(scene.animate).toEqual({ opacity: 1 })
    expect(scene.exit).toEqual({ opacity: 0 })
    expect((scene.transition as { duration: number }).duration).toBe(STEP_FADE_T)
  })
})
