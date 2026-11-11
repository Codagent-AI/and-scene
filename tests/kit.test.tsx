import { useEffect } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { clampIndex, isInteractive, usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../src/presentation-kit/constants'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { eras } from '../src/presentation-kit/chrome/Toc'
import type { SceneProps, Step } from '../src/presentation-kit/types'

// Animation configuration is covered separately in motion.test.tsx. A passthrough
// host isolates React reconciliation, hooks, and chrome from browser animation.
vi.mock('motion/react', async () => {
  const React = await import('react')
  const excluded = new Set(['layout', 'layoutId', 'initial', 'animate', 'exit', 'transition'])
  return {
    motion: { div: React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => React.createElement('div', { ...Object.fromEntries(Object.entries(props).filter(([key]) => !excluded.has(key))), ref })) },
    LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  }
})

function Scene({ payload }: SceneProps<{ value: number }>) { return <div data-testid="scene-state">state {payload.value}</div> }
function makeSteps(): Step<{ value: number }>[] {
  return [0, 1, 2, 3].map(i => ({ id: `beat-${i}`, era: i < 2 ? 'ask' : 'build', title: `Title ${i}`, caption: `Paragraph for step ${i}.`, Scene, payload: { value: i }, groupKey: 'conversation' }))
}
function getRoot(container: HTMLElement) { return container.querySelector('[data-presentation]')! }
const originalSize = { width: window.innerWidth, height: window.innerHeight }
function resize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  fireEvent(window, new Event('resize'))
}
afterEach(() => {
  vi.restoreAllMocks()
  resize(originalSize.width, originalSize.height)
})

describe('I-12 scene-step contract', () => {
  it('selects the active diagram, narration and identity with position-derived numbering after edits', () => {
    const steps = makeSteps()
    const { container, rerender } = render(<Presentation steps={steps} title="Example" />)
    expect(screen.getByTestId('scene-state').textContent).toBe('state 0')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 0')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Paragraph for step 0.')
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / ask')
    expect(getRoot(container).getAttribute('data-step-count')).toBe('4')
    const edited = [steps[3], steps[0], steps[2]]
    rerender(<Presentation steps={edited} title="Example" />)
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / build')
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 3')
    expect(Array.from(container.querySelectorAll('[data-presentation-progress]'), e => e.textContent)).toEqual(['1', '2', '3'])
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Title 0' }))
    expect(getRoot(container).getAttribute('data-step-index')).toBe('1')
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('02 / ask')
    expect(screen.getByTestId('scene-state').textContent).toBe('state 0')
  })
  it('handles an empty step array without mounting a missing scene', () => {
    const { container } = render(<Presentation steps={[]} title="Empty" />)
    expect(container.querySelector('[data-presentation-empty]')?.textContent).toContain('no steps')
    expect(container.querySelector('[data-presentation-stage]')).toBeNull()
  })
})

describe('I-15 grouped-scene persistence', () => {
  it('updates payload in the same instance only when group and scene identity match', () => {
    const mount = vi.fn(), unmount = vi.fn()
    function Tracked({ payload }: SceneProps<number>) {
      useEffect(() => { mount('A'); return () => { unmount('A') } }, [])
      return <output>{payload}</output>
    }
    function Other({ payload }: SceneProps<number>) {
      useEffect(() => { mount('B'); return () => { unmount('B') } }, [])
      return <output>{payload}</output>
    }
    const step: Step<number> = { id: 'one', era: 'ask', title: 'One', caption: 'A paragraph.', Scene: Tracked, payload: 1, groupKey: 'shared' }
    const { container, rerender } = render(<Stage step={step} mode="browse" />)
    const initialHost = container.querySelector('[data-presentation-scene]')
    rerender(<Stage step={{ ...step, id: 'two', payload: 2 }} mode="browse" />)
    expect(mount.mock.calls).toEqual([['A']])
    expect(unmount).not.toHaveBeenCalled()
    expect(container.querySelector('[data-presentation-scene]')).toBe(initialHost)
    expect(screen.getByRole('status').textContent).toBe('2')
    rerender(<Stage step={{ ...step, Scene: Other, payload: 3 }} mode="browse" />)
    expect(mount.mock.calls).toEqual([['A'], ['B']])
    expect(unmount.mock.calls).toEqual([['A']])
    const changedSceneHost = container.querySelector('[data-presentation-scene]')
    expect(changedSceneHost).not.toBe(initialHost)
    rerender(<Stage step={{ ...step, Scene: Other, groupKey: 'another', payload: 4 }} mode="browse" />)
    expect(mount.mock.calls).toEqual([['A'], ['B'], ['B']])
    expect(unmount.mock.calls).toEqual([['A'], ['B']])
    expect(container.querySelector('[data-presentation-scene]')).not.toBe(changedSceneHost)
    rerender(<Stage step={{ ...step, groupKey: undefined, id: 'unshared' }} mode="browse" />)
    rerender(<Stage step={{ ...step, groupKey: undefined, id: 'unshared-next' }} mode="browse" />)
    expect(mount.mock.calls.slice(-2)).toEqual([['A'], ['A']])
  })
})

