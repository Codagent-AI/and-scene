import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { Presentation, Stage, Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { ENTER_DELAY, LAYOUT_T } from '../src/presentation-kit/constants'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react')
  function Motion({ children, layout, layoutId, initial, animate, exit, transition, ...props }: Record<string, unknown> & { children?: ReactNode }) {
    return createElement('div', { ...props, 'data-layout': layout, 'data-layout-id': layoutId, 'data-initial': JSON.stringify(initial), 'data-animate': JSON.stringify(animate), 'data-exit': JSON.stringify(exit), 'data-transition': JSON.stringify(transition) }, children)
  }
  return { motion: { div: Motion }, AnimatePresence: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children), LayoutGroup: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children) }
})
function Scene({ payload }: SceneProps<{ value: number }>) { return <Box entityId="stable" style={{ left: payload.value }}>{payload.value}</Box> }
const steps: Step<{ value: number }>[] = [0, 1, 2, 3].map(i => ({ id: `s${i}`, era: i < 2 ? 'start' : 'finish', title: `Title ${i}`, caption: `A paragraph for ${i}.`, groupKey: 'diagram', Scene, payload: { value: i } }))
function root(container: HTMLElement) { return container.querySelector('[data-presentation-root]')! }
function key(key: string, target: Element | Window = window) { fireEvent.keyDown(target, { key }) }
function viewport(width: number, height = 900) { Object.defineProperty(window, 'innerWidth', { configurable: true, value: width }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: height }); fireEvent(window, new Event('resize')) }
describe('scene kit', () => {
  it('I-1 order-derived identity narration and active diagram', () => {
    const { container } = render(<Presentation steps={[steps[2], steps[0]]} title="test" />)
    expect(screen.getByRole('heading').textContent).toBe('Title 2')
    expect(screen.getByText('A paragraph for 2.')).toBeTruthy()
    expect(container.querySelector('[data-presentation-marker]')!.textContent).toBe('01 / 02 · finish')
    expect(container.querySelector('[data-presentation-entity]')!.textContent).toBe('2')
    key('ArrowRight'); expect(root(container).getAttribute('data-step-index')).toBe('1')
    expect(screen.getByRole('heading').textContent).toBe('Title 0')
  })
  it('I-3 layout projection delayed entry and exit configuration', () => {
    const { container, rerender } = render(<Box entityId="same" style={{ left: 10, width: 20 }}>old</Box>)
    const node = container.firstElementChild!
    expect(node.getAttribute('data-layout-id')).toBe('same')
    expect(JSON.parse(node.getAttribute('data-transition')!).opacity.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_DELAY).toBe(LAYOUT_T)
    expect(JSON.parse(node.getAttribute('data-exit')!)).toEqual({ opacity: 0 })
    rerender(<Box entityId="same" style={{ left: 30, width: 40 }}>new</Box>)
    expect(container.firstElementChild).toBe(node)
    expect(node.textContent).toBe('new'); expect((node as HTMLElement).style.left).toBe('30px')
  })
  it('I-4 grouped instance payload and continuing entity persist; changed group or scene remounts', () => {
    let mounts = 0, unmounts = 0
    function Count({ payload }: SceneProps<{ value: number }>) { const [state] = useState('retained'); useEffect(() => { mounts++; return () => { unmounts++ } }, []); return <Box entityId="persist">{payload.value}:{state}</Box> }
    const one = { ...steps[0], Scene: Count }, two = { ...steps[1], Scene: Count }
    const { container, rerender } = render(<Stage step={one} mode="browse" />)
    const entity = container.querySelector('[data-presentation-entity]')
    rerender(<Stage step={two} mode="browse" />)
    expect(mounts).toBe(1); expect(unmounts).toBe(0); expect(entity!.textContent).toBe('1:retained')
    expect(container.querySelector('[data-presentation-entity]')).toBe(entity)
    expect(container.querySelector('[data-presentation-appear]')).toBeNull()
    rerender(<Stage step={{ ...two, groupKey: 'other' }} mode="browse" />)
    expect(mounts).toBe(2); expect(unmounts).toBe(1)
    rerender(<Stage step={{ ...two, groupKey: 'other', Scene }} mode="browse" />)
    expect(unmounts).toBe(2)
  })
  it('I-5 overlapping coordinates and stacking survive grouped updates', () => {
    function Overlap({ payload }: SceneProps<{ value: number }>) { return <SceneLayer><Box entityId="a" style={{ position: 'absolute', left: 10, top: 10, zIndex: 1 }}>a</Box><Box entityId="b" style={{ position: 'absolute', left: 10, top: 10, zIndex: 2 }}>{payload.value}</Box></SceneLayer> }
    const { container, rerender } = render(<Stage step={{ ...steps[0], Scene: Overlap }} mode="browse" />)
    const nodes = [...container.querySelectorAll('[data-presentation-entity]')]
    rerender(<Stage step={{ ...steps[1], Scene: Overlap }} mode="browse" />)
    expect([...container.querySelectorAll('[data-presentation-entity]')]).toEqual(nodes)
    expect(nodes.map(n => (n as HTMLElement).style.left)).toEqual(['10px', '10px'])
    expect((nodes[1] as HTMLElement).style.zIndex).toBe('2')
  })
  it('I-7 primitives forward hooks classes literal geometry and style without visual defaults', () => {
    const { container } = render(<>{[Box, Label, Arrow, Frame, Emphasis, SymbolChip].map((Node, i) => <Node key={i} entityId={`n${i}`} className="owned" data-author="yes" style={{ left: 42 }}>text</Node>)}<Appear className="arrival" data-author="yes" style={{ top: 11 }} /><SceneLayer className="layer" data-author="yes" style={{ zIndex: 3 }} /></>)
    expect(container.querySelectorAll('[data-author="yes"]').length).toBe(8)
    for (const el of container.querySelectorAll('[data-presentation-node]')) { expect(el.className).toBe('owned'); expect((el as HTMLElement).style.left).toBe('42px'); expect((el as HTMLElement).style.color).toBe('') }
    expect(container.querySelector('[data-presentation-layer]')!.getAttribute('style')).toContain('position: absolute')
    expect(container.querySelector('[data-presentation-appear]')!.getAttribute('data-transition')).toContain(String(ENTER_DELAY))
  })
  it('I-8 attribution defaults and explicit branding', () => {
    const { container, rerender } = render(<Presentation steps={steps} title="test" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(container.querySelector('[data-presentation-brand]')!.textContent).toBe('')
    expect(link.parentElement!.style.bottom).toBe('16px'); expect(link.parentElement!.style.right).toBe('20px')
    rerender(<Presentation steps={steps} title="test" brand={<a href="/">Host</a>} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
  })
  it('I-9 present mode title-focused chrome', () => {
    const { container } = render(<Presentation steps={steps} title="test" initialMode="present" />)
    expect(screen.getByRole('heading').textContent).toBe('Title 0')
    for (const name of ['caption', 'toc', 'navigation', 'prev', 'next']) expect(container.querySelector(`[data-presentation-${name}]`)).toBeNull()
    expect(container.querySelector('[data-presentation-marker]')).toBeTruthy()
  })
  it('I-10 browse caption controls and responsive ToC', () => {
    viewport(1440)
    const { container } = render(<Presentation steps={steps} title="test" />)
    for (const name of ['caption', 'toc', 'progress', 'prev', 'next']) expect(container.querySelector(`[data-presentation-${name}]`)).toBeTruthy()
    act(() => viewport(390)); expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    act(() => viewport(1440)); expect(container.querySelector('[data-presentation-toc]')).toBeTruthy()
  })
  it('I-11 initial modes and repeated toggle preserve position', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'present'))
    expect(result.current.mode).toBe('present'); act(() => result.current.jump(2))
    act(() => key('p')); expect(result.current.mode).toBe('browse'); expect(result.current.index).toBe(2)
    act(() => result.current.toggle()); expect(result.current.mode).toBe('present'); expect(result.current.index).toBe(2)
  })
  it('I-12 keyboard keys advance once and interactive controls keep keys', () => {
    const { result } = renderHook(() => usePresentationNav(20))
    for (const [i, k] of ['ArrowRight', ' ', 'PageDown'].entries()) { act(() => key(k)); expect(result.current.index).toBe(i + 1) }
    for (const [i, k] of ['ArrowLeft', 'PageUp'].entries()) { act(() => key(k)); expect(result.current.index).toBe(2 - i) }
    const { container } = render(<><input /><button>button</button><a href="#">link</a><textarea /><select /><div contentEditable suppressContentEditableWarning>edit</div><div role="slider" tabIndex={0} /></>)
    for (const control of container.children) for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
      (control as HTMLElement).focus(); const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
      act(() => control.dispatchEvent(event)); expect(result.current.index).toBe(1); expect(event.defaultPrevented).toBe(false)
    }
  })
  it('I-13 directional swipes ignore vertical gestures and clamp boundaries', () => {
    const { container } = render(<Presentation steps={steps.slice(0, 2)} title="test" />)
    const el = root(container)
    const swipe = (dx: number, dy = 0) => { fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 200 }] }); fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] }) }
    swipe(100); expect(el.getAttribute('data-step-index')).toBe('0')
    swipe(-100); expect(el.getAttribute('data-step-index')).toBe('1')
    swipe(-100); expect(el.getAttribute('data-step-index')).toBe('1')
    swipe(10, 200); expect(el.getAttribute('data-step-index')).toBe('1')
    swipe(100); expect(el.getAttribute('data-step-index')).toBe('0')
  })
  it('I-14 direct progress and era jumps use first era step', () => {
    viewport(1440); const { container } = render(<Presentation steps={steps} title="test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 4: Title 3' })); expect(root(container).getAttribute('data-step-index')).toBe('3')
    fireEvent.click(screen.getByRole('button', { name: 'finish' })); expect(root(container).getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'start' })); expect(root(container).getAttribute('data-step-index')).toBe('0')
  })
  it('I-15 active semantic and data hooks track direct and sequential navigation', () => {
    viewport(1440); const { container } = render(<Presentation steps={steps} title="test" />)
    const active = () => [...container.querySelectorAll('[data-presentation-active="true"]')]
    expect(active().length).toBe(2); expect(active().every(el => el.getAttribute('aria-current') === 'step')).toBe(true)
    key('ArrowRight'); expect(screen.getByRole('button', { name: 'Step 2: Title 1' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: 'Step 4: Title 3' }))
    expect(screen.getByRole('button', { name: 'finish' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'start' }).hasAttribute('aria-current')).toBe(false)
  })
  it('I-16 repeated boundaries and direct jumps clamp', () => {
    const { result } = renderHook(() => usePresentationNav(2))
    act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0)
    act(() => { result.current.next(); result.current.next(); result.current.next() }); expect(result.current.index).toBe(1)
    act(() => result.current.jump(-99)); expect(result.current.index).toBe(0)
    act(() => result.current.jump(99)); expect(result.current.index).toBe(1)
  })
  it('I-17 uniform fixed canvas per-mode scale on resize independent of steps', () => {
    expect(fitScale(1440, 900, 'browse')).toBe(1)
    expect(fitScale(390, 844, 'browse')).toBeCloseTo(334 / 880)
    expect(fitScale(1000, 500, 'browse')).toBeCloseTo(150 / 380)
    expect(fitScale(1000, 500, 'present')).toBeCloseTo(300 / 380)
    expect(fitScale(100, 100, 'browse')).toBe(0)
    viewport(1440); const { result } = renderHook(() => useFitScale('browse'))
    act(() => viewport(390)); expect(result.current).toBeCloseTo(334 / 880)
    const { container, rerender } = render(<Stage step={steps[0]} mode="browse" />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    const transform = canvas.style.transform; expect(transform).toMatch(/^scale\([\d.]+\)$/)
    rerender(<Stage step={steps[1]} mode="browse" />); expect(canvas.style.transform).toBe(transform)
  })
})
