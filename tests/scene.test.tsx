import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
vi.mock('motion/react', () => ({
  LayoutGroup: ({ children }: { children: ReactNode }) => children,
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: ({ layout, layoutId, initial, animate, exit, transition, ...props }: HTMLAttributes<HTMLDivElement> & { layout?: boolean; layoutId?: string; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }) => <div {...props} data-layout={String(layout)} data-layout-id={layoutId} data-motion={JSON.stringify({ initial, animate, exit, transition })} /> },
}))
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer } from '../src/presentation-kit/nodes/primitives'
import { ENTER_DELAY, ENTER_T, LAYOUT_T, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../src/presentation-kit/constants'
import { usePresentationNav, clamp } from '../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { eraStarts } from '../src/presentation-kit/chrome/Toc'
import type { Step, SceneProps } from '../src/presentation-kit/types'
const Scene = ({ payload }: SceneProps<string>) => <div data-testid="diagram">{payload}</div>
const steps: Step<string>[] = ['Alpha', 'Beta', 'Gamma'].map((title, i) => ({ id: `s${i}`, era: i < 2 ? 'start' : 'end', title, caption: `Paragraph ${i}`, Scene, payload: `state-${i}`, groupKey: 'shared' }))
const key = (value: string, target: Element | Window = window) => fireEvent.keyDown(target, { key: value })
describe('scene contract and chrome', () => {
  it('selects named step narration and derives numbering after reorder insert and removal', () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByRole('heading').textContent).toBe('Alpha')
    expect(screen.getByText('Paragraph 0')).toBeTruthy()
    expect(screen.getByTestId('diagram').textContent).toBe('state-0')
    key('ArrowRight')
    expect(document.querySelector('[data-step-id]')?.getAttribute('data-step-id')).toBe('s1')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('02')
    rerender(<Presentation steps={[steps[2], steps[0], steps[1], { ...steps[0], id: 'insert' }]} title="Test" />)
    expect(screen.getByRole('heading').textContent).toBe('Alpha')
    expect(document.querySelector('[data-step-count]')?.getAttribute('data-step-count')).toBe('4')
    rerender(<Presentation steps={[steps[2]]} title="Test" />)
    expect(screen.getByRole('heading').textContent).toBe('Gamma')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01')
  })
  it('rejects empty step arrays instead of rendering invalid state', () => {
    expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step')
  })
  it('defaults attribution to the repository with a stable hook and bottom-right geometry and opts into branding', () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />)
    const a = screen.getByRole('link', { name: 'made by and-scene' })
    expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(a.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(a.parentElement?.style.right).toBe('20px')
    expect(a.parentElement?.style.bottom).toBe('12px')
    expect(document.querySelector('header a')).toBeNull()
    rerender(<Presentation steps={steps} title="Test" brand={<a href="/">Host</a>} />)
    expect(document.querySelector('header a')?.textContent).toBe('Host')
  })
  it('switches modes through P and public control without losing the active step', () => {
    render(<Presentation steps={steps} title="Test" />)
    key('ArrowRight'); key('p')
    expect(document.querySelector('[data-presentation-mode="present"][data-step-index="1"]')).toBeTruthy()
    expect(screen.getByRole('heading').textContent).toBe('Beta')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    expect(screen.getByText('Paragraph 1')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeTruthy()
    expect(document.querySelector('[data-presentation-toc]')?.getAttribute('aria-label')).toBe('Table of contents')
  })
  it('respects initial present mode', () => {
    render(<Presentation steps={steps} title="Test" initialMode="present" />)
    expect(document.querySelector('[data-presentation-mode="present"]')).toBeTruthy()
  })
  it('jumps with progress and era starts and exposes semantic active state', () => {
    render(<Presentation steps={steps} title="Test" />)
    expect(eraStarts(steps)).toEqual([{ era: 'start', index: 0 }, { era: 'end', index: 2 }])
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Beta' }))
    expect(screen.getByRole('button', { name: 'Step 2: Beta' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'start', hidden: true }).getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'end', hidden: true }))
    expect(document.querySelector('[data-step-index="2"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'start', hidden: true }).hasAttribute('aria-current')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'start', hidden: true }))
    expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  })
  it('on-screen previous and next use clamped navigation with boundary control state', () => {
    render(<Presentation steps={steps} title="Test" />)
    const prev = screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
    const next = screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(next); expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
    fireEvent.click(prev); expect(prev.disabled).toBe(true)
    fireEvent.click(next); fireEvent.click(next); expect(next.disabled).toBe(true)
  })
})
describe('navigation hook', () => {
  it('handles every forward and backward key exactly once', () => {
    const { result } = renderHook(() => usePresentationNav(20))
    for (const forward of ['ArrowRight', ' ', 'PageDown']) { const old = result.current.index; key(forward); expect(result.current.index).toBe(old + 1) }
    for (const back of ['ArrowLeft', 'PageUp']) { const old = result.current.index; key(back); expect(result.current.index).toBe(old - 1) }
  })
  it('clamps both boundaries direct targets and single-step decks without wrapping', () => {
    const { result, rerender } = renderHook(({ count }) => usePresentationNav(count), { initialProps: { count: 3 } })
    act(() => result.current.prev()); expect(result.current.index).toBe(0)
    act(() => result.current.go(100)); expect(result.current.index).toBe(2)
    act(() => result.current.next()); expect(result.current.index).toBe(2)
    act(() => result.current.go(-10)); expect(result.current.index).toBe(0)
    rerender({ count: 1 }); key('ArrowRight'); key('ArrowLeft'); expect(result.current.index).toBe(0)
    expect(clamp(10, 1)).toBe(0)
  })
  it('does not hijack focused controls nested targets editable content or modifier shortcuts', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    const { container } = render(<div><button><span>inside</span></button><a href="#">link</a><input /><select /><textarea /><div contentEditable suppressContentEditableWarning>edit</div><div role="slider">slider</div></div>)
    for (const el of container.querySelectorAll('button,button span,a,input,select,textarea,[contenteditable],[role="slider"]')) for (const k of ['ArrowRight', ' ', 'PageDown', 'p']) key(k, el)
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    expect(result.current.index).toBe(0); expect(result.current.mode).toBe('browse')
  })
  it('left/right horizontal swipes navigate while short vertical multitouch and control gestures do not', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const swipe = (x: number, y: number, target: Window | Element = window, touches = [{ clientX: 100, clientY: 100 }]) => { fireEvent.touchStart(target, { touches }); fireEvent.touchEnd(target, { changedTouches: [{ clientX: x, clientY: y }] }) }
    swipe(20, 103); expect(result.current.index).toBe(1)
    swipe(180, 102); expect(result.current.index).toBe(0)
    swipe(70, 100); swipe(20, 300); swipe(10, 100, window, [{ clientX: 100, clientY: 100 }, { clientX: 50, clientY: 100 }])
    const { container } = render(<button>Touch</button>); swipe(20, 100, container.firstElementChild!)
    expect(result.current.index).toBe(0)
  })
  it('removes navigation listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => usePresentationNav(3)); unmount()
    expect(remove.mock.calls.map(c => c[0])).toEqual(expect.arrayContaining(['keydown', 'touchstart', 'touchend']))
    remove.mockRestore()
  })
})
describe('grouped scene lifecycle', () => {
  it('persists same-group same-Scene payload updates and remounts on group or renderer changes', () => {
    let mounts = 0; let unmounts = 0
    function Persistent({ payload }: SceneProps<string>) { useEffect(() => { mounts++; return () => { unmounts++ } }, []); return <div>{payload}</div> }
    const step = { ...steps[0], Scene: Persistent }
    const { rerender } = render(<Stage step={step} mode="browse" />)
    rerender(<Stage step={{ ...step, id: 'next', payload: 'updated' }} mode="browse" />)
    expect(screen.getByText('updated')).toBeTruthy(); expect(mounts).toBe(1); expect(unmounts).toBe(0)
    rerender(<Stage step={{ ...step, groupKey: 'other' }} mode="browse" />)
    expect(mounts).toBe(2); expect(unmounts).toBe(1)
    rerender(<Stage step={{ ...step, groupKey: 'other', Scene }} mode="browse" />)
    expect(unmounts).toBe(2)
  })
  it('remounts ungrouped distinct steps', () => {
    let mounts = 0
    function Fresh() { useEffect(() => { mounts++ }, []); return null }
    const step = { ...steps[0], groupKey: undefined, Scene: Fresh }
    const { rerender } = render(<Stage step={step} mode="browse" />)
    rerender(<Stage step={{ ...step, id: 'another' }} mode="browse" />)
    expect(mounts).toBe(2)
  })
})
describe('primitives motion identity and style ownership', () => {
  it('forwards identity class style and stable hooks for every primitive without visual fallback', () => {
    for (const Primitive of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
      const { container, unmount } = render(<Primitive id="stable" className="local" style={{ left: 12, top: 20, zIndex: 3 }} data-custom="yes">Label</Primitive>)
      const el = container.firstElementChild as HTMLElement
      expect(el.dataset.layoutId).toBe('stable'); expect(el.dataset.presentationNode).toBeTruthy()
      expect(el.className).toBe('local'); expect(el.style.left).toBe('12px'); expect(el.style.zIndex).toBe('3')
      expect(el.style.color).toBe(''); expect(el.style.border).toBe(''); expect(el.dataset.custom).toBe('yes')
      expect(JSON.parse(el.dataset.motion!).transition.layout.duration).toBe(LAYOUT_T)
      unmount()
    }
  })
  it('newcomers enter after layout settles and departures have exit while layers do not reflow', () => {
    const { container } = render(<SceneLayer style={{ zIndex: 4 }}><Appear><Box id="enter">New</Box></Appear></SceneLayer>)
    const layer = container.querySelector('[data-presentation-layer]') as HTMLElement
    const newcomer = container.querySelector('[data-presentation-appear]') as HTMLElement
    const motion = JSON.parse(newcomer.dataset.motion!)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T); expect(motion.transition).toEqual({ delay: ENTER_DELAY, duration: ENTER_T })
    expect(motion.initial.opacity).toBe(0); expect(motion.animate.opacity).toBe(1); expect(motion.exit.opacity).toBe(0)
    expect(layer.style.position).toBe('absolute'); expect(parseFloat(layer.style.inset)).toBe(0); expect(layer.style.zIndex).toBe('4')
  })
})
describe('fixed canvas scaling', () => {
  it('uniformly fits wide narrow short and resized viewports in both modes without overflow', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) for (const [w, h] of [[1440, 900], [375, 812], [1440, 400], [20, 20]]) {
      const scale = fitScale(w, h, mode); const g = STAGE_LAYOUT[mode]
      expect(scale).toBeGreaterThanOrEqual(0)
      expect(scale * 880).toBeLessThanOrEqual(Math.max(0, w - g.left - g.right))
      expect(scale * 380).toBeLessThanOrEqual(Math.max(0, h - g.top - g.bottom))
    }
    expect(fitScale(500, 900, 'browse', 1000, 500)).toBe((500 - 48) / 1000)
  })
  it('updates on resize cleans listeners and keeps scale constant across steps within a mode', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { result, unmount } = renderHook(() => useFitScale('browse'))
    const initial = result.current
    act(() => { window.innerWidth = 375; fireEvent(window, new Event('resize')) })
    expect(result.current).not.toBe(initial); unmount()
    expect(remove.mock.calls.map(c => c[0])).toContain('resize'); remove.mockRestore()
    const { container, rerender } = render(<Stage step={steps[0]} mode="browse" />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    const width = canvas.style.width
    rerender(<Stage step={steps[1]} mode="browse" />)
    expect(canvas.style.width).toBe(width)
    expect(canvas.firstElementChild?.getAttribute('style')).toContain('width: 880px')
    expect(canvas.firstElementChild?.getAttribute('style')).toContain('height: 380px')
    expect(canvas.firstElementChild?.getAttribute('style')).toContain('scale(')
  })
})
