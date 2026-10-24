import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { render } from '@testing-library/react'

type Props = Record<string, unknown>
const seen: Props[] = []
const MOTION_ONLY = new Set(['layoutId', 'initial', 'animate', 'exit', 'transition'])

// Capture the props the kit hands to motion so morph and sequencing behavior can be asserted
// without relying on jsdom layout measurement.
vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react')
  const motion = new Proxy({}, {
    get: (_t, tag: string) => (props: Props) => {
      seen.push({ tag, ...props })
      const dom = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_ONLY.has(k)))
      return createElement(tag, dom as never)
    },
  })
  return { ...actual, motion }
})

import { Appear, Box, ENTER_DELAY, LAYOUT_T } from '../../src/presentation-kit'

describe('morph and sequencing configuration', () => {
  it('shares one layoutId per entity and animates layout changes over LAYOUT_T', () => {
    seen.length = 0
    const { rerender } = render(<Box id="card" x={10} y={10}>a</Box>)
    rerender(<Box id="card" x={200} y={90}>a</Box>)
    const boxes = seen.filter((p) => p.layoutId === 'card')
    expect(boxes.length).toBeGreaterThanOrEqual(2)
    const transition = boxes[0].transition as { layout: { duration: number } }
    expect(transition.layout.duration).toBe(LAYOUT_T)
    expect((boxes[boxes.length - 1].style as { left: number }).left).toBe(200)
  })

  it('does not give a persisting primitive an enter animation', () => {
    seen.length = 0
    render(<Box id="x">a</Box>)
    expect(seen[0].initial).toBeUndefined()
    expect(seen[0].animate).toBeUndefined()
  })

  it('delays newcomers until the layout morph has finished', () => {
    seen.length = 0
    render(<Appear><Box id="n">n</Box></Appear>)
    const appear = seen.find((p) => 'data-presentation-appear' in p)!
    expect(appear.initial).toEqual({ opacity: 0 })
    const animate = appear.animate as { opacity: number; transition: { delay: number } }
    expect(animate.opacity).toBe(1)
    expect(animate.transition.delay).toBe(ENTER_DELAY)
    expect(animate.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})