describe('I-16 primitive styling hooks', () => {
  it('forwards identity, class, data and literal style without supplying visual defaults', () => {
    const components = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    components.forEach((Component, index) => {
      const { container, unmount } = render(<Component id={`entity-${index}`} className="authored" data-author="local" style={{ position: 'absolute', left: 123, top: 45 }}>Text</Component>)
      const node = container.firstElementChild as HTMLElement
      expect(node.getAttribute('data-presentation-entity')).toBe(`entity-${index}`)
      expect(node.getAttribute('data-presentation-node')).toBe(Component.name)
      expect(node.className).toBe('authored')
      expect(node.getAttribute('data-author')).toBe('local')
      expect(node.style.left).toBe('123px')
      expect(node.style.top).toBe('45px')
      expect(node.style.color).toBe('')
      expect(node.style.fontFamily).toBe('')
      expect(node.style.border).toBe('')
      expect(node.style.background).toBe('')
      unmount()
      const plain = render(<Component id="plain">Unstyled</Component>)
      expect(plain.container.firstElementChild?.getAttribute('style')).toBeNull()
      plain.unmount()
    })
  })
  it('forwards layer and appearance hooks while preserving authored overlaps', () => {
    const { container } = render(<SceneLayer className="custom-layer" data-author="layer" style={{ zIndex: 8 }}><Appear className="newcomer" data-author="appear" style={{ position: 'absolute', left: 25, top: 50 }}><Box id="one" style={{ position: 'absolute', left: 0, top: 0 }}>One</Box><Box id="two" style={{ position: 'absolute', left: 0, top: 0 }}>Two</Box></Appear></SceneLayer>)
    const layer = container.querySelector('[data-presentation-layer]') as HTMLElement
    expect(layer.style.position).toBe('absolute')
    expect(layer.style.inset).toBe('0')
    expect(layer.style.zIndex).toBe('8')
    const appear = container.querySelector('[data-presentation-appear]') as HTMLElement
    expect(appear.className).toBe('newcomer')
    expect(appear.getAttribute('data-author')).toBe('appear')
    expect(appear.style.left).toBe('25px')
    const nodes = Array.from(container.querySelectorAll<HTMLElement>('[data-presentation-entity]'))
    expect(nodes.map(node => [node.style.left, node.style.top])).toEqual([['0px', '0px'], ['0px', '0px']])
  })
})

describe('I-17 attribution', () => {
  it('provides bottom-right disclosure with hook and no implicit header brand', () => {
    const { container, rerender } = render(<Presentation steps={makeSteps()} title="Example" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.parentElement?.style.right).toBe('28px')
    expect(link.parentElement?.style.bottom).toBe('22px')
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
    rerender(<Presentation steps={makeSteps()} title="Example" brand={<a href="/">Host brand</a>} />)
    expect(container.querySelector('[data-presentation-brand]')?.textContent).toBe('Host brand')
    rerender(<Presentation steps={makeSteps()} title="Example" attribution={false} />)
    expect(screen.queryByRole('link', { name: 'made by and-scene' })).toBeNull()
  })
})

