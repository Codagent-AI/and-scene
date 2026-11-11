import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useEffect } from 'react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import type { SceneProps, Step } from '../src/presentation-kit/types'

vi.mock('motion/react', async () => {
  const { createElement } = await import('react')
  const Host = ({ children }: { children: import('react').ReactNode }) => children
  return { AnimatePresence: Host, LayoutGroup: Host, motion: { div: (props: Record<string, unknown>) => {
    const { layout, layoutId, initial, animate, exit, transition, ...rest } = props
    return createElement('div', { ...rest, 'data-motion': JSON.stringify({ layout, layoutId, initial, animate, exit, transition }) })
  } } }
})
function Scene({ payload }: SceneProps<{ text: string }>) {
  return <Box id="shared" style={{ position: 'absolute', left: 50, top: 40 }}>{payload.text}</Box>
}
const steps: Step<{ text: string }>[] = ['A', 'B', 'C'].map((text, index) => ({
  id: text, era: index < 2 ? 'start' : 'end', title: `Title ${text}`, caption: `Caption ${text}`,
  Scene, groupKey: 'shared', payload: { text },
}))
const key = (value: string, target: Element | Window = window) => fireEvent.keyDown(target, { key: value })

describe('scene contract', () => {
  it('I-14 renders narration and derives numbering from reordered arrays', () => {
    const view = render(<Presentation steps={[steps[2], steps[0]]} title="Example" />)
    expect(screen.getByRole('heading').textContent).toBe('Title C')
    expect(screen.getByText('Caption C')).toBeTruthy()
    expect(screen.getByText('01 / 02')).toBeTruthy()
    act(() => key('ArrowRight'))
    expect(screen.getByRole('heading').textContent).toBe('Title A')
    expect(screen.getByText('02 / 02')).toBeTruthy()
    view.rerender(<Presentation steps={[steps[0]]} title="Example" />)
    expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('01 / 01')).toBeTruthy()
  })
  it('rejects an empty scene', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step')
    error.mockRestore()
  })
  it('I-16 keeps layout identities and configures delayed entrants and exits', () => {
    const view = render(<><Box id="stable">first</Box><Appear>new</Appear></>)
    const node = view.container.querySelector('[data-entity-id="stable"]')!
    const config = JSON.parse(node.getAttribute('data-motion')!)
    expect(config.layout).toBe(true)
    expect(config.layoutId).toBe('stable')
    expect(config.transition.layout.duration).toBe(LAYOUT_T)
    expect(config.transition.opacity.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(config.exit.opacity).toBe(0)
    const entrant = JSON.parse(view.container.querySelector('[data-presentation-appear]')!.getAttribute('data-motion')!)
    expect(entrant.initial.opacity).toBe(0)
    expect(entrant.transition.delay).toBe(ENTER_DELAY)
    expect(entrant.transition.duration).toBe(ENTER_T)
    view.rerender(<><Box id="stable">changed</Box><Appear>new</Appear></>)
    expect(view.container.querySelector('[data-entity-id="stable"]')).toBe(node)
    expect(node.textContent).toBe('changed')
  })
  it('I-17 preserves grouped instances and remounts changed groups and scenes', () => {
    const mounted = vi.fn()
    const unmounted = vi.fn()
    function Stateful({ payload }: SceneProps<{ text: string }>) {
      useEffect(() => { mounted(); return unmounted }, [])
      return <Box id="keep">{payload.text}</Box>
    }
    const view = render(<Stage step={{ ...steps[0], Scene: Stateful }} mode="browse" />)
    const old = view.container.querySelector('[data-entity-id]')
    view.rerender(<Stage step={{ ...steps[1], Scene: Stateful }} mode="browse" />)
    expect(mounted).toHaveBeenCalledTimes(1)
    expect(unmounted).toHaveBeenCalledTimes(0)
    expect(view.container.querySelector('[data-entity-id]')).toBe(old)
    expect(old?.textContent).toBe('B')
    view.rerender(<Stage step={{ ...steps[1], Scene: Stateful, groupKey: 'other' }} mode="browse" />)
    expect(mounted).toHaveBeenCalledTimes(2)
    expect(unmounted).toHaveBeenCalledTimes(1)
    const previousHost = view.container.querySelector('[data-presentation-scene]')
    view.rerender(<Stage step={{ ...steps[1], groupKey: 'other' }} mode="browse" />)
    expect(unmounted).toHaveBeenCalledTimes(2)
    expect(view.container.querySelector('[data-presentation-scene]')).not.toBe(previousHost)
  })
  it('I-18 and I-19 preserve layers coordinates hooks stacking and author props', () => {
    const components = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    const view = render(<SceneLayer data-testid="layer" style={{ zIndex: 2 }}>{components.map((Node, i) =>
      <Node key={i} id={`node-${i}`} className="authored" data-custom="yes" style={{ left: 8, top: 9, zIndex: 5 }}>text</Node>)}</SceneLayer>)
    const layer = screen.getByTestId('layer')
    expect(layer.style.position).toBe('absolute')
    expect(parseFloat(layer.style.inset)).toBe(0)
    expect(layer.style.zIndex).toBe('2')
    expect(view.container.querySelectorAll('[data-presentation-node]').length).toBe(6)
    view.container.querySelectorAll<HTMLElement>('[data-presentation-node]').forEach(node => {
      expect(node.className).toBe('authored')
      expect(node.dataset.custom).toBe('yes')
      expect(node.style.left).toBe('8px')
      expect(node.style.zIndex).toBe('5')
    })
  })
  it('I-20 leaves primitive visual treatments to the author', () => {
    const view = render(<Box id="unstyled">text</Box>)
    const node = view.container.firstElementChild as HTMLElement
    expect(node.getAttribute('style')).toBeNull()
    expect(node.className).toBe('')
    expect(node.dataset.presentationNode).toBe('box')
  })
})
describe('chrome and input', () => {
  it('I-21 supplies hooked attribution and opt-in branding', () => {
    const view = render(<Presentation steps={steps} title="Example" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.style.right).toBe('32px')
    expect(link.style.bottom).toBe('14px')
    expect(view.container.querySelector('[data-presentation-brand]')).toBeNull()
    view.rerender(<Presentation steps={steps} title="Example" brand={<a href="/">Host</a>} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
  })
  it('I-22 and I-23 honor modes preserve position and show responsive chrome', () => {
    const view = render(<Presentation steps={steps} title="Example" initialMode="present" />)
    expect(view.container.querySelector('[data-presentation-caption]')).toBeNull()
    expect(view.container.querySelector('[data-presentation-toc]')).toBeNull()
    expect(view.container.querySelector('[data-presentation-navigation]')).toBeNull()
    act(() => key('ArrowRight'))
    const node = view.container.querySelector('[data-entity-id]')
    act(() => key('p'))
    expect(screen.getByText('Caption B')).toBeTruthy()
    expect(view.container.querySelector('[data-entity-id]')).toBe(node)
    expect(view.container.querySelector('[data-presentation-toc]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy()
    act(() => { window.innerWidth = 390; fireEvent(window, new Event('resize')) })
    expect(view.container.querySelector('[data-presentation-toc]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle presentation mode' }))
    expect(screen.getByRole('heading').textContent).toBe('Title B')
    act(() => { window.innerWidth = 1024; fireEvent(window, new Event('resize')) })
  })
  it('I-24 handles all navigation keys once and ignores focused controls', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(8))
    for (const value of ['ArrowRight', ' ', 'PageDown']) act(() => key(value))
    expect(result.current.index).toBe(3)
    for (const value of ['ArrowLeft', 'PageUp']) act(() => key(value))
    expect(result.current.index).toBe(1)
    const view = render(<><button>control</button><a href="#">link</a><input /><select /><textarea /><div contentEditable /><div role="slider" /><div role="combobox" tabIndex={0} /><details><summary>Disclosure</summary></details></>)
    for (const control of view.container.querySelectorAll('button,a,input,select,textarea,[contenteditable],[role],summary')) {
      for (const value of ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'p']) act(() => key(value, control))
      expect(result.current.index).toBe(1)
      expect(result.current.mode).toBe('browse')
    }
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true }))
    expect(result.current.index).toBe(1)
    unmount()
    act(() => key('ArrowRight'))
    expect(result.current.index).toBe(1)
  })
  it('I-25 clamps all boundaries and handles directional touch without vertical or tiny gestures', () => {
    const { result } = renderHook(() => usePresentationNav(2))
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    const swipe = (x: number, y = 0) => {
      act(() => result.current.touch.onTouchStart({ target: document.body, touches: [{ clientX: 200, clientY: 200 }] } as never))
      act(() => result.current.touch.onTouchEnd({ changedTouches: [{ clientX: 200 + x, clientY: 200 + y }] } as never))
    }
    swipe(-100); expect(result.current.index).toBe(1)
    swipe(-100); expect(result.current.index).toBe(1)
    swipe(100); expect(result.current.index).toBe(0)
    swipe(100); expect(result.current.index).toBe(0)
    swipe(-20); swipe(-80, 150); expect(result.current.index).toBe(0)
    act(() => result.current.go(99)); expect(result.current.index).toBe(1)
    act(() => result.current.next()); expect(result.current.index).toBe(1)
    act(() => result.current.go(-4)); expect(result.current.index).toBe(0)
  })
  it('I-26 jumps to a step or era start with semantic active hooks', () => {
    const view = render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title C' }))
    expect(screen.getByRole('heading').textContent).toBe('Title C')
    const current = view.container.querySelectorAll('[aria-current="step"]')
    expect(current.length).toBe(2)
    current.forEach(node => expect(node.getAttribute('data-active')).toBe('true'))
    fireEvent.click(screen.getByRole('button', { name: 'start' }))
    expect(screen.getByRole('heading').textContent).toBe('Title A')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading').textContent).toBe('Title B')
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByRole('heading').textContent).toBe('Title A')
  })
})
describe('I-27 fixed canvas scaling', () => {
  it.each([[1440, 900], [390, 844], [800, 350], [0, 0]])('fits both modes at %ix%i', (width, height) => {
    for (const mode of ['browse', 'present'] as const) {
      const scale = fitScale(width, height, mode)
      expect(scale).toBeGreaterThanOrEqual(0)
      expect(DESIGN_W * scale).toBeLessThanOrEqual(width)
      expect(DESIGN_H * scale).toBeLessThanOrEqual(height)
    }
  })
  it('keeps uniform canvas dimensions through step changes and updates on resize', () => {
    const view = render(<Presentation steps={steps} title="Scale" />)
    const canvas = view.container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    const scale = canvas.dataset.scale
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    expect(Number(canvas.style.transform.slice(6, -1))).toBeCloseTo(Number(scale), 4)
    act(() => key('ArrowRight')); expect(canvas.dataset.scale).toBe(scale)
    act(() => { window.innerWidth = 390; fireEvent(window, new Event('resize')) })
    expect(canvas.dataset.scale).not.toBe(scale)
    expect(canvas.style.width).toBe('880px')
    act(() => { window.innerWidth = 1024; fireEvent(window, new Event('resize')) })
  })
})
