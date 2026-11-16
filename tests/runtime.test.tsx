import { useEffect } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { Header } from '../src/presentation-kit/chrome/Header'
import { eras } from '../src/presentation-kit/eras'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_W, DESIGN_H, STAGE_LAYOUT, ENTER_DELAY, LAYOUT_T } from '../src/presentation-kit/constants'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../src/presentation-kit/types'
function Scene({ payload }: SceneProps<string>) { return <div data-testid="payload">{payload}</div> }
const steps: Step<string>[] = ['A', 'B', 'C'].map((title, i) => ({ id: title, era: i < 2 ? 'one' : 'two', title, caption: `Caption ${title}.`, Scene, groupKey: 'g', payload: title }))
const root = () => document.querySelector('[data-presentation]')!
function key(key: string, target: Element | Window = window) { fireEvent.keyDown(target, { key }) }
describe('runtime contracts', () => {
  it('I-12 metadata active diagram and order-derived numbering', () => {
    const { rerender } = render(<Presentation steps={steps} title="test" />)
    expect(screen.getByText('Caption A.')).toBeTruthy()
    expect(screen.getByTestId('payload').textContent).toBe('A')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / one')
    const reordered = [steps[2], steps[0]]
    rerender(<Presentation steps={reordered} title="test" />)
    expect(screen.getByText('Caption C.')).toBeTruthy()
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / two')
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: A' }))
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('02 / one')
    expect(root().getAttribute('data-step-count')).toBe('2')
    expect(root().getAttribute('data-step-index')).toBe('1')
  })
  it('I-14 motion identity exit presence and delayed newcomers', () => {
    const element = Box({ id: 'stable', children: 'label', style: { left: 20, width: 50 } })
    expect(element.props.layoutId).toBe('stable')
    expect(element.props.layout).toBe(true)
    expect(element.props.transition.layout.duration).toBe(LAYOUT_T)
    expect(Appear({ children: 'new' }).props.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_DELAY).toBe(LAYOUT_T)
    expect(Appear({}).props.exit).toEqual({ opacity: 0 })
    expect(Appear({}).props.initial).toEqual({ opacity: 0 })
  })
  it('I-15 grouped scene persists and different Scene or group remounts', async () => {
    let mounts = 0, unmounts = 0
    function Stateful({ payload }: SceneProps<string>) { useEffect(() => { mounts++; return () => { unmounts++ } }, []); return <p>{payload}</p> }
    const first = { ...steps[0], Scene: Stateful }
    const { rerender, unmount } = render(<Stage step={first} mode="browse" />)
    rerender(<Stage step={{ ...first, id: 'B', payload: 'changed' }} mode="browse" />)
    expect(mounts).toBe(1); expect(unmounts).toBe(0)
    expect(screen.getByText('changed')).toBeTruthy()
    rerender(<Stage step={{ ...first, groupKey: 'other' }} mode="browse" />)
    expect(mounts).toBe(2) // Same Scene, changed group: a distinct instance must mount.
    const groupedHost = [...document.querySelectorAll('[data-presentation-scene]')].at(-1)
    rerender(<Stage step={{ ...first, groupKey: 'other', Scene }} mode="browse" />)
    expect([...document.querySelectorAll('[data-presentation-scene]')].at(-1)).not.toBe(groupedHost) // Changed Scene gets a presence host so the old scene can exit.
    unmount()
    expect(unmounts).toBe(2)
  })
  it('I-16 I-17 primitives forward styling identity and data without visual defaults', () => {
    const el = Box({ id: 'id', className: 'mine', style: { left: 12, position: 'absolute' }, 'data-testid': 'custom' } as Parameters<typeof Box>[0])
    expect(el.props.style).toEqual({ left: 12, position: 'absolute' })
    expect(el.props.className).toBe('mine')
    expect(el.props['data-testid']).toBe('custom')
    expect(Box({ id: 'bare' }).props.style).toBeUndefined()
    expect(Label({ id: 'label' }).props['data-presentation-node']).toBe('label')
    expect(SceneLayer({ style: { zIndex: 5 } }).props.style).toEqual({ position: 'absolute', inset: 0, zIndex: 5 })
  })
  it('I-18 attribution default hook geometry and opt-in brand', () => {
    const { rerender } = render(<Presentation steps={steps} title="test" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.parentElement?.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.parentElement?.style.right).toBe('18px')
    expect(link.parentElement?.style.bottom).toBe('12px')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation steps={steps} title="test" brand={<a href="/">Host</a>} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
    rerender(<Presentation steps={steps} title="test" attribution={null} />)
    expect(screen.queryByRole('link', { name: 'made by and-scene' })).toBeNull()
  })
  it('I-19 chrome varies with mode and viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    const { unmount } = render(<Presentation steps={steps} title="test" />)
    expect(screen.getByText('Caption A.')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeTruthy()
    key('p')
    expect(screen.queryByText('Caption A.')).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByText('Next →')).toBeNull()
    expect(screen.getByRole('heading', { name: 'A' })).toBeTruthy()
    unmount()
    window.innerWidth = 390
    render(<Presentation steps={steps} title="test" initialMode="present" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    key('p')
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    expect(screen.getByText('Caption A.')).toBeTruthy()
  })
  it('I-20 mode changes retain middle step and change geometry without remount', () => {
    const mounted = vi.fn()
    function Persistent() { useEffect(mounted, []); return null }
    render(<Presentation steps={steps.map(s => ({ ...s, Scene: Persistent }))} title="test" />)
    key('ArrowRight'); key('p')
    expect(root().getAttribute('data-step-index')).toBe('1')
    expect(document.querySelector<HTMLElement>('[data-presentation-stage]')?.style.top).toBe(`${STAGE_LAYOUT.present.top}px`)
    key('p')
    expect(root().getAttribute('data-step-index')).toBe('1')
    expect(mounted).toHaveBeenCalledTimes(1)
  })
  it('I-21 keyboard mappings and focused controls retain their keys', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const k of ['ArrowRight', ' ', 'PageDown']) act(() => key(k))
    expect(result.current.index).toBe(3)
    for (const k of ['ArrowLeft', 'PageUp']) act(() => key(k))
    expect(result.current.index).toBe(1)
    for (const tag of ['button', 'summary', 'a', 'area', 'input', 'textarea', 'select', 'audio', 'video', 'div']) {
      const el = document.createElement(tag)
      if (tag === 'audio' || tag === 'video') el.setAttribute('controls', '')
      if (tag === 'div') el.setAttribute('contenteditable', 'true')
      document.body.append(el)
      for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) act(() => key(k, el))
      expect(result.current.index).toBe(1); expect(result.current.mode).toBe('browse')
      el.remove()
    }
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true }))
    expect(result.current.index).toBe(1)
  })
  it('I-21 summary descendants retain native Space default behavior', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    const details = document.createElement('details')
    details.innerHTML = '<summary><span>Disclosure</span></summary><p>Details</p>'
    document.body.append(details)
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    details.querySelector('span')!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(result.current.index).toBe(0)
    details.remove()
    act(() => key(' '))
    expect(result.current.index).toBe(1)
  })
  it('I-22 touch left right taps vertical gestures and cancellation', () => {
    render(<Presentation steps={steps} title="test" />)
    function swipe(x: number, y: number) {
      fireEvent.touchStart(root(), { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchEnd(root(), { changedTouches: [{ clientX: x, clientY: y }] })
    }
    swipe(20, 110); expect(root().getAttribute('data-step-index')).toBe('1')
    swipe(180, 110); expect(root().getAttribute('data-step-index')).toBe('0')
    swipe(90, 110); swipe(20, 400)
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.touchStart(root(), { touches: [{ clientX: 100, clientY: 100 }] })
    fireEvent.touchCancel(root()); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 0, clientY: 100 }] })
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
  it('I-23 era jumps and progress semantic current state', () => {
    window.innerWidth = 1200
    expect(eras(steps)).toEqual([{ era: 'one', index: 0 }, { era: 'two', index: 2 }])
    render(<Presentation steps={steps} title="test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: B' }))
    expect(screen.getByRole('button', { name: 'Step 2: B' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'one' }).getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'two' }))
    expect(root().getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'one' }))
    expect(root().getAttribute('data-step-index')).toBe('0')
    expect(screen.getByRole('button', { name: 'two' }).getAttribute('aria-current')).toBeNull()
  })
  it('I-24 clamp repeated boundaries and a single step', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0)
    act(() => result.current.jump(999)); expect(result.current.index).toBe(2)
    act(() => { result.current.next(); result.current.next() }); expect(result.current.index).toBe(2)
    act(() => result.current.jump(-4)); expect(result.current.index).toBe(0)
    const single = renderHook(() => usePresentationNav(1))
    act(() => { single.result.current.next(); single.result.current.prev() }); expect(single.result.current.index).toBe(0)
  })
  it('I-25 fixed uniform fit dimensions resize and mode geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) for (const [w,h] of [[1440,900], [390,844], [800,360], [20,20]]) {
      const scale = fitScale(w, h, mode)
      expect(scale).toBeGreaterThanOrEqual(0)
      expect(scale * DESIGN_W).toBeLessThanOrEqual(Math.max(0, w - STAGE_LAYOUT[mode].side * 2) + 1e-9)
      expect(scale * DESIGN_H).toBeLessThanOrEqual(Math.max(0, h - STAGE_LAYOUT[mode].top - STAGE_LAYOUT[mode].bottom) + 1e-9)
    }
    const { rerender } = render(<Stage step={steps[0]} mode="browse" />)
    const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    const transform = canvas.style.transform
    rerender(<Stage step={steps[1]} mode="browse" />); expect(canvas.style.transform).toBe(transform)
    act(() => { window.innerWidth = 390; fireEvent(window, new Event('resize')) })
    expect(canvas.style.transform).not.toBe(transform)
  })
  it('header accepts explicit host branding', () => {
    render(<Header step={steps[0]} index={0} mode="browse" toggleMode={() => {}} brand="Example host" />)
    expect(screen.getByText('Example host')).toBeTruthy()
  })
})
