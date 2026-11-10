import { createElement } from 'react'
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Circle } from 'lucide-react'
const capture = vi.hoisted(() => ({ props: [] as Record<string, unknown>[] }))
vi.mock('motion/react', async () => {
  const React = await import('react')
  function Div(props: Record<string, unknown>) {
    capture.props.push(props)
    const { children, layout: _layout, layoutId: _id, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...dom } = props
    void [_layout, _id, _initial, _animate, _exit, _transition]
    return React.createElement('div', dom, children as ReactNode)
  }
  return { motion: { div: Div }, AnimatePresence: ({ children }: { children: ReactNode }) => children }
})
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../src/presentation-kit'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants'
it('I-18 controlled motion boundary preserves identity and sequences newcomer entrance and exit', () => {
  capture.props = []
  const view = render(<Appear><Box entity="stable">old</Box></Appear>)
  const appear = capture.props.find(p => 'data-presentation-appear' in p)!
  expect(appear.initial).toEqual({ opacity: 0 })
  expect(appear.animate).toEqual({ opacity: 1 })
  expect(appear.exit).toEqual({ opacity: 0 })
  expect(appear.transition).toEqual({ duration: ENTER_T, delay: ENTER_DELAY })
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  const box = capture.props.find(p => p.layoutId === 'stable')!
  expect(box.layout).toBe(true)
  expect(box.transition).toMatchObject({ layout: { duration: LAYOUT_T } })
  const element = view.container.querySelector('[data-presentation-entity]')
  view.rerender(<Appear><Box entity="stable">new</Box></Appear>)
  expect(view.container.querySelector('[data-presentation-entity]')).toBe(element)
  expect(element).toHaveTextContent('new')
})
it('I-20 continuing primitives have no newcomer fade and SceneLayers preserve overlap coordinates', () => {
  capture.props = []
  const view = render(<><SceneLayer><Box entity="a" style={{ position: 'absolute', left: 30, top: 40 }}>A</Box></SceneLayer><SceneLayer><Box entity="b" style={{ position: 'absolute', left: 30, top: 40 }}>B</Box></SceneLayer></>)
  expect(capture.props.filter(p => p.layoutId).every(p => p.initial === undefined && p.animate === undefined)).toBe(true)
  const layers = view.container.querySelectorAll('[data-presentation-layer]')
  expect(layers).toHaveLength(2)
  layers.forEach(el => expect(el).toHaveStyle({ position: 'absolute', inset: '0' }))
  view.container.querySelectorAll('[data-presentation-entity]').forEach(el => expect(el).toHaveStyle({ left: '30px', top: '40px' }))
})
it.each([Box, Label, Arrow, Frame, Emphasis, SymbolChip])('I-21 primitives forward class data style identity and optional glyph without visual defaults (%#)', Node => {
  capture.props = []
  const view = render(createElement(Node, { entity: 'id', className: 'author', style: { left: 42 }, Icon: Circle, 'data-testid': 'node' }, 'text'))
  const node = view.getByTestId('node')
  expect(node).toHaveClass('author')
  expect(node).toHaveStyle({ left: '42px' })
  expect(node).toHaveAttribute('data-presentation-entity', 'id')
  expect(node).toHaveAttribute('data-presentation-node')
  expect(node.querySelector('svg')).toBeTruthy()
  expect(capture.props.find(p => p.layoutId === 'id')?.style).toEqual({ left: 42 })
  view.rerender(createElement(Node, { entity: 'id' }, 'plain'))
  expect(view.container.firstElementChild?.getAttribute('style') || '').toBe('')
})
