import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
const { captured } = vi.hoisted(() => ({ captured: [] as Record<string, unknown>[] }))
vi.mock('motion/react', async () => {
  const React = await import('react')
  const Div = React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => { captured.push(props); const { children, style, className } = props; return <div ref={ref} style={style as React.CSSProperties} className={className as string}>{children as React.ReactNode}</div> })
  return { motion: { div: Div }, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>, LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</> }
})
import { Box, Appear } from '../src/presentation-kit/nodes/primitives'
import { StoryScene } from '../src/presentations/how-to-make-a-presentation/steps'
import { LAYOUT_T, ENTER_T } from '../src/presentation-kit/constants'
it('I-4 motion contracts preserve layout identity and animate departing entities', () => {
  captured.length = 0
  const view = render(<Box entityId="stable" style={{ left: 10, width: 20 }}>old</Box>)
  view.rerender(<Box entityId="stable" style={{ left: 40, width: 80 }} data-emphasis="strong">new</Box>)
  const nodes = captured.filter(p => p.layoutId === 'stable')
  expect(nodes).toHaveLength(2); expect(nodes[0].layout).toBe(true); expect(nodes[1].style).toEqual({ left: 40, width: 80 }); expect(nodes[1].children).toEqual([undefined, 'new']); expect(nodes[1]['data-emphasis']).toBe('strong'); expect(nodes[1].transition).toEqual({ layout: LAYOUT_T }); expect(nodes[1].exit).toEqual({ opacity: 0, transition: { duration: 0.2 } })
})
it('I-5 continuing grouped nodes do not restart newcomer fade and newcomers have delayed entry', () => {
  captured.length = 0
  const view = render(<Appear>new</Appear>)
  expect(captured[0].initial).toEqual({ opacity: 0 }); expect(captured[0].animate).toEqual({ opacity: 1 }); expect(captured[0].exit).toEqual({ opacity: 0 }); expect(captured[0].transition).toEqual(ENTER_T); view.unmount()
  const scene = render(<StoryScene payload={3} step={{ id: 'a', era: 'era', title: 'title', caption: 'caption' }} />)
  const continuing = document.querySelector('strong')
  scene.rerender(<StoryScene payload={4} step={{ id: 'b', era: 'era', title: 'title', caption: 'caption' }} />)
  expect(continuing).not.toBeNull(); expect(document.querySelector('strong')).toBe(continuing)
  for (const props of captured.filter(p => p.layoutId)) expect(props.initial).toBeUndefined()
})
