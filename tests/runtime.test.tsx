import { useEffect, useId } from 'react'
import { AnimatePresence, useIsPresent } from 'motion/react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, renderHook, screen, act } from '@testing-library/react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { usePresentationNav, clamp } from '../src/presentation-kit/usePresentationNav'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { Node } from '../src/presentation-kit/nodes/primitives'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function Scene({ payload }: SceneProps<number>) { return <Box entityId="test:topic" style={{ left: payload * 10 }}><span>diagram {payload}</span></Box> }
const steps: Step<number>[] = [1, 2, 3].map((payload, i) => ({ id: `s${i}`, era: i < 2 ? 'start' : 'end', title: `Title ${i}`, caption: `Caption paragraph ${i}.`, Scene, payload, groupKey: 'same' }))
function host() { return document.querySelector('[data-presentation]')! }
describe('scene contracts', () => {
  it('I-1 active state supplies scene and narration', () => {
    render(<Presentation steps={steps} title="Example" />)
    expect(screen.getByText('diagram 1')).toBeTruthy(); expect(screen.getByText('Title 0')).toBeTruthy(); expect(screen.getByText('Caption paragraph 0.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('diagram 2')).toBeTruthy(); expect(screen.getByText('Title 1')).toBeTruthy()
  })
  it('I-2 numbering follows inserted removed reordered arrays', () => {
    for (const list of [[{ ...steps[2], id: 'inserted' }, ...steps], steps.slice(1), [...steps].reverse()]) {
      const view = render(<Presentation steps={list} title="Order" />)
      expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe(`01 / ${list[0].era}`)
      const controls = document.querySelectorAll('[data-presentation-progress-step]')
      expect([...controls].map(c => c.textContent)).toEqual(list.map((_, i) => String(i + 1)))
      view.unmount()
    }
  })
  it('I-4 stable identity and layout motion forward authored state', () => {
    const a = Node({ entityId: 'stable', style: { left: 1, width: 20 }, children: 'before' })
    const b = Node({ entityId: 'stable', style: { left: 50, width: 40 }, className: 'emphasized', children: 'after' })
    expect(a.props.layoutId).toBe(b.props.layoutId); expect(a.props.layout).toBe(true)
    expect(b.props.style).toEqual({ left: 50, width: 40 }); expect(b.props.children).toContain('after')
    expect(b.props.transition.layout.duration).toBe(LAYOUT_T)
  })
  it('I-5 newcomer delay and exit lifecycle contract', () => {
    const entry = Appear({ children: 'new' })
    expect(entry.props.initial).toEqual({ opacity: 0 }); expect(entry.props.animate).toEqual({ opacity: 1 }); expect(entry.props.exit).toEqual({ opacity: 0 })
    expect(entry.props.transition).toEqual({ duration: ENTER_T, delay: ENTER_DELAY }); expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    const stage = render(<Stage step={steps[0]} mode="browse" />)
    stage.rerender(<Stage step={{ ...steps[1], groupKey: 'other' }} mode="browse" />)
    expect(document.querySelectorAll('[data-presentation-scene]').length).toBe(2) // departing scene retained for exit
  })
  it('I-5 departing entity remains mounted during its exit', () => {
    function Entity() { const present = useIsPresent(); return <Box entityId="departing">{present ? 'present' : 'exiting'}</Box> }
    function Changing({ payload }: SceneProps<boolean>) { return <SceneLayer><AnimatePresence>{payload && <Appear key="entity"><Entity /></Appear>}</AnimatePresence></SceneLayer> }
    const open: Step<boolean> = { ...steps[0], Scene: Changing, payload: true }
    const view = render(<Stage step={open} mode="browse" />)
    expect(screen.getByText('present')).toBeTruthy()
    view.rerender(<Stage step={{ ...open, payload: false }} mode="browse" />)
    expect(screen.getByText('exiting').closest('[data-presentation-entity]')).toBeTruthy()
  })
  it('I-6 grouped scenes retain instance and continuing entities', () => {
    const mounted = vi.fn(); const unmounted = vi.fn()
    function Persistent({ payload }: SceneProps<number>) {
      const identity = useId()
      useEffect(() => { mounted(); return () => { unmounted() } }, [])
      return <Box entityId="persistent"><span data-instance={identity}>{payload}</span></Box>
    }
    const view = render(<Stage step={{ ...steps[0], Scene: Persistent }} mode="browse" />)
    const entity = document.querySelector('[data-presentation-entity]'); const instance = document.querySelector('[data-instance]')?.getAttribute('data-instance')
    view.rerender(<Stage step={{ ...steps[1], Scene: Persistent }} mode="browse" />)
    expect(mounted).toHaveBeenCalledTimes(1); expect(unmounted).not.toHaveBeenCalled()
    expect(document.querySelector('[data-presentation-entity]')).toBe(entity)
    expect(document.querySelector('[data-instance]')?.getAttribute('data-instance')).toBe(instance)
    expect(entity?.textContent).toBe('2'); expect(entity?.closest('[data-presentation-appear]')).toBeNull()
    function Different() { return <span>different</span> }
    view.rerender(<Stage step={{ ...steps[1], Scene: Different }} mode="browse" />)
    expect(unmounted).toHaveBeenCalledTimes(1)
  })
  it('I-7 overlapping layers preserve authored geometry and stacking', () => {
    const layer = SceneLayer({ style: { zIndex: 7 }, children: <Box entityId="overlap" style={{ position: 'absolute', left: 30, top: 20 }} /> })
    expect(layer.props.style).toEqual({ position: 'absolute', inset: 0, zIndex: 7 })
    const view = render(layer); expect(document.querySelector('[data-presentation-entity]')?.getAttribute('style')).toContain('left: 30px')
    view.rerender(SceneLayer({ style: { zIndex: 7 }, children: <Box entityId="overlap" style={{ position: 'absolute', left: 30, top: 20 }}>updated</Box> }))
    expect(document.querySelector('[data-presentation-entity]')?.getAttribute('style')).toContain('top: 20px')
  })
  it('I-8 primitives forward hooks without visual fallback', () => {
    for (const Primitive of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
      const view = render(<Primitive entityId="hook" className="author" data-author="yes" style={{ left: 21 }}>Label</Primitive>)
      const element = document.querySelector('[data-presentation-entity]')!
      expect(element.className).toBe('author'); expect(element.getAttribute('data-author')).toBe('yes'); expect(element.getAttribute('style')).toBe('left: 21px;')
      expect(element.getAttribute('data-presentation-node')).toBeTruthy(); view.unmount()
    }
  })
  it('I-9 attribution defaults and branding opt-in', () => {
    const view = render(<Presentation steps={steps} title="Example" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.style.right).toBe('0px'); expect(link.style.bottom).toBe('0px'); expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    view.rerender(<Presentation steps={steps} title="Example" brand={<a href="/">Host</a>} />)
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('Host')
  })
  it('I-10 present chrome hides reading controls', () => {
    render(<Presentation steps={steps} title="Example" initialMode="present" />)
    expect(screen.getByText('Title 0')).toBeTruthy(); expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
  it('I-11 browse chrome and responsive ToC rules', () => {
    render(<Presentation steps={steps} title="Example" />)
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
    expect(document.querySelectorAll('[data-presentation-toc-entry]').length).toBe(2)
    expect(host().querySelector('style')?.textContent).toContain('@media(max-width: 1100px)')
  })
  it('I-12 initial modes and toggle preserve index', () => {
    render(<Presentation steps={steps} title="Example" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' }); fireEvent.keyDown(window, { key: 'p' })
    expect(host().getAttribute('data-step-index')).toBe('1'); expect(host().getAttribute('data-presentation-mode')).toBe('present')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' })); expect(host().getAttribute('data-step-index')).toBe('1')
  })
  it('I-15 direct progress and era jumps', () => {
    render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Title 1' })); expect(host().getAttribute('data-step-index')).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'end', exact: true, hidden: true })); expect(host().getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'start', exact: true, hidden: true })); expect(host().getAttribute('data-step-index')).toBe('0')
  })
  it('I-16 active semantics track navigation', () => {
    render(<Presentation steps={steps} title="Example" />)
    fireEvent.keyDown(window, { key: 'PageDown' })
    const current = document.querySelector('[data-presentation-progress-step][data-presentation-active="true"]')!
    expect(current.getAttribute('aria-current')).toBe('step'); expect(current.textContent).toBe('2')
    expect(document.querySelector('[data-presentation-toc-entry][aria-current="step"]')?.textContent).toBe('start')
    fireEvent.keyDown(window, { key: 'PageDown' }); expect(document.querySelector('[data-presentation-toc-entry][aria-current="step"]')?.textContent).toBe('end')
  })
  it('rejects an empty presentation', () => { expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step') })
})
describe('navigation', () => {
  it('I-13 every keyboard command changes once', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const key of ['ArrowRight', ' ', 'PageDown']) { const before = result.current.index; act(() => fireEvent.keyDown(window, { key })); expect(result.current.index).toBe(before + 1) }
    for (const key of ['ArrowLeft', 'PageUp']) { const before = result.current.index; act(() => fireEvent.keyDown(window, { key })); expect(result.current.index).toBe(before - 1) }
    act(() => fireEvent.keyDown(window, { key: 'P' })); expect(result.current.mode).toBe('present')
  })
  it('I-14 swipes left right vertical and cancellation', () => {
    render(<Presentation steps={steps} title="Swipe" />)
    const swipe = (x: number, y: number) => { fireEvent.touchStart(host(), { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(host(), { changedTouches: [{ clientX: x, clientY: y }] }) }
    swipe(20, 110); expect(host().getAttribute('data-step-index')).toBe('1'); swipe(180, 105); expect(host().getAttribute('data-step-index')).toBe('0')
    swipe(20, 300); expect(host().getAttribute('data-step-index')).toBe('0')
    fireEvent.touchStart(host(), { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchCancel(host()); fireEvent.touchEnd(host(), { changedTouches: [{ clientX: 0, clientY: 100 }] }); expect(host().getAttribute('data-step-index')).toBe('0')
  })
  it('I-17 interactive controls keep keys', () => {
    render(<Presentation steps={steps} title="Keys" />)
    for (const tag of ['button', 'a', 'input', 'textarea', 'select', 'div']) {
      const control = document.createElement(tag); if (tag === 'a') control.setAttribute('href', '#'); if (tag === 'div') control.setAttribute('contenteditable', 'true')
      host().append(control)
      for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) fireEvent.keyDown(control, { key })
      expect(host().getAttribute('data-step-index')).toBe('0'); expect(host().getAttribute('data-presentation-mode')).toBe('browse'); control.remove()
    }
  })
  it('I-18 boundaries clamp across control keyboard and swipe paths', () => {
    expect(clamp(-100, 3)).toBe(0); expect(clamp(100, 3)).toBe(2)
    render(<Presentation steps={steps} title="Bounds" />)
    for (let i = 0; i < 3; i++) fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(host().getAttribute('data-step-index')).toBe('0'); expect(screen.getByRole('button', { name: 'Previous' }).hasAttribute('disabled')).toBe(true)
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.touchStart(host(), { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(host(), { changedTouches: [{ clientX: 0, clientY: 100 }] })
    expect(host().getAttribute('data-step-index')).toBe('2'); expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(true)
  })
  it('I-19 uniform fit geometry responds to viewport and mode not step', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const [w, h] of [[1440, 900], [390, 500], [100, 10]]) for (const mode of ['browse', 'present'] as const) {
      const scale = fitScale(w, h, mode); expect(scale).toBeGreaterThanOrEqual(0); expect(scale * 880).toBeLessThanOrEqual(w); expect(scale * 380).toBeLessThanOrEqual(h)
    }
    expect(fitScale(390, 500, 'browse')).not.toBe(fitScale(390, 500, 'present'))
    let resize = () => {}
    const OriginalObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) { resize = () => callback([], this) }
      observe() {} unobserve() {} disconnect() {}
    }
    const view = render(<Stage step={steps[0]} mode="browse" />); const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    const transform = canvas.style.transform; view.rerender(<Stage step={steps[1]} mode="browse" />)
    expect(canvas.style.transform).toBe(transform); expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390)
    act(() => resize()); expect(canvas.style.transform).not.toBe(transform)
    width.mockRestore(); globalThis.ResizeObserver = OriginalObserver
  })
})