describe('I-18 mode chrome', () => {
  it('shows reading chrome in browse and only marker/title in present, with responsive contents', () => {
    resize(1440, 900)
    const { container } = render(<Presentation steps={makeSteps()} title="Example" />)
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 0')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Paragraph for step 0.')
    expect(container.querySelector('[data-presentation-toc]')).not.toBeNull()
    expect(container.querySelectorAll('[data-presentation-progress]')).toHaveLength(4)
    expect(screen.getByRole('button', { name: '← Previous' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Next →' })).not.toBeNull()
    resize(390, 844)
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Present' }))
    expect(getRoot(container).getAttribute('data-presentation-mode')).toBe('present')
    expect(container.querySelector('[data-presentation-marker]')).not.toBeNull()
    expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Title 0')
    for (const hook of ['caption', 'toc', 'progress', 'prev', 'next']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
})

describe('I-19 mode position', () => {
  it.each(['browse', 'present'] as const)('opens in %s and P toggles without changing a middle step', initialMode => {
    const { result } = renderHook(() => usePresentationNav(4, initialMode))
    expect(result.current.mode).toBe(initialMode)
    act(() => result.current.go(2))
    fireEvent.keyDown(window, { key: 'p' })
    expect(result.current.index).toBe(2)
    expect(result.current.mode).toBe(initialMode === 'browse' ? 'present' : 'browse')
    fireEvent.keyDown(window, { key: 'P' })
    expect(result.current.mode).toBe(initialMode)
    expect(result.current.index).toBe(2)
  })
})

describe('I-20 keyboard navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('%s advances exactly one step', key => {
    const { result } = renderHook(() => usePresentationNav(8))
    fireEvent.keyDown(window, { key })
    expect(result.current.index).toBe(1)
  })
  it.each(['ArrowLeft', 'PageUp'])('%s retreats exactly one step', key => {
    const { result } = renderHook(() => usePresentationNav(8))
    act(() => result.current.go(4))
    fireEvent.keyDown(window, { key })
    expect(result.current.index).toBe(3)
  })
  it('preserves native and semantic control keys, editable targets, and modified shortcuts', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    const controls = ['button', 'a', 'input', 'textarea', 'select', 'div[contenteditable]', 'div[role=slider]', 'div[role=button]', 'div[role=tab]']
    controls.forEach(selector => {
      const [tag, attribute] = selector.replace(']', '').split('[')
      const control = document.createElement(tag)
      if (attribute) { const [name, value = 'true'] = attribute.split('='); control.setAttribute(name, value) }
      const child = document.createElement('span')
      control.appendChild(child)
      document.body.appendChild(control)
      expect(isInteractive(child)).toBe(true)
      for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) fireEvent.keyDown(child, { key })
      expect(result.current.index).toBe(0)
      expect(result.current.mode).toBe('browse')
      control.remove()
    })
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) fireEvent.keyDown(window, { key: 'ArrowRight', [modifier]: true })
    expect(result.current.index).toBe(0)
    const prevented = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    prevented.preventDefault(); fireEvent(window, prevented)
    expect(result.current.index).toBe(0)
    expect(isInteractive(document.body)).toBe(false)
    expect(isInteractive(null)).toBe(false)
  })
  it('removes keyboard and touch listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const add = vi.spyOn(window, 'addEventListener')
    const { unmount } = renderHook(() => usePresentationNav(4))
    const registrations = add.mock.calls.filter(([name]) => ['keydown', 'touchstart', 'touchend', 'touchcancel'].includes(name))
    unmount()
    for (const [name, handler] of registrations) expect(remove.mock.calls.some(([removedName, removedHandler]) => name === removedName && handler === removedHandler)).toBe(true)
  })
})

describe('I-21 touch navigation', () => {
  function swipe(from: [number, number], to: [number, number], target: EventTarget = window) {
    fireEvent.touchStart(target, { touches: [{ clientX: from[0], clientY: from[1] }] })
    fireEvent.touchEnd(target, { changedTouches: [{ clientX: to[0], clientY: to[1] }] })
  }
  it('moves left to next and right to previous, ignoring short/vertical/cancelled/control gestures', () => {
    const { result } = renderHook(() => usePresentationNav(4))
    swipe([200, 100], [100, 110]); expect(result.current.index).toBe(1)
    swipe([100, 100], [200, 110]); expect(result.current.index).toBe(0)
    swipe([200, 100], [180, 100]); expect(result.current.index).toBe(0)
    swipe([200, 100], [100, 300]); expect(result.current.index).toBe(0)
    fireEvent.touchStart(window, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchCancel(window)
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 100, clientY: 100 }] })
    expect(result.current.index).toBe(0)
    const button = document.createElement('button'); document.body.appendChild(button)
    swipe([200, 100], [100, 100], button)
    expect(result.current.index).toBe(0); button.remove()
    fireEvent.touchStart(window, { touches: [] })
    fireEvent.touchEnd(window, { changedTouches: [] })
    expect(result.current.index).toBe(0)
  })
})

