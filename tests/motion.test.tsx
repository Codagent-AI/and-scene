import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { ReactNode, CSSProperties } from 'react'
vi.mock('motion/react', () => ({
  motion: { div: ({ children, layoutId, layout, initial, animate, exit, transition, ...props }: { children: ReactNode; layoutId?: string; layout?: boolean; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown; style?: CSSProperties }) => <div {...props} data-test-layout={String(layout)} data-test-layout-id={layoutId} data-test-initial={JSON.stringify(initial)} data-test-animate={JSON.stringify(animate)} data-test-exit={JSON.stringify(exit)} data-test-transition={JSON.stringify(transition)}>{children}</div> },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  LayoutGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
import { Appear, Box, ENTER_DELAY, ENTER_T, LAYOUT_T, EASE } from '../src/presentation-kit'
it('I-3 continuing identity layout morph and newcomer exit timing', () => {
  const view = render(<><Box id="stable" style={{ left: 10 }}>old</Box><Appear>new</Appear></>)
  const stable = screen.getByText('old')
  expect(stable.getAttribute('data-test-layout-id')).toBe('stable')
  expect(stable.getAttribute('data-test-layout')).toBe('true')
  expect(JSON.parse(stable.getAttribute('data-test-transition')!)).toEqual({ layout: { duration: LAYOUT_T, ease: EASE } })
  expect(stable.getAttribute('data-test-initial')).toBeNull()
  view.rerender(<><Box id="stable" style={{ left: 200 }}>changed</Box><Appear>new</Appear></>)
  expect(screen.getByText('changed')).toBe(stable)
  const newcomer = screen.getByText('new')
  expect(JSON.parse(newcomer.getAttribute('data-test-transition')!)).toMatchObject({ delay: ENTER_DELAY, duration: ENTER_T })
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  expect(JSON.parse(newcomer.getAttribute('data-test-exit')!)).toEqual({ opacity: 0, transition: { duration: ENTER_T, delay: 0 } })
})
