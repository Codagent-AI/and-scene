import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { createElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
const calls = vi.hoisted(() => [] as Record<string, unknown>[])
vi.mock('motion/react', async () => {
  const React = await import('react')
  const node = (tag: string) => React.forwardRef((props: Record<string, unknown>, ref) => {
    calls.push(props)
    const { layout: _layout, layoutId: _layoutId, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...dom } = props
    void [_layout, _layoutId, _initial, _animate, _exit, _transition]
    return React.createElement(tag, { ...dom, ref })
  })
  return { motion: { div: node('div'), svg: node('svg') }, LayoutGroup: ({ children }: { children: ReactNode }) => children, AnimatePresence: ({ children }: { children: ReactNode }) => children }
})
import { Presentation } from '../src/presentation-kit/Presentation'
import { Box, Label, Frame, Emphasis, SymbolChip, Arrow, Appear, SceneLayer, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { fitGeometry, useFitScale } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'

function Diagram({ payload }: SceneProps<{ label: string }>) { return <Box id="stable" style={{ left: payload.label === 'one' ? 10 : 30 }}>{payload.label}</Box> }
const steps: Step<{ label: string }>[] = ['one','two','three'].map((label, i) => ({ id: label, era: i < 2 ? 'start' : 'finish', title: `Title ${label}`, caption: `Caption ${label}`, Scene: Diagram, payload: { label }, groupKey: 'same' }))
function press(key: string, target: Element | Window = window) { fireEvent.keyDown(target, { key }) }
function show() { return render(<Presentation steps={steps} title="Document" />) }
function index(container: HTMLElement) { return container.querySelector('[data-presentation]')?.getAttribute('data-step-index') }

describe('step contracts and identity', () => {
  it('I-1 active scene and narration follow selected step', () => {
    show(); expect(screen.getByRole('heading').textContent).toBe('Title one'); expect(screen.getByText('Caption one')).toBeTruthy()
    press('ArrowRight'); expect(screen.getByRole('heading').textContent).toBe('Title two'); expect(screen.getByText('Caption two')).toBeTruthy(); expect(screen.getByText('two')).toBeTruthy()
    for (const step of steps) for (const field of ['id','era','title','caption','Scene','payload'] as const) expect(step[field]).toBeTruthy()
  })
  it('I-2 numbering derives from reordered inserted and removed array positions', () => {
    const { rerender, container } = render(<Presentation steps={[steps[2], steps[0]]} title="D" />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / finish')
    expect(screen.getByRole('button', { name: 'Step 2: Title one' })).toBeTruthy()
    rerender(<Presentation steps={[steps[1], steps[2], steps[0]]} title="D" />)
    expect(screen.getByRole('button', { name: 'Step 3: Title one' })).toBeTruthy()
    press('ArrowRight'); expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('02 / finish')
  })
  it('I-4 continuing identity updates layout size label and emphasis without remount', () => {
    function Morph({ payload }: SceneProps<{ n: number }>) { return <Box id="entity" className={payload.n ? 'emphasized' : ''} style={{ left: payload.n * 20, width: 100 + payload.n }}>{payload.n}</Box> }
    const data = [0,1].map(n => ({ ...steps[0], id: String(n), Scene: Morph, payload: { n } }))
    const { container } = render(<Presentation steps={data} title="D" />)
    const entity = container.querySelector('[data-entity-id="entity"]')
    press('ArrowRight')
    expect(container.querySelector('[data-entity-id="entity"]')).toBe(entity)
    expect(entity?.textContent).toBe('1'); expect(entity?.getAttribute('class')).toBe('emphasized')
    expect(entity?.getAttribute('style')).toContain('width: 101px')
    const props = calls.find(p => p.layoutId === 'entity')!
    expect(props.layout).toBe(true); expect(props.transition).toEqual({ layout: LAYOUT_T, opacity: ENTER_T })
  })
  it('I-5 entry delay follows layout duration and exits are configured', () => {
    render(<><Box id="new" /><Appear>newcomer</Appear><Arrow id="arrow" d="M0 0 L10 10" /></>)
    expect(ENTER_DELAY).toBeGreaterThan(LAYOUT_T.duration)
    for (const id of ['new','arrow']) {
      const p = calls.find(p => p.layoutId === id)!
      expect(p.initial).toEqual({ opacity: 0 }); expect(p.animate).toEqual({ opacity: 1 }); expect(p.exit).toEqual({ opacity: 0 })
    }
    expect(calls.find(p => p['data-presentation-appear'] === '')?.transition).toEqual(ENTER_T)
  })
  it('I-6 grouped scenes preserve instance state; changed group or Scene remounts', () => {
    const mounts = vi.fn(), unmounts = vi.fn()
    function Persistent({ payload }: SceneProps<{ label: string }>) {
      const [state] = useState('retained')
      useEffect(() => { mounts(); return () => { unmounts() } }, [])
      return <p>{state}:{payload.label}</p>
    }
    const data = steps.map(s => ({ ...s, Scene: Persistent }))
    const { rerender } = render(<Presentation steps={data} title="D" />)
    press('ArrowRight'); expect(mounts).toHaveBeenCalledTimes(1); expect(unmounts).not.toHaveBeenCalled(); expect(screen.getByText('retained:two')).toBeTruthy()
    rerender(<Presentation steps={data.map(s => ({ ...s, groupKey: 'other' }))} title="D" />)
    expect(mounts).toHaveBeenCalledTimes(2); expect(unmounts).toHaveBeenCalledTimes(1)
    rerender(<Presentation steps={steps} title="D" />); expect(unmounts).toHaveBeenCalledTimes(2)
  })
  it('I-7 continuing grouped nodes keep their DOM and authored overlap coordinates', () => {
    function Stacked({ payload }: SceneProps<{ label: string }>) { return <SceneLayer><Box id="a" style={{ left: 20, top: 20 }}>{payload.label}</Box><Box id="b" style={{ left: 20, top: 20 }}>stack</Box></SceneLayer> }
    const { container } = render(<Presentation steps={steps.map(s => ({ ...s, Scene: Stacked }))} title="D" />)
    const a = container.querySelector('[data-entity-id="a"]'); press('ArrowRight')
    expect(container.querySelector('[data-entity-id="a"]')).toBe(a)
    expect(a?.closest('[data-presentation-appear]')).toBeNull()
    expect(a?.getAttribute('style')).toBe('left: 20px; top: 20px;')
    expect(container.querySelector('[data-entity-id="b"]')?.getAttribute('style')).toBe(a?.getAttribute('style'))
  })
  it('I-8 primitives forward styling hooks and provide no visual defaults', () => {
    const components = [Box, Label, Frame, Emphasis, SymbolChip]
    const { container } = render(<>{components.map((Node, i) => <Node key={i} id={`n${i}`} className="owned" data-custom="yes" style={{ left: 42 }}>text</Node>)}<Arrow id="a" d="M0 0 L1 1" className="raw-arrow" style={{ top: 3 }} /></>)
    for (const el of container.querySelectorAll('.owned')) { expect(el.getAttribute('style')).toBe('left: 42px;'); expect(el.getAttribute('data-custom')).toBe('yes'); expect(el.hasAttribute('data-presentation-node')).toBe(true) }
    expect(container.querySelectorAll('.owned').length).toBe(5)
    render(<Box id="unstyled">bare</Box>); expect(screen.getByText('bare').getAttribute('style')).toBeNull()
  })
})
describe('chrome and navigation', () => {
  it('I-9 default attribution and opt-in branding', () => {
    const { container, rerender } = show()
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene'); expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.getAttribute('style')).toContain('bottom: 16px'); expect(link.getAttribute('style')).toContain('right: 24px')
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation steps={steps} title="D" brand={<a href="/">Host</a>} />); expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
  })
  it('I-10 present mode is title-focused', () => {
    const { container } = render(<Presentation steps={steps} title="D" initialMode="present" />)
    expect(screen.getByRole('heading').textContent).toBe('Title one'); expect(container.querySelector('[data-presentation-marker]')).toBeTruthy()
    for (const hook of ['caption','toc','prev','next','progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
  it('I-11 browse mode has caption navigation progress and wide-only eras', () => {
    act(() => { window.innerWidth = 1440 }); const { container } = show()
    expect(screen.getByText('Caption one')).toBeTruthy(); expect(screen.getByRole('button', { name: 'Previous step' })).toBeTruthy(); expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy()
    expect(container.querySelectorAll('[data-presentation-progress-step]').length).toBe(3); expect(container.querySelectorAll('[data-presentation-toc-entry]').length).toBe(2)
    act(() => { window.innerWidth = 390; fireEvent.resize(window) }); expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    window.innerWidth = 1440
  })
  it('I-12 initial mode toggle and P preserve middle step', () => {
    const { container } = show(); press('ArrowRight'); press('p')
    expect(index(container)).toBe('1'); expect(container.querySelector('[data-presentation]')?.getAttribute('data-presentation-mode')).toBe('present')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' })); expect(index(container)).toBe('1'); expect(screen.getByText('Caption two')).toBeTruthy()
  })
  it.each(['ArrowRight',' ','PageDown'])('I-13 keyboard next %s advances once', key => { const { result } = renderHook(() => usePresentationNav(3)); act(() => press(key)); expect(result.current.index).toBe(1) })
  it.each(['ArrowLeft','PageUp'])('I-13 keyboard previous %s retreats once', key => { const { result } = renderHook(() => usePresentationNav(3)); act(() => result.current.jump(2)); act(() => press(key)); expect(result.current.index).toBe(1) })
  it('I-14 horizontal swipes navigate and vertical small cancelled or multi-touch gestures do not', () => {
    const { container } = show(); const main = container.firstElementChild!
    const swipe = (dx: number, dy = 0) => { fireEvent.touchStart(main, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(main, { changedTouches: [{ clientX: 100 + dx, clientY: 100 + dy }] }) }
    swipe(-70); expect(index(container)).toBe('1'); swipe(70); expect(index(container)).toBe('0')
    swipe(-10); swipe(-70,150); expect(index(container)).toBe('0')
    fireEvent.touchStart(main, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchCancel(main); fireEvent.touchEnd(main, { changedTouches: [{ clientX: 0, clientY: 100 }] }); expect(index(container)).toBe('0')
    fireEvent.touchStart(main, { touches: [{ clientX: 100, clientY: 100 }, { clientX: 90, clientY: 100 }] }); fireEvent.touchEnd(main, { changedTouches: [{ clientX: 0, clientY: 100 }] }); expect(index(container)).toBe('0')
  })
  it('I-15 buttons progress and era jumps reach correct targets', () => {
    window.innerWidth = 1440; const { container } = show()
    fireEvent.click(screen.getByRole('button', { name: 'Next step' })); expect(index(container)).toBe('1')
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' })); expect(index(container)).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title three' })); expect(index(container)).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'start' })); expect(index(container)).toBe('0')
    fireEvent.click(screen.getByRole('button', { name: 'finish' })); expect(index(container)).toBe('2')
  })
  it('I-16 semantic current state and stable active hooks track step and era', () => {
    window.innerWidth = 1440; const { container } = show()
    const active = () => [...container.querySelectorAll('[aria-current="step"]')].map(e => e.textContent)
    expect(active()).toEqual(['start','1']); press('ArrowRight'); expect(active()).toEqual(['start','2']); press('ArrowRight'); expect(active()).toEqual(['finish','3'])
    for (const element of container.querySelectorAll('[aria-current="step"]')) expect(element.getAttribute('data-presentation-active')).toBe('true')
  })
  it.each(['button','a','input','textarea','select','editable','slider'])('I-17 focused %s retains keys', tag => {
    const { container } = show()
    const element = tag === 'editable' ? <div contentEditable>edit</div> : tag === 'slider' ? <div role="slider" tabIndex={0}>slider</div> : createElement(tag, { href: tag === 'a' ? '/' : undefined })
    const input = render(element).container.firstElementChild!
    for (const key of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','P']) { const allowed = fireEvent.keyDown(input, { key }); expect(allowed).toBe(true) }
    expect(index(container)).toBe('0')
  })
  it('I-18 navigation clamps at both ends and jump clamps out-of-range values', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev()); expect(result.current.index).toBe(0)
    act(() => result.current.jump(200)); expect(result.current.index).toBe(2)
    act(() => result.current.next()); expect(result.current.index).toBe(2)
    act(() => result.current.jump(-50)); expect(result.current.index).toBe(0)
    unmount()
    const { container } = show(); expect(screen.getByRole('button', { name: 'Previous step' }).hasAttribute('disabled')).toBe(true)
    press('PageDown'); press('PageDown'); press('PageDown'); expect(index(container)).toBe('2'); expect(screen.getByRole('button', { name: 'Next step' }).hasAttribute('disabled')).toBe(true)
  })
})
it('I-19 fit is uniform per mode viewport and dimensions and constant between steps', () => {
  for (const mode of ['browse','present'] as const) for (const [w,h] of [[1440,900],[390,844],[1200,480]]) {
    const fit = fitGeometry(w,h,mode)
    expect(fit.scale * 880).toBeLessThanOrEqual(fit.width); expect(fit.scale * 380).toBeLessThanOrEqual(fit.height)
    expect(fit.scale).toBeGreaterThan(0)
  }
  window.innerWidth = 1440; window.innerHeight = 900
  const { container } = show(); const canvas = container.querySelector('[data-presentation-canvas]')!
  expect(canvas.getAttribute('style')).toContain('width: 880px'); expect(canvas.getAttribute('style')).toContain('height: 380px')
  const scale = canvas.getAttribute('data-scale'); press('ArrowRight'); expect(canvas.getAttribute('data-scale')).toBe(scale)
  act(() => { window.innerWidth = 390; fireEvent.resize(window) }); expect(Number(canvas.getAttribute('data-scale'))).toBeLessThan(Number(scale))
  const { result, rerender } = renderHook(({ mode }) => useFitScale(mode), { initialProps: { mode: 'browse' as 'browse' | 'present' } })
  const browse = result.current.height; rerender({ mode: 'present' }); expect(result.current.height).toBeGreaterThan(browse)
})
