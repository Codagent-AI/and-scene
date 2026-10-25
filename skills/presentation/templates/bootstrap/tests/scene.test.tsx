import { createElement, useEffect } from 'react'
import type { PropsWithChildren } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, renderHook, act, screen } from '@testing-library/react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { validateSteps } from '../src/presentation-kit/validateSteps'
import { Stage } from '../src/presentation-kit/Stage'
import { Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer } from '../src/presentation-kit'
import { LAYOUT_T, ENTER_DELAY, ENTER_T, DESIGN_W, DESIGN_H } from '../src/presentation-kit/constants'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import type { SceneProps, Step } from '../src/presentation-kit'
vi.mock('motion/react', () => ({
  LayoutGroup: ({ children }: PropsWithChildren) => children,
  AnimatePresence: ({ children }: PropsWithChildren) => children,
  motion: { div: ({ children, layoutId, layout, transition, initial, animate, exit, ...props }: PropsWithChildren<Record<string, unknown>>) => createElement('div', { ...props, 'data-motion-id': layoutId, 'data-motion-config': JSON.stringify({ layout, transition, initial, animate, exit }) }, children) },
}))
const Scene = ({ payload }: SceneProps<string>) => <Box identity="test:box">{payload}</Box>
const makeSteps = (): Step<string>[] => [0, 1, 2].map(i => ({ id: `s${i}`, era: i < 2 ? 'first' : 'second', title: `Title ${i}`, caption: `Paragraph ${i}`, payload: `Diagram ${i}`, Scene, groupKey: 'group' }))
const key = (value: string, target: EventTarget = window) => {
  const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })
  act(() => { target.dispatchEvent(event) })
  return event
}
describe('scene contracts', () => {
  test('I-1 metadata drives active narration and diagram; invalid identities fail', () => {
    render(<Presentation steps={makeSteps()} title="Test" />)
    expect(screen.getByText('Title 0')).toBeTruthy()
    expect(screen.getByText('Paragraph 0')).toBeTruthy()
    expect(screen.getByText('Diagram 0')).toBeTruthy()
    expect(screen.getByText('01 / first')).toBeTruthy()
    expect(() => validateSteps([])).toThrow('at least one')
    expect(() => validateSteps([makeSteps()[0], makeSteps()[0]])).toThrow('unique')
  })
  test('I-2 numbers derive from current order after reorder insert remove', () => {
    const steps = makeSteps(), { rerender } = render(<Presentation steps={steps} title="Test" />)
    for (const ordered of [[steps[2], ...steps.slice(0, 2)], [steps[2], steps[1]], [{ ...steps[0], id: 'inserted', title: 'Inserted' }, ...steps]]) {
      rerender(<Presentation steps={ordered} title="Test" />)
      expect(screen.getByText(`01 / ${ordered[0].era}`)).toBeTruthy()
      fireEvent.click(screen.getByLabelText(`Step ${ordered.length}: ${ordered.at(-1)!.title}`))
      expect(screen.getByText(`${String(ordered.length).padStart(2, '0')} / ${ordered.at(-1)!.era}`)).toBeTruthy()
      fireEvent.click(screen.getByLabelText(`Step 1: ${ordered[0].title}`))
    }
  })
  test('I-4 motion identity layout morph and exit configuration', () => {
    const { container, rerender } = render(<Box identity="same" style={{ left: 2, width: 20 }}>old</Box>)
    const before = container.firstChild
    rerender(<Box identity="same" style={{ left: 20, width: 60, fontWeight: 700 }}>new</Box>)
    expect(container.firstChild).toBe(before)
    const el = container.firstElementChild!
    expect(el.getAttribute('data-motion-id')).toBe('same')
    expect(el.textContent).toBe('new')
    const config = JSON.parse(el.getAttribute('data-motion-config')!)
    expect(config.layout).toBe(true)
    expect(config.transition.layout.duration).toBe(LAYOUT_T)
    expect(config.exit.opacity).toBe(0)
    expect((el as HTMLElement).style.left).toBe('20px')
  })
  test('I-5 newcomers wait for layout duration before fading in', () => {
    const { container } = render(<Appear>new</Appear>)
    const config = JSON.parse(container.firstElementChild!.getAttribute('data-motion-config')!)
    expect(config.initial.opacity).toBe(0)
    expect(config.animate.opacity).toBe(1)
    expect(config.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(config.transition.delay).toBe(ENTER_DELAY)
    expect(config.transition.duration).toBe(ENTER_T)
    expect(config.exit.opacity).toBe(0)
  })
  test('I-6 grouped scene persists while payload updates; distinct group or Scene remounts', () => {
    let mounts = 0, unmounts = 0
    function Persistent({ payload }: SceneProps<string>) {
      useEffect(() => { mounts++; return () => { unmounts++ } }, [])
      return <Box identity="continuing">{payload}</Box>
    }
    const step = { ...makeSteps()[0], Scene: Persistent }
    const { rerender, container } = render(<Stage step={step} mode="browse" />)
    const original = container.querySelector('[data-motion-id="continuing"]')
    rerender(<Stage step={{ ...step, id: 'next', payload: 'updated' }} mode="browse" />)
    expect(mounts).toBe(1); expect(unmounts).toBe(0)
    expect(container.querySelector('[data-motion-id="continuing"]')).toBe(original)
    expect(original?.textContent).toBe('updated')
    expect(original?.closest('[data-presentation-appear]')).toBeNull()
    rerender(<Stage step={{ ...step, groupKey: 'other' }} mode="browse" />)
    expect(mounts).toBe(2); expect(unmounts).toBe(1)
    rerender(<Stage step={{ ...step, groupKey: 'other', Scene }} mode="browse" />)
    expect(unmounts).toBe(2)
  })
  test('I-7 authored overlap coordinates survive grouped payload updates', () => {
    function Overlap({ payload }: SceneProps<string>) { return <SceneLayer><Box identity="a" style={{ position: 'absolute', left: 20, top: 10 }}>{payload}</Box><Box identity="b" style={{ position: 'absolute', left: 20, top: 10 }}>stack</Box></SceneLayer> }
    const step = { ...makeSteps()[0], Scene: Overlap }
    const { container, rerender } = render(<Stage step={step} mode="browse" />)
    rerender(<Stage step={{ ...step, payload: 'changed' }} mode="browse" />)
    for (const el of container.querySelectorAll<HTMLElement>('[data-presentation-entity]')) { expect(el.style.left).toBe('20px'); expect(el.style.top).toBe('10px') }
  })
  test('I-8 I-9 primitive class style data and layout identity hooks remain author controlled', () => {
    for (const Primitive of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
      const { container, unmount } = render(<Primitive identity="custom" className="owned" data-custom="yes" style={{ position: 'absolute', left: 123, color: 'red' }}>content</Primitive>)
      const el = container.firstElementChild as HTMLElement
      expect(el.className).toBe('owned'); expect(el.dataset.custom).toBe('yes'); expect(el.dataset.presentationEntity).toBe('custom')
      expect(el.style.left).toBe('123px'); expect(el.style.color).toBe('red')
      expect(el.style.background).toBe(''); expect(el.style.border).toBe(''); expect(el.style.fontFamily).toBe('')
      unmount()
    }
  })
  test('I-10 default bottom-right linked attribution and opt-in header brand', () => {
    const { container, rerender } = render(<Presentation steps={makeSteps()} title="Test" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect((link as HTMLElement).style.right).toBe('0px'); expect((link as HTMLElement).style.bottom).toBe('0px')
    expect(container.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    rerender(<Presentation steps={makeSteps()} title="Test" brand={<a href="/host">Host</a>} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
  })
  test('I-11 present mode has title and marker without reading controls', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Test" initialMode="present" />)
    expect(screen.getByText('Title 0')).toBeTruthy(); expect(screen.getByText('01 / first')).toBeTruthy()
    for (const hook of ['caption', 'toc', 'progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    expect(screen.queryByLabelText('Next step')).toBeNull(); expect(screen.queryByLabelText('Previous step')).toBeNull()
  })
  test('I-12 browse mode has caption controls progress and responsive era ToC', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true })
    const { container } = render(<Presentation steps={makeSteps()} title="Test" />)
    expect(screen.getByText('Paragraph 0')).toBeTruthy(); expect(screen.getByLabelText('Next step')).toBeTruthy()
    expect(screen.getByLabelText('Previous step')).toBeTruthy(); expect(container.querySelectorAll('[data-presentation-progress-step]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-presentation-toc-entry]')).toHaveLength(2)
    act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) })
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
  })
  test('I-13 initial mode and toggle P preserve active position in both directions', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'present'))
    expect(result.current.mode).toBe('present')
    act(() => result.current.go(2)); key('p')
    expect(result.current.mode).toBe('browse'); expect(result.current.index).toBe(2)
    act(() => result.current.toggle())
    expect(result.current.mode).toBe('present'); expect(result.current.index).toBe(2)
  })
  test('I-14 all keyboard navigation keys advance exactly once and prevent default', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const value of ['ArrowRight', ' ', 'PageDown']) expect(key(value).defaultPrevented).toBe(true)
    expect(result.current.index).toBe(3)
    for (const value of ['ArrowLeft', 'PageUp']) expect(key(value).defaultPrevented).toBe(true)
    expect(result.current.index).toBe(1)
    expect(key('x').defaultPrevented).toBe(false)
  })
  test('I-15 horizontal swipe directions and ignored vertical or short gestures', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Test" />)
    const main = container.firstElementChild!
    const swipe = (x: number, y: number) => { fireEvent.touchStart(main, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(main, { changedTouches: [{ clientX: x, clientY: y }] }) }
    swipe(0, 100); expect(main.getAttribute('data-step-index')).toBe('1')
    swipe(200, 100); expect(main.getAttribute('data-step-index')).toBe('0')
    swipe(90, 100); swipe(100, 200); expect(main.getAttribute('data-step-index')).toBe('0')
    fireEvent.touchEnd(main, { changedTouches: [{ clientX: 0, clientY: 0 }] }); expect(main.getAttribute('data-step-index')).toBe('0')
  })
  test('I-16 I-17 jumps target exact steps and first era beat with semantic active hooks', () => {
    window.innerWidth = 1440
    const { container } = render(<Presentation steps={makeSteps()} title="Test" />)
    fireEvent.click(screen.getByLabelText('Step 2: Title 1'))
    expect(container.firstElementChild?.getAttribute('data-step-index')).toBe('1')
    expect(screen.getByLabelText('Step 2: Title 1').getAttribute('aria-current')).toBe('step')
    expect(screen.getByLabelText('Step 1: Title 0').hasAttribute('aria-current')).toBe(false)
    fireEvent.click(container.querySelector('[data-presentation-toc-entry="second"]')!)
    expect(container.firstElementChild?.getAttribute('data-step-index')).toBe('2')
    expect(container.querySelector('[data-presentation-toc-entry="second"]')?.getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(container.querySelector('[data-presentation-toc-entry="first"]')!)
    expect(container.firstElementChild?.getAttribute('data-step-index')).toBe('0')
    key('ArrowRight')
    expect(screen.getByLabelText('Step 2: Title 1').getAttribute('data-presentation-active')).toBe('true')
  })
  test('I-18 interactive elements retain key behavior without index or mode changes', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    for (const tag of ['button', 'a', 'input', 'select', 'textarea', 'summary', 'div']) {
      const control = document.createElement(tag)
      if (tag === 'div') control.setAttribute('contenteditable', 'true')
      document.body.append(control)
      for (const value of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) expect(key(value, control).defaultPrevented).toBe(false)
      expect(result.current.index).toBe(0); expect(result.current.mode).toBe('browse')
      control.remove()
    }
  })
  test('I-18 custom focused controls and prevented events keep their keys', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const control = document.createElement('div'); control.setAttribute('role', 'tab'); control.tabIndex = 0; document.body.append(control)
    for (const value of ['ArrowRight', ' ', 'p']) expect(key(value, control).defaultPrevented).toBe(false)
    expect(result.current.index).toBe(0); expect(result.current.mode).toBe('browse'); control.remove()
    const prevented = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }); prevented.preventDefault()
    act(() => window.dispatchEvent(prevented)); expect(result.current.index).toBe(0)
  })
  test('I-19 navigation clamps at ends across repeated actions and touch controls', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => { result.current.prev(); result.current.prev() }); key('ArrowLeft')
    expect(result.current.index).toBe(0)
    act(() => { result.current.go(2); result.current.next(); result.current.next() }); key('ArrowRight')
    expect(result.current.index).toBe(2)
    const { container } = render(<Presentation steps={makeSteps()} title="Test" />)
    const main = container.firstElementChild!
    expect((screen.getByLabelText('Previous step') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.touchStart(main, { touches: [{ clientX: 0, clientY: 0 }] }); fireEvent.touchEnd(main, { changedTouches: [{ clientX: 200, clientY: 0 }] })
    expect(main.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByLabelText('Step 3: Title 2'))
    expect((screen.getByLabelText('Next step') as HTMLButtonElement).disabled).toBe(true)
    fireEvent.touchStart(main, { touches: [{ clientX: 200, clientY: 0 }] }); fireEvent.touchEnd(main, { changedTouches: [{ clientX: 0, clientY: 0 }] })
    expect(main.getAttribute('data-step-index')).toBe('2')
  })
  test('I-20 uniform fit geometry canvas defaults and resize without per-step reflow', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) for (const [w,h] of [[1440,900], [390,844], [1200,400], [0,0]]) {
      const scale = fitScale(w,h,mode)
      expect(scale).toBeGreaterThanOrEqual(0)
      expect(scale * DESIGN_W).toBeLessThanOrEqual(Math.max(0,w-48))
      expect(scale * DESIGN_H).toBeLessThanOrEqual(Math.max(0,h-(mode === 'browse' ? 310 : 160)))
    }
    window.innerWidth = 1440; window.innerHeight = 900
    const { result } = renderHook(() => useFitScale('browse'))
    act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) })
    expect(result.current).toBe(fitScale(390,900,'browse'))
    const { container } = render(<Stage step={makeSteps()[0]} mode="browse" />)
    const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); expect(canvas.style.transform).toBe(`scale(${result.current})`)
  })
})
