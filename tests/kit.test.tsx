// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer, ENTER_DELAY, LAYOUT_T, fitScale, useFitScale, usePresentationNav, isInteractive } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'

vi.mock('motion/react', () => ({
  motion: { div: ({ children, layoutId, layout, initial, animate, exit, transition, ...rest }: Record<string, unknown>) => <div {...rest} data-layout-id={layoutId} data-layout={String(layout)} data-initial={JSON.stringify(initial)} data-animate={JSON.stringify(animate)} data-exit={JSON.stringify(exit)} data-transition={JSON.stringify(transition)}>{children as ReactNode}</div> },
  LayoutGroup: ({ children }: { children: ReactNode }) => children,
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}))
afterEach(() => { cleanup(); vi.restoreAllMocks() })
function Scene({ payload }: SceneProps<number>) { return <div data-testid="scene">{payload}</div> }
const steps: Step<number>[] = [
  { id: 'a', era: 'first', title: 'A', caption: 'Caption A', Scene, payload: 1, groupKey: 'group' },
  { id: 'b', era: 'first', title: 'B', caption: 'Caption B', Scene, payload: 2, groupKey: 'group' },
  { id: 'c', era: 'second', title: 'C', caption: 'Caption C', Scene, payload: 3, groupKey: 'group' },
]
function viewport(width: number, height = 900) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  act(() => window.dispatchEvent(new Event('resize')))
}
function root(container: HTMLElement) { return container.querySelector('[data-presentation-root]')! }

