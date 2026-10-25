import { vi, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode, CSSProperties } from 'react'
vi.mock('motion/react', () => ({
  motion: { div: ({ children, layoutId, layout, initial, animate, exit, transition, ...rest }: { children?: ReactNode; layoutId?: string; layout?: boolean; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown; style?: CSSProperties }) => <div {...rest} data-layout-id={layoutId} data-layout={String(layout)} data-initial={JSON.stringify(initial)} data-animate={JSON.stringify(animate)} data-exit={JSON.stringify(exit)} data-transition={JSON.stringify(transition)}>{children}</div> },
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}))
import { Box, Appear } from '../src/presentation-kit/nodes/primitives'
import { LAYOUT_T, ENTER_DELAY } from '../src/presentation-kit/constants'
it('I-4 entity transition contract preserves layout identity and includes exit', () => {
  const { container, rerender } = render(<Box entityId="stable" style={{left:0,width:20}}>old</Box>)
  const element = container.firstElementChild!
  expect(element.getAttribute('data-layout-id')).toBe('stable'); expect(element.getAttribute('data-layout')).toBe('true')
  expect(JSON.parse(element.getAttribute('data-exit')!).opacity).toBe(0)
  expect(JSON.parse(element.getAttribute('data-transition')!).layout).toEqual(LAYOUT_T)
  rerender(<Box entityId="stable" style={{left:100,width:40}}>new</Box>); expect(container.firstElementChild).toBe(element); expect(element.textContent).toBe('new')
})
it('I-5 Appear and primitive newcomers delay entry until layout settles', () => {
  const { container } = render(<Appear><Box entityId="new">new</Box></Appear>)
  const wrapper = container.firstElementChild!, node = wrapper.firstElementChild!
  expect(JSON.parse(wrapper.getAttribute('data-transition')!).delay).toBeGreaterThanOrEqual(LAYOUT_T.duration)
  expect(JSON.parse(node.getAttribute('data-transition')!).opacity.delay).toBe(ENTER_DELAY)
  expect(JSON.parse(node.getAttribute('data-initial')!).opacity).toBe(0)
  expect(JSON.parse(node.getAttribute('data-animate')!).opacity).toBe(1)
})
