import { motion } from 'motion/react'
import { createElement, useEffect } from 'react'
import type { ReactNode } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const observations = vi.hoisted(() => ({ nodes: [] as Record<string, unknown>[] }))
vi.mock('motion/react', () => ({
  motion: { div: ({ children, layoutId, layout, initial, animate, exit, transition, ...props }: Record<string, unknown> & { children: ReactNode }) => {
    observations.nodes.push({ layoutId, layout, initial, animate, exit, transition, ...props })
    return createElement('div', { ...props, 'data-layout-id': layoutId }, children)
  } },
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  LayoutGroup: ({ children }: { children: ReactNode }) => children,
}))
import { Presentation, Box, Label, Frame, Emphasis, SymbolChip, Arrow, Appear, SceneLayer, LAYOUT_T, ENTER_T, DESIGN_W, DESIGN_H } from '../../src/presentation-kit'
import type { SceneProps, Step } from '../../src/presentation-kit'
import { Stage } from '../../src/presentation-kit/Stage'
import { fitScale, useFitScale } from '../../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { eras } from '../../src/presentation-kit/chrome/eras'
function Scene({ payload }: SceneProps<number>) { return <Box id="test:box" style={{ position: 'absolute', left: payload * 10 }}>state {payload}</Box> }
const steps: Step<number>[] = Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, era: i < 2 ? 'ask' : 'build', title: `Title ${i}`, caption: `Caption ${i}`, Scene, groupKey: 'same', payload: i }))
beforeEach(() => { observations.nodes = []; Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true }); Object.defineProperty(window, 'innerHeight', { value: 900, writable: true }) })
const key = (value: string, target: EventTarget = window) => fireEvent(target, new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))
const swipe = (el: Element, dx: number, dy = 0) => { fireEvent.touchStart(el, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(el, { changedTouches: [{ clientX: 100 + dx, clientY: 100 + dy }] }) }
const host = () => document.querySelector('[data-presentation]')!
describe('scene and chrome contracts', () => {
  it('I-1 derives metadata and numbering from inserted removed reordered steps', () => {
    const { rerender } = render(<Presentation steps={steps} title="test" />)
    expect(screen.getByText('01 / ask')).toBeTruthy(); expect(screen.getByText('Title 0')).toBeTruthy(); expect(screen.getByText('Caption 0')).toBeTruthy(); expect(screen.getByText('state 0')).toBeTruthy()
    const variants = [[{ ...steps[2], id: 'inserted' }, ...steps], [steps[3], steps[0]], [...steps].reverse()]
    for (const variant of variants) { rerender(<Presentation steps={variant} title="test" />); expect(screen.getByText(`01 / ${variant[0].era}`)).toBeTruthy(); expect(screen.getByText(variant[0].title)).toBeTruthy() }
    fireEvent.click(screen.getByText('Next')); expect(screen.getByText(`02 / ${variants[2][1].era}`)).toBeTruthy()
  })
  it('I-3 passes stable identity layout and delayed entry plus exit motion to actual primitive adapter', () => {
    const { rerender } = render(<Box id="persistent" style={{ left: 10, width: 40 }}>old</Box>)
    const el = document.querySelector('[data-layout-id="persistent"]')
    const config = observations.nodes.at(-1)!
    expect(config.layout).toBe(true); expect(config.layoutId).toBe('persistent'); expect(config.initial).toEqual({ opacity: 0 }); expect(config.exit).toEqual({ opacity: 0 }); expect(config.transition).toEqual({ layout: LAYOUT_T, opacity: ENTER_T }); expect(ENTER_T.delay).toBeGreaterThanOrEqual(LAYOUT_T.duration)
    rerender(<Box id="persistent" style={{ left: 80, width: 100 }} className="emphasis">new</Box>)
    expect(document.querySelector('[data-layout-id="persistent"]')).toBe(el); expect(el?.textContent).toBe('new'); expect((el as HTMLElement).style.left).toBe('80px'); expect((el as HTMLElement).style.width).toBe('100px'); expect(el?.className).toBe('emphasis')
    rerender(<Appear>newcomer</Appear>); expect(observations.nodes.at(-1)?.transition).toEqual(ENTER_T)
  })
  it('I-4 retains grouped scene instance payload and overlap and replaces different groups or Scene types', () => {
    let mounts = 0, unmounts = 0
    function Persistent({ payload }: SceneProps<number>) { useEffect(() => { mounts++; return () => { unmounts++ } }, []); return <SceneLayer style={{ zIndex: 4 }}><Box id="a" style={{ left: 3, top: 4 }}>a {payload}</Box><Box id="b" style={{ left: 3, top: 4 }}>b</Box></SceneLayer> }
    const { rerender } = render(<Stage step={{ ...steps[0], Scene: Persistent }} mode="browse" />)
    const first = screen.getByText('a 0'); rerender(<Stage step={{ ...steps[1], Scene: Persistent }} mode="browse" />)
    expect(mounts).toBe(1); expect(unmounts).toBe(0); expect(screen.getByText('a 1')).toBe(first); expect(document.querySelector('[data-presentation-appear]')).toBeNull(); expect((screen.getByText('b') as HTMLElement).style.left).toBe('3px')
    rerender(<Stage step={{ ...steps[2], Scene: Persistent, groupKey: 'different' }} mode="browse" />); expect(mounts).toBe(2); expect(unmounts).toBe(1)
    rerender(<Stage step={{ ...steps[2], Scene, groupKey: 'different' }} mode="browse" />); expect(unmounts).toBe(2)
  })
  it('I-5 forwards style class data identity and raw motion children with no visual defaults', () => {
    for (const Component of [Box, Label, Frame, Emphasis, SymbolChip, Arrow]) {
      const { unmount } = render(<Component id="custom" className="owned" data-custom="yes" style={{ left: 37, color: 'red' }}>content</Component>)
      const el = document.querySelector('[data-presentation-entity="custom"]') as HTMLElement
      expect(el.className).toBe('owned'); expect(el.dataset.custom).toBe('yes'); expect(el.style.left).toBe('37px'); expect(el.style.color).toBe('red'); expect(el.style.border).toBe(''); expect(el.style.fontFamily).toBe(''); unmount()
    }
    render(<SceneLayer><motion.div layout layoutId="raw">raw child</motion.div></SceneLayer>); expect(screen.getByText('raw child')).toBeTruthy()
  })
  it('I-6 exposes bottom-right attribution with host opt-in branding', () => {
    const { rerender } = render(<Presentation steps={steps} title="test" />)
    const a = screen.getByText('made by and-scene'); expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene'); expect((a.parentElement as HTMLElement).style.right).toBe('0px'); expect(a.parentElement?.hasAttribute('data-presentation-attribution')).toBe(true); expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation steps={steps} title="test" brand={<a href="/">host</a>} />); expect(screen.getByText('host')).toBeTruthy()
  })
  it('I-7 renders reading chrome only in browse and wide ToC only at wide viewport', () => {
    render(<Presentation steps={steps} title="test" />); expect(screen.getByLabelText('Sections')).toBeTruthy(); expect(screen.getByText('Caption 0')).toBeTruthy(); expect(screen.getByLabelText('Steps')).toBeTruthy()
    act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) }); expect(screen.queryByLabelText('Sections')).toBeNull()
    fireEvent.click(screen.getByText('Present')); expect(screen.queryByText('Caption 0')).toBeNull(); expect(screen.queryByLabelText('Steps')).toBeNull(); expect(screen.queryByText('Next')).toBeNull(); expect(screen.getByText('Title 0')).toBeTruthy(); expect(screen.getByText('01 / ask')).toBeTruthy()
  })
  it('I-8 honors initial present mode and P toggles keep the middle step', () => {
    render(<Presentation steps={steps} title="test" initialMode="present" />); expect(host().getAttribute('data-presentation-mode')).toBe('present')
    key('ArrowRight'); key('p'); expect(host().getAttribute('data-step-index')).toBe('1'); expect(host().getAttribute('data-presentation-mode')).toBe('browse'); key('P'); expect(host().getAttribute('data-step-index')).toBe('1')
  })
  it('I-9 maps every key once and leaves interactive editable and modified keys alone', () => {
    render(<Presentation steps={steps} title="test" />)
    for (const k of ['ArrowRight', ' ', 'PageDown']) key(k)
    expect(host().getAttribute('data-step-index')).toBe('3'); key('ArrowLeft'); key('PageUp'); expect(host().getAttribute('data-step-index')).toBe('1')
    for (const tag of ['button', 'a', 'input', 'textarea', 'select', 'summary', 'div']) {
      const control = document.createElement(tag); if (tag === 'div') control.setAttribute('contenteditable', 'true'); document.body.append(control); key('ArrowRight', control); key('p', control); control.remove()
    }
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true }); expect(host().getAttribute('data-step-index')).toBe('1'); expect(host().getAttribute('data-presentation-mode')).toBe('browse')
  })
  it('I-10 handles horizontal gestures ignores vertical short cancelled multitouch and cleans listeners', () => {
    const removeWindow = vi.spyOn(window, 'removeEventListener'), removeElement = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
    const { unmount } = render(<Presentation steps={steps} title="test" />)
    swipe(host(), -60); expect(host().getAttribute('data-step-index')).toBe('1'); swipe(host(), 60); expect(host().getAttribute('data-step-index')).toBe('0')
    swipe(host(), -20); swipe(host(), -80, 120); swipe(screen.getByText('Next'), -80)
    fireEvent.touchStart(host(), { touches: [{ clientX: 100, clientY: 0 }] }); fireEvent.touchCancel(host()); fireEvent.touchEnd(host(), { changedTouches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchStart(host(), { touches: [{ clientX: 100, clientY: 0 }, { clientX: 50, clientY: 0 }] }); fireEvent.touchEnd(host(), { changedTouches: [{ clientX: 0, clientY: 0 }] }); expect(host().getAttribute('data-step-index')).toBe('0')
    unmount(); expect(removeWindow.mock.calls.some(c => c[0] === 'keydown')).toBe(true); for (const event of ['touchstart', 'touchend', 'touchcancel']) expect(removeElement.mock.calls.some(c => c[0] === event)).toBe(true)
    vi.restoreAllMocks()
  })
  it('I-11 jumps by progress and first era step with semantic active hooks', () => {
    render(<Presentation steps={steps} title="test" />); fireEvent.click(screen.getByLabelText('Step 4: Title 3')); expect(host().getAttribute('data-step-index')).toBe('3'); expect(screen.getByLabelText('Step 4: Title 3').getAttribute('aria-current')).toBe('step'); expect(screen.getByText('build').dataset.presentationActive).toBe('true'); fireEvent.click(screen.getByText('build')); expect(host().getAttribute('data-step-index')).toBe('2'); fireEvent.click(screen.getByText('ask')); expect(host().getAttribute('data-step-index')).toBe('0'); expect(eras([steps[0], steps[2], steps[1]])).toEqual([{ era: 'ask', index: 0 }, { era: 'build', index: 1 }])
  })
  it('I-12 clamps repeated keyboard touch controls and direct targets at both ends', () => {
    render(<Presentation steps={steps} title="test" />); key('ArrowLeft'); key('PageUp'); swipe(host(), 100); expect(host().getAttribute('data-step-index')).toBe('0'); expect((screen.getByText('Previous') as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 8; i++) { key('ArrowRight'); swipe(host(), -100) } expect(host().getAttribute('data-step-index')).toBe('3'); expect((screen.getByText('Next') as HTMLButtonElement).disabled).toBe(true)
    const { result } = renderHook(() => usePresentationNav(4)); act(() => result.current.jump(999)); expect(result.current.index).toBe(3); act(() => result.current.jump(-10)); expect(result.current.index).toBe(0)
  })
  it('I-13 scales uniformly on resize per mode without step dependence and removes resize listener', () => {
    for (const [w, h] of [[1440, 900], [390, 844], [1440, 400], [200, 200]]) for (const mode of ['browse', 'present'] as const) { const scale = fitScale(w, h, mode); expect(scale).toBeGreaterThanOrEqual(0); expect(scale * DESIGN_W).toBeLessThanOrEqual(w); expect(scale * DESIGN_H).toBeLessThanOrEqual(h) }
    const spy = vi.spyOn(window, 'removeEventListener'); const { result, unmount, rerender } = renderHook(({ mode }) => useFitScale(mode), { initialProps: { mode: 'browse' as 'browse' | 'present' } }); const scale = result.current.scale; rerender({ mode: 'browse' }); expect(result.current.scale).toBe(scale); rerender({ mode: 'present' }); expect(result.current.scale).not.toBe(scale)
    act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) }); expect(result.current.scale).toBe(fitScale(390, 900, 'present')); unmount(); expect(spy.mock.calls.some(c => c[0] === 'resize')).toBe(true); spy.mockRestore()
    render(<Presentation steps={steps} title="test" />); const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement; expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); const before = canvas.style.transform; key('ArrowRight'); expect(canvas.style.transform).toBe(before)
  })
  it('I-23 captions and next previous follow every step', () => { render(<Presentation steps={steps} title="test" />); for (let i = 0; i < steps.length; i++) { expect(screen.getByText(`Caption ${i}`)).toBeTruthy(); if (i < steps.length - 1) fireEvent.click(screen.getByText('Next')) } fireEvent.click(screen.getByText('Previous')); expect(screen.getByText('Caption 2')).toBeTruthy() })
  it('rejects an empty presentation', () => { expect(() => render(<Presentation steps={[]} title="empty" />)).toThrow('at least one step') })
})
