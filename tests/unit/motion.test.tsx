import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
const captured = vi.hoisted(() => [] as Record<string, unknown>[])
vi.mock('motion/react', async () => {
  const React = await import('react')
  const element = (tag: string) => function Mock(props: Record<string, unknown>) {
    captured.push(props)
    const { children, layout, layoutId, initial, animate, exit, transition, ...dom } = props
    void layout; void layoutId; void initial; void animate; void exit; void transition
    return React.createElement(tag, dom, children as ReactNode)
  }
  return { motion: { div: element('div'), svg: element('svg'), path: element('path') }, AnimatePresence: ({ children }: { children: ReactNode }) => children, LayoutGroup: ({ children }: { children: ReactNode }) => children }
})
import { Box } from '../../src/presentation-kit/nodes/Box'
import { Appear } from '../../src/presentation-kit/nodes/Appear'
import { Arrow } from '../../src/presentation-kit/nodes/Arrow'
import { LAYOUT_T, ENTER_T } from '../../src/presentation-kit/constants'
it('I-4 stable entity layout and I-5 newcomer/exit props implement ordered motion', () => {
  const { rerender } = render(<Appear><Box id="same" style={{ left: 10, width: 50 }}>old</Box></Appear>)
  expect(captured.find(p => p.layoutId === 'same')).toMatchObject({ layout: true, transition: { layout: LAYOUT_T }, style: { left: 10, width: 50 } })
  expect(captured.find(p => p['data-presentation-appear'] === '')).toMatchObject({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { delay: 0 } }, transition: ENTER_T })
  captured.length = 0
  rerender(<Appear><Box id="same" style={{ left: 40, width: 80 }}>new label</Box></Appear>)
  expect(captured.find(p => p.layoutId === 'same')).toMatchObject({ layout: true, children: expect.anything(), style: { left: 40, width: 80 } })
  render(<Arrow id="link" d="M 0 0 L 10 10" both />)
  expect(captured.find(p => p.layoutId === 'link')).toMatchObject({ layout: true, transition: { layout: LAYOUT_T } })
})