describe('scene kit contracts', () => {
  it('I-17 metadata, active diagram, captions and order-derived numbering', () => {
    const { container, rerender } = render(<Presentation steps={steps} title="Example" />)
    expect(screen.getByTestId('scene').textContent).toBe('1')
    expect(screen.getByText('Caption A')).toBeTruthy()
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / first')
    rerender(<Presentation steps={[steps[2], steps[0]]} title="Example" />)
    expect(screen.getByTestId('scene').textContent).toBe('3')
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / second')
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('02 / first')
  })
  it('I-19 stable layout identity and delayed newcomer/exit configuration', () => {
    const { container, rerender } = render(<Box id="same" style={{ left: 10 }}>old</Box>)
    const entity = container.firstElementChild
    rerender(<Box id="same" style={{ left: 90 }}>new</Box>)
    expect(container.firstElementChild).toBe(entity)
    expect(entity?.getAttribute('data-layout-id')).toBe('same')
    expect(entity?.getAttribute('data-transition')).toContain(JSON.stringify(LAYOUT_T))
    rerender(<Appear><Box id="new">new</Box></Appear>)
    expect(container.firstElementChild?.getAttribute('data-exit')).toBe('{"opacity":0}')
    expect(JSON.parse(container.firstElementChild!.getAttribute('data-transition')!).delay).toBeGreaterThanOrEqual(LAYOUT_T.duration)
    expect(ENTER_DELAY).toBe(LAYOUT_T.duration)
  })
  it('I-20 grouped payload updates preserve instance; scene and group changes remount', () => {
    let mounts = 0
    function Grouped({ payload }: SceneProps<number>) { useEffect(() => { mounts++ }, []); return <Box id="persist">{payload}</Box> }
    function Other({ payload }: SceneProps<number>) { useEffect(() => { mounts++ }, []); return <Box id="persist">{payload}</Box> }
    const grouped = steps.map(step => ({ ...step, Scene: Grouped }))
    const { container, rerender } = render(<Presentation steps={grouped} title="Example" />)
    const entity = container.querySelector('[data-entity-id="persist"]')
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(mounts).toBe(1)
    expect(container.querySelector('[data-entity-id="persist"]')).toBe(entity)
    expect(entity?.textContent).toBe('2')
    expect(entity?.closest('[data-presentation-appear]')).toBeNull()
    rerender(<Presentation steps={grouped.map(step => ({ ...step, groupKey: 'new' }))} title="Example" />)
    expect(mounts).toBe(2)
    rerender(<Presentation steps={grouped.map(step => ({ ...step, Scene: Other, groupKey: 'new' }))} title="Example" />)
    expect(mounts).toBe(3)
  })
  it('I-21 absolute layers preserve supplied overlapping coordinates and styles', () => {
    const style: CSSProperties = { position: 'absolute', left: 30, top: 40, zIndex: 2 }
    const { container, rerender } = render(<SceneLayer><Box id="overlap" style={style}>one</Box></SceneLayer>)
    expect((container.firstElementChild as HTMLElement).style.position).toBe('absolute')
    const node = container.querySelector('[data-entity-id]') as HTMLElement
    rerender(<SceneLayer><Box id="overlap" style={style}>two</Box></SceneLayer>)
    expect(node.style.left).toBe('30px')
    expect(node.style.top).toBe('40px')
    expect(node.style.zIndex).toBe('2')
  })
  it('I-22 primitives forward style, class, data and identity without visual defaults', () => {
    const primitives = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    for (const Primitive of primitives) {
      const { container, unmount } = render(<Primitive id="id" className="local" style={{ left: 20 }} data-custom="yes" data-presentation-allow-overlap="true">content</Primitive>)
      const node = container.firstElementChild as HTMLElement
      expect(node.dataset.entityId).toBe('id')
      expect(node.dataset.presentationNode).toBeTruthy()
      expect(node.className).toBe('local')
      expect(node.getAttribute('data-custom')).toBe('yes')
      expect(node.getAttribute('style')).toBe('left: 20px;')
      expect(node.dataset.presentationAllowOverlap).toBe('true')
      unmount()
    }
  })
  it('I-23 default attribution, styling hook and opt-in host brand', () => {
    const { container, rerender } = render(<Presentation steps={steps} title="Example" />)
    const link = screen.getByText('made by and-scene') as HTMLAnchorElement
    expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.style.right).toBe('24px')
    expect(link.style.bottom).toBe('16px')
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation steps={steps} title="Example" brand={<a href="/">Host</a>} />)
    expect(container.querySelector('[data-presentation-brand]')?.textContent).toBe('Host')
  })
  it('I-24 mode-specific chrome and responsive table of contents', () => {
    viewport(1440)
    const { container } = render(<Presentation steps={steps} title="Example" />)
    expect(container.querySelector('[data-presentation-caption]')).toBeTruthy()
    expect(container.querySelector('[data-presentation-toc]')).toBeTruthy()
    expect(container.querySelectorAll('[data-presentation-progress]')).toHaveLength(3)
    viewport(600)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    fireEvent.click(screen.getByLabelText('Switch to present mode'))
    expect(container.querySelector('[data-presentation-caption]')).toBeNull()
    expect(container.querySelector('[data-presentation-navigation]')).toBeNull()
    expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe('A')
    expect(container.querySelector('[data-presentation-marker]')).toBeTruthy()
  })
  it('I-25 initial modes and runtime toggles preserve active step and grouped scene', () => {
    const { container } = render(<Presentation steps={steps} title="Example" initialMode="present" />)
    expect(root(container).getAttribute('data-presentation-mode')).toBe('present')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    const scene = screen.getByTestId('scene')
    fireEvent.keyDown(window, { key: 'p' })
    expect(root(container).getAttribute('data-step-index')).toBe('1')
    expect(root(container).getAttribute('data-presentation-mode')).toBe('browse')
    expect(screen.getByTestId('scene')).toBe(scene)
  })
  it('I-26 keyboard mappings, focused controls and listener cleanup', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(10))
    for (const key of ['ArrowRight', ' ', 'PageDown']) act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key })))
    expect(result.current.index).toBe(3)
    for (const key of ['ArrowLeft', 'PageUp']) act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key })))
    expect(result.current.index).toBe(1)
    for (const tag of ['button', 'input', 'textarea', 'select', 'a', 'div']) {
      const control = document.createElement(tag)
      if (tag === 'div') control.setAttribute('contenteditable', 'true')
      document.body.append(control)
      expect(isInteractive(control)).toBe(true)
      act(() => control.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
      control.remove()
    }
    expect(result.current.index).toBe(1)
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(remove.mock.calls.map(call => call[0])).toContain('keydown')
  })
  it('I-27 horizontal swipe direction, non-swipes, cancellation and listener cleanup', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(4))
    function touch(type: string, x: number, y: number) {
      const event = new Event(type)
      Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', { value: [{ clientX: x, clientY: y }] })
      act(() => window.dispatchEvent(event))
    }
    touch('touchstart', 100, 50); touch('touchend', 20, 50)
    expect(result.current.index).toBe(1)
    touch('touchstart', 20, 50); touch('touchend', 100, 50)
    expect(result.current.index).toBe(0)
    touch('touchstart', 100, 0); touch('touchend', 20, 200)
    touch('touchstart', 100, 50); touch('touchend', 90, 50)
    expect(result.current.index).toBe(0)
    touch('touchstart', 100, 50); act(() => window.dispatchEvent(new Event('touchcancel'))); touch('touchend', 20, 50)
    expect(result.current.index).toBe(0)
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(remove.mock.calls.map(call => call[0])).toEqual(expect.arrayContaining(['touchstart', 'touchend', 'touchcancel']))
  })
  it('I-28 progress and era jumps expose semantic active state and hooks', () => {
    viewport(1440)
    const { container } = render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByLabelText('Step 3: C'))
    expect(root(container).getAttribute('data-step-index')).toBe('2')
    expect(screen.getByLabelText('Step 3: C').getAttribute('aria-current')).toBe('step')
    expect(screen.getByLabelText('Step 3: C').getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByText('first', { selector: '[data-presentation-toc-entry]' }))
    expect(root(container).getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('first', { selector: '[data-presentation-toc-entry]' }).getAttribute('aria-current')).toBe('step')
  })
  it('I-29 navigation clamps both boundaries without wrapping', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev()); expect(result.current.index).toBe(0)
    act(() => result.current.goTo(99)); expect(result.current.index).toBe(2)
    act(() => result.current.next()); expect(result.current.index).toBe(2)
    act(() => result.current.goTo(-99)); expect(result.current.index).toBe(0)
  })
  it('I-30 uniform fit, fixed canvas, resize updates and listener cleanup', () => {
    expect(fitScale(928, 690, 'browse')).toBe(1)
    expect(fitScale(488, 690, 'browse')).toBe(.5)
    expect(fitScale(928, 500, 'browse')).toBe(.5)
    expect(fitScale(928, 500, 'present')).toBeGreaterThan(.5)
    viewport(488, 690)
    const { container } = render(<Presentation steps={steps} title="Example" />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    expect(canvas.style.transform).toBe('scale(0.5)')
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(canvas.style.transform).toBe('scale(0.5)')
    viewport(928, 690)
    expect(canvas.style.transform).toBe('scale(1)')
    const { unmount } = renderHook(() => useFitScale('browse'))
    const remove = vi.spyOn(window, 'removeEventListener')
    unmount()
    expect(remove.mock.calls.map(call => call[0])).toContain('resize')
  })
})
