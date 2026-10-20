import { render } from '@testing-library/react'
import { Rocket } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

// Record the Motion props each primitive passes instead of animating.
vi.mock('motion/react', async () => {
  const React = await import('react')
  const make = (tag: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown>>(function Mock({ initial, animate, exit, layout, layoutId, transition, ...rest }, ref) {
      const recorded = JSON.stringify({ initial, animate, exit, layout, layoutId, transition })
      return React.createElement(tag, { ref, 'data-motion': recorded, ...rest })
    })
  const cache: Record<string, ReturnType<typeof make>> = {}
  return {
    motion: new Proxy({}, { get: (_target, tag: string) => (cache[tag] ??= make(tag)) }),
    AnimatePresence: ({ children }: { children: unknown }) => children,
    LayoutGroup: ({ children }: { children: unknown }) => children,
  }
})

import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants.ts'
import { Appear } from './Appear.tsx'
import { Arrow } from './Arrow.tsx'
import { Box } from './Box.tsx'
import { Emphasis } from './Emphasis.tsx'
import { Frame } from './Frame.tsx'
import { Label } from './Label.tsx'
import { SymbolChip } from './SymbolChip.tsx'

const motionOf = (el: Element) => JSON.parse(el.getAttribute('data-motion')!)

describe('primitives', () => {
  const cases = [
    ['Box', (p: object) => <Box id="e" {...p} />],
    ['Label', (p: object) => <Label id="e" {...p} />],
    ['Frame', (p: object) => <Frame id="e" {...p} />],
    ['Emphasis', (p: object) => <Emphasis id="e" {...p} />],
    ['SymbolChip', (p: object) => <SymbolChip id="e" {...p} />],
  ] as const

  for (const [name, make] of cases) {
    it(`${name} keeps a stable layoutId and forwards class, style and data hooks`, () => {
      const { container } = render(
        make({ className: 'mine', style: { color: 'red' }, 'data-x': 'y', rect: { x: 1, y: 2, w: 3, h: 4 } }),
      )
      const el = container.firstElementChild as HTMLElement
      expect(motionOf(el)).toMatchObject({ layoutId: 'e', layout: true })
      expect(el.getAttribute('data-presentation-entity')).toBe('e')
      expect(el.getAttribute('data-presentation-node')).toBeTruthy()
      expect(el.className).toBe('mine')
      expect(el.getAttribute('data-x')).toBe('y')
      expect(el.style.color).toBe('red')
      expect([el.style.position, el.style.left, el.style.top, el.style.width, el.style.height]).toEqual(['absolute', '1px', '2px', '3px', '4px'])
    })
  }

  it('lets author style win over rect geometry and leaves unplaced nodes unpositioned', () => {
    const { container } = render(<Box id="e" rect={{ x: 1, y: 2, w: 3, h: 4 }} style={{ left: 9 }} />)
    expect((container.firstElementChild as HTMLElement).style.left).toBe('9px')
    const plain = render(<Box id="f" />).container.firstElementChild as HTMLElement
    expect(plain.style.position).toBe('')
  })

  it('morphs a persisting entity in place: same element, new geometry, label and emphasis', () => {
    const view = render(<Box id="e" rect={{ x: 1, y: 2, w: 3, h: 4 }} data-emphasis="off">before</Box>)
    const before = view.container.firstElementChild as HTMLElement
    view.rerender(<Box id="e" rect={{ x: 10, y: 20, w: 30, h: 40 }} data-emphasis="on">after</Box>)
    const after = view.container.firstElementChild as HTMLElement
    expect(after).toBe(before)
    expect([after.style.left, after.style.top, after.style.width, after.style.height]).toEqual(['10px', '20px', '30px', '40px'])
    expect(after.textContent).toBe('after')
    expect(after.getAttribute('data-emphasis')).toBe('on')
    expect(motionOf(after)).toMatchObject({ layoutId: 'e', layout: true })
    expect(motionOf(after).initial).toBeUndefined()
  })

  it('Box renders a Lucide glyph through the icon-as-component contract, and nothing without one', () => {
    const withIcon = render(<Box id="a" Icon={Rocket} />).container
    expect(withIcon.querySelector('svg[data-presentation-icon]')).not.toBeNull()
    const without = render(<Box id="b" />).container
    expect(without.querySelector('svg')).toBeNull()
    expect(without.firstElementChild!.childNodes).toHaveLength(0)
  })

  it('Arrow carries the same identity hooks and draws one or two heads', () => {
    const one = render(<Arrow id="a" from={{ x: 0, y: 0 }} to={{ x: 10, y: 0 }} data-k="v" className="c" />).container.firstElementChild!
    expect(one.getAttribute('data-presentation-entity')).toBe('a')
    expect(one.getAttribute('data-k')).toBe('v')
    expect(one.querySelectorAll('polygon')).toHaveLength(1)
    const two = render(<Arrow id="b" from={{ x: 0, y: 0 }} to={{ x: 10, y: 0 }} bidirectional />).container.firstElementChild!
    expect(two.querySelectorAll('polygon')).toHaveLength(2)
  })
})

describe('Appear', () => {
  it('fades newcomers in only after the layout time and fades them out on exit', () => {
    const { container } = render(
      <Appear>
        <span />
      </Appear>,
    )
    const m = motionOf(container.firstElementChild!)
    expect(m.initial).toEqual({ opacity: 0 })
    expect(m.animate.opacity).toBe(1)
    expect(m.animate.transition.duration).toBe(ENTER_T)
    expect(m.animate.transition.delay).toBe(ENTER_DELAY)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(m.exit.opacity).toBe(0)
  })

  it('accepts a custom delay', () => {
    const { container } = render(
      <Appear delay={2}>
        <span />
      </Appear>,
    )
    expect(motionOf(container.firstElementChild!).animate.transition.delay).toBe(2)
  })

  it('does not wrap persisting entity primitives in newcomer behavior by itself', () => {
    const { container } = render(<Box id="plain" />)
    expect(container.querySelector('[data-presentation-appear]')).toBeNull()
    expect(motionOf(container.firstElementChild!).initial).toBeUndefined()
  })
})
