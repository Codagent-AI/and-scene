import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import { usePresentationNav, swipeDirection } from '../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W } from '../src/presentation-kit/constants'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { Stage } from '../src/presentation-kit/Stage'
import type { SceneProps, Step } from '../src/presentation-kit/types'
import { eras } from '../src/presentation-kit/chrome/Toc'
import { presentations, resolvePresentation } from '../src/presentations'
import Landing from '../src/Landing'
function Scene({ payload }: SceneProps<number>) { return <Box identity="stable" data-testid="entity">{payload}</Box> }
const makeSteps = (): Step<number>[] => ['A', 'B', 'B'].map((era, i) => ({ id: `id-${i}`, era, title: `Title ${i}`, caption: `Caption ${i}`, Scene, payload: i, groupKey: 'group' }))
const key = (value: string, target: EventTarget = window) => fireEvent.keyDown(target, { key: value })
describe('scene contracts', () => {
  it('I-1 metadata and diagram state follow the active step', () => {
    const { container } = render(<Presentation steps={makeSteps()} title="Example" />)
    expect(screen.getByRole('heading').textContent).toBe('Title 0')
    expect(screen.getByText('Caption 0')).toBeTruthy()
    act(() => key('ArrowRight'))
    expect(container.querySelector('[data-step-id]')?.getAttribute('data-step-id')).toBe('id-1')
    expect(container.querySelector('[data-step-era]')?.getAttribute('data-step-era')).toBe('B')
    expect(screen.getByTestId('entity').textContent).toBe('1')
  })
  it('I-2 numbers derive from position after insertion removal and reordering', () => {
    const steps = makeSteps()
    const { container, rerender } = render(<Presentation title="Order" steps={[steps[2], steps[0], steps[1]]} />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01')
    expect(screen.getByRole('button', { name: 'Step 1: Title 2' })).toBeTruthy()
    rerender(<Presentation title="Order" steps={[steps[1], steps[2]]} />)
    expect(screen.getByRole('button', { name: 'Step 1: Title 1' })).toBeTruthy()
    rerender(<Presentation title="Order" steps={[steps[0], steps[1], steps[2]]} />)
    expect(screen.getByRole('button', { name: 'Step 3: Title 2' })).toBeTruthy()
  })
  it('I-4 stable entities retain the same DOM instance as properties change', () => {
    const { rerender, getByTestId } = render(<Box identity="stable" data-testid="box" style={{ left: 1, width: 20 }} className="quiet">Old</Box>)
    const box = getByTestId('box')
    rerender(<Box identity="stable" data-testid="box" style={{ left: 30, width: 50 }} className="emphasis">New</Box>)
    expect(getByTestId('box')).toBe(box)
    expect(box.style.left).toBe('30px'); expect(box.style.width).toBe('50px')
    expect(box.className).toBe('emphasis'); expect(box.textContent).toBe('New')
  })
  it('I-7 authored overlapping positions and stacks remain unchanged between grouped payloads', () => {
    function Stack({ payload }: SceneProps<number>) { return <SceneLayer><Box identity="a" data-testid="a" style={{ position: 'absolute', left: 20, top: 10, zIndex: 2 }}>{payload}</Box><Box identity="b" style={{ position: 'absolute', left: 20, top: 10 }}>B</Box></SceneLayer> }
    const { rerender } = render(<Stage step={{ ...makeSteps()[0], Scene: Stack }} index={0} mode="browse" />)
    const a = screen.getByTestId('a')
    rerender(<Stage step={{ ...makeSteps()[1], Scene: Stack }} index={1} mode="browse" />)
    expect(screen.getByTestId('a')).toBe(a)
    expect(a.style.left).toBe('20px'); expect(a.style.zIndex).toBe('2')
  })
  it('I-8 primitives forward class data and literal style hooks; layers accept arbitrary children', () => {
    const primitives = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    const { container } = render(<SceneLayer>{primitives.map((Primitive, i) => <Primitive identity={`id-${i}`} key={i} className="local" data-author="custom" style={{ left: i * 10 }} />)}<span data-raw="yes">Raw scene content</span></SceneLayer>)
    expect(container.querySelectorAll('[data-author="custom"].local')).toHaveLength(6)
    expect(container.querySelector('[data-raw]')).toBeTruthy()
    expect(container.querySelector<HTMLElement>('[data-presentation-layer]')?.style.position).toBe('absolute')
  })
  it('I-9 unstyled primitives supply no visual style defaults', () => {
    const { container } = render(<><Box identity="a">A</Box><Label identity="b">B</Label><Appear>C</Appear></>)
    for (const element of container.querySelectorAll<HTMLElement>('[data-presentation-node]')) {
      for (const property of ['color', 'background', 'fontFamily', 'border', 'boxShadow', 'padding', 'margin'] as const) expect(element.style[property]).toBe('')
      expect(element.className).toBe('')
    }
  })
  it('I-10 attribution defaults and opt-in branding', () => {
    const { container, rerender } = render(<Presentation title="A" steps={makeSteps()} />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.closest<HTMLElement>('[data-presentation-attribution]')?.style.right).toBe('16px')
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation title="A" steps={makeSteps()} brand={<a href="/">Host</a>} />)
    expect(screen.getByText('Host').closest('[data-presentation-brand]')).toBeTruthy()
  })
  it('I-11 modes expose the required chrome', () => {
    const { container } = render(<Presentation title="A" steps={makeSteps()} />)
    expect(container.querySelector('[data-presentation-caption]')).toBeTruthy()
    expect(container.querySelector('[data-presentation-toc]')).toBeTruthy()
    expect(container.querySelector('[data-presentation-progress]')).toBeTruthy()
    act(() => { window.innerWidth = 500; fireEvent.resize(window) })
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    act(() => { window.innerWidth = 1440; fireEvent.resize(window) })
    expect(container.querySelector('[data-presentation-toc]')).toBeTruthy()
    act(() => key('p'))
    for (const hook of ['caption', 'toc', 'controls', 'progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    expect(screen.getByRole('heading').textContent).toBe('Title 0')
    expect(container.querySelector('[data-presentation-marker]')).toBeTruthy()
  })
  it('I-12 Presentation initial modes and repeated toggles preserve step and Scene', () => {
    const { container, unmount } = render(<Presentation title="Modes" steps={makeSteps()} initialMode="present" />)
    const root = container.querySelector('[data-presentation-root]')!
    expect(root.getAttribute('data-presentation-mode')).toBe('present')
    act(() => key('ArrowRight'))
    const scene = screen.getByTestId('entity')
    for (const expected of ['browse', 'present', 'browse']) {
      act(() => key('P'))
      expect(root.getAttribute('data-presentation-mode')).toBe(expected)
      expect(root.getAttribute('data-step-index')).toBe('1')
      expect(screen.getByTestId('entity')).toBe(scene)
      expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 1')
    }
    unmount()
    const other = render(<Presentation title="Browse" steps={makeSteps()} initialMode="browse" />)
    expect(other.container.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('browse')
  })
  it('I-13 keyboard maps once and unmount removes listeners', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(20))
    for (const value of ['ArrowRight', ' ', 'PageDown']) act(() => key(value))
    expect(result.current.index).toBe(3)
    for (const value of ['ArrowLeft', 'PageUp']) act(() => key(value))
    expect(result.current.index).toBe(1)
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount(); expect(remove.mock.calls.some(call => call[0] === 'keydown')).toBe(true); remove.mockRestore()
  })
  it('I-14 touch swipes map directions ignore vertical gestures and clean up', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(4))
    const swipe = (x: number, y: number) => { fireEvent.touchStart(window, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(window, { changedTouches: [{ clientX: x, clientY: y }] }) }
    act(() => swipe(10, 102)); expect(result.current.index).toBe(1)
    act(() => swipe(190, 101)); expect(result.current.index).toBe(0)
    act(() => swipe(90, 200)); expect(result.current.index).toBe(0)
    expect(swipeDirection(-20, 0)).toBe(0)
    const remove = vi.spyOn(window, 'removeEventListener'); unmount()
    expect(remove.mock.calls.filter(call => String(call[0]).startsWith('touch'))).toHaveLength(3); remove.mockRestore()
  })
  it('I-15 direct controls target steps and first step of each era', () => {
    const steps = makeSteps(); expect(eras(steps)).toEqual([{ era: 'A', index: 0 }, { era: 'B', index: 1 }])
    const { container } = render(<Presentation title="A" steps={steps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title 2' }))
    expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'B' }))
    expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  })
  it('I-16 semantic active state tracks direct jumps', () => {
    const { container } = render(<Presentation title="A" steps={makeSteps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title 2' }))
    for (const hook of ['progress', 'toc']) {
      const active = container.querySelectorAll(`[data-presentation-${hook}] [data-presentation-active="true"]`)
      expect(active).toHaveLength(1); expect(active[0].getAttribute('aria-current')).toBe('step')
    }
  })
  it('I-17 interactive controls keep all navigation keys', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const { container } = render(<div><button>B</button><a href="#">A</a><input /><textarea /><select /><div contentEditable suppressContentEditableWarning>edit</div><div role="slider" tabIndex={0} /></div>)
    for (const element of container.firstElementChild!.children) {
      for (const value of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) act(() => key(value, element))
    }
    expect(result.current.index).toBe(0); expect(result.current.mode).toBe('browse')
  })
  it('I-18 clamps ends and disabled boundary controls', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev()); expect(result.current.index).toBe(0)
    act(() => result.current.go(99)); expect(result.current.index).toBe(2)
    act(() => result.current.next()); expect(result.current.index).toBe(2)
    act(() => result.current.go(-10)); expect(result.current.index).toBe(0)
    render(<Presentation title="Single" steps={[makeSteps()[0]]} />)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Previous step' }).disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next step' }).disabled).toBe(true)
  })
  it('I-19 fixed canvas scales uniformly per mode and resize listeners clean up', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) {
      expect(fitScale(400, 800, mode)).toBeGreaterThan(0)
      expect(fitScale(1440, 400, mode)).toBeLessThan(fitScale(1440, 900, mode))
      expect(fitScale(10, 10, mode)).toBe(0)
    }
    expect(fitScale(1440, 900, 'present')).toBeGreaterThanOrEqual(fitScale(1440, 900, 'browse'))
    const { result, unmount } = renderHook(() => useFitScale('browse'))
    act(() => { window.innerWidth = 400; fireEvent.resize(window) })
    expect(result.current).toBe(fitScale(400, window.innerHeight, 'browse'))
    const remove = vi.spyOn(window, 'removeEventListener'); unmount(); expect(remove.mock.calls.some(call => call[0] === 'resize')).toBe(true); remove.mockRestore()
    const { container } = render(<Presentation title="A" steps={makeSteps()} />)
    const stage = container.querySelector<HTMLElement>('[data-presentation-stage]')!
    expect(stage.style.display).toBe('flex'); expect(stage.style.justifyContent).toBe('center')
    const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); expect(canvas.style.transform).toMatch(/^scale\(/)
  })
  it('I-26 registry resolves explicit routes and landing enumerates entries', () => {
    expect(resolvePresentation('/how-to-make-a-presentation')).toBe(presentations[0])
    expect(resolvePresentation('/how-to-make-a-presentation/')).toBe(presentations[0])
    expect(resolvePresentation('/unknown')).toBeUndefined()
    render(<Landing />); expect(screen.getByRole('link', { name: /How to Use/ }).getAttribute('href')).toBe('/how-to-make-a-presentation')
  })
  it('I-27 multiple registry entries coexist', () => {
    const entries = ['one', 'two', 'three'].map(slug => ({ ...presentations[0], slug }))
    for (const entry of entries) expect(resolvePresentation(`/${entry.slug}`, entries)).toBe(entry)
  })
  it('empty presentations fail explicitly', () => {
    expect(() => render(<Presentation title="Empty" steps={[]} />)).toThrow('requires at least one step')
  })
})