describe('I-22 direct navigation and active state', () => {
  it('jumps progress to steps and contents to era starts with matching semantic/hook state', () => {
    resize(1440, 900)
    const steps = makeSteps()
    expect(eras(steps)).toEqual([{ era: 'ask', index: 0 }, { era: 'build', index: 2 }])
    const { container } = render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 4: Title 3' }))
    expect(getRoot(container).getAttribute('data-step-index')).toBe('3')
    const activeProgress = container.querySelector('[data-presentation-progress][data-active="true"]')
    expect(activeProgress?.getAttribute('aria-current')).toBe('step')
    expect(activeProgress?.textContent).toBe('4')
    const activeToc = container.querySelector('[data-presentation-toc-entry][data-active="true"]')
    expect(activeToc?.textContent).toBe('build')
    expect(activeToc?.getAttribute('aria-current')).toBe('step')
    expect(container.querySelectorAll('[data-presentation-progress][aria-current]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-presentation-toc-entry][aria-current]')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'build' }))
    expect(getRoot(container).getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'ask' }))
    expect(getRoot(container).getAttribute('data-step-index')).toBe('0')
  })
})

describe('I-23 boundaries', () => {
  it('clamps previous/next and direct jumps at both ends without wraparound', () => {
    const { result, rerender } = renderHook(({ count }) => usePresentationNav(count), { initialProps: { count: 3 } })
    act(() => { result.current.prev(); result.current.prev() })
    expect(result.current.index).toBe(0)
    act(() => { for (let i = 0; i < 10; i++) result.current.next() })
    expect(result.current.index).toBe(2)
    act(() => result.current.go(-100)); expect(result.current.index).toBe(0)
    act(() => result.current.go(100)); expect(result.current.index).toBe(2)
    rerender({ count: 1 }); expect(result.current.index).toBe(0)
    expect(clampIndex(8, 0)).toBe(0)
    expect(clampIndex(-8, 3)).toBe(0)
  })
})

describe('I-24 fit scaling', () => {
  it('uniformly fits the default fixed canvas in both modes and custom geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) {
      const layout = STAGE_LAYOUT[mode]
      for (const [width, height] of [[1440, 900], [390, 844], [1024, 480]]) {
        const scale = fitScale(width, height, mode)
        expect(scale * 880).toBeLessThanOrEqual(width - layout.side * 2 + 0.001)
        expect(scale * 380).toBeLessThanOrEqual(height - layout.top - layout.bottom + 0.001)
        expect(scale).toBeGreaterThan(0)
      }
    }
    expect(fitScale(1, 1, 'browse')).toBe(0)
    expect(fitScale(456, 526, 'browse', 400, 200)).toBe(1)
  })
  it('updates on resize, retains scale across steps within a mode, and removes its listener', () => {
    resize(1440, 900)
    const remove = vi.spyOn(window, 'removeEventListener')
    const { result, unmount } = renderHook(() => useFitScale('browse'))
    const before = result.current
    resize(390, 844)
    expect(result.current).toBeLessThan(before)
    expect(result.current).toBe(fitScale(390, 844, 'browse'))
    unmount()
    expect(remove.mock.calls.some(([name]) => name === 'resize')).toBe(true)
    const steps = makeSteps()
    const stage = render(<Stage step={steps[0]} mode="browse" />)
    const canvas = stage.container.querySelector('[data-presentation-stage]') as HTMLElement
    const transform = canvas.style.transform
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    expect(transform).toMatch(/^scale\([\d.]+\)$/)
    stage.rerender(<Stage step={steps[1]} mode="browse" />)
    expect(canvas.style.transform).toBe(transform)
    stage.rerender(<Stage step={steps[1]} mode="present" />)
    expect(canvas.style.transform).toBe(`scale(${fitScale(390, 844, 'present')})`)
  })
})
