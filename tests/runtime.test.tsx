import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import type { HTMLAttributes } from 'react'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { Stage } from '../src/presentation-kit/Stage'
import { ATTRIBUTION_URL, DESIGN_H, DESIGN_W, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { visibleEntities, ENTITIES } from '../src/presentations/how-to-make-a-presentation/entities'
import outline from '../src/presentations/how-to-make-a-presentation/outline.json'
import { presentations } from '../src/presentations'
import { Router } from '../src/Router'

vi.mock('motion/react', async () => {
  const React = await import('react')
  const element = (tag: string) => function MockMotion({ layoutId, layout, initial, animate, exit, transition, ...props }: HTMLAttributes<HTMLElement> & { layoutId?: string; layout?: boolean; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }) {
    return React.createElement(tag, { ...props, 'data-layout-id': layoutId, 'data-layout': String(layout), 'data-initial': JSON.stringify(initial), 'data-animate': JSON.stringify(animate), 'data-exit': JSON.stringify(exit), 'data-transition': JSON.stringify(transition) })
  }
  return { motion: { div: element('div'), svg: element('svg'), path: element('path') }, LayoutGroup: ({ children }: { children: React.ReactNode }) => <div data-layout-group="">{children}</div>, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</> }
})
function Scene({ payload }: SceneProps<string>) { return <Box id="shared" style={{ left: payload === 'a' ? 10 : 50 }}>{payload}</Box> }
const steps: Step<string>[] = [
  { id: 'a', era: 'first', title: 'Alpha', caption: 'Caption A', Scene, groupKey: 'g', payload: 'a' },
  { id: 'b', era: 'first', title: 'Beta', caption: 'Caption B', Scene, groupKey: 'g', payload: 'b' },
  { id: 'c', era: 'second', title: 'Gamma', caption: 'Caption C', Scene, payload: 'c' },
]
const root = () => document.querySelector('[data-presentation-root]')!
const index = () => Number(root().getAttribute('data-step-index'))
const key = (value: string) => fireEvent.keyDown(window, { key: value })
afterEach(() => vi.restoreAllMocks())
describe('scene runtime contracts', () => {
  it('I-1 active scene and narration follow the selected complete step', () => {
    render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByText('Caption A')).toBeTruthy()
    key('ArrowRight')
    expect(screen.getByText('Caption B')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Beta' })).toBeTruthy()
    expect(document.querySelector('[data-presentation-entity="shared"]')?.textContent).toBe('b')
  })
  it('I-2 numbering follows insertion removal and reorder', () => {
    for (const list of [[steps[2], steps[0]], [steps[1]], [steps[1], steps[0], steps[2]]]) {
      const view = render(<Presentation steps={list} title="Order" />)
      expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01')
      expect(document.querySelectorAll('[data-presentation-progress]')).toHaveLength(list.length)
      if (list.length > 1) { key('ArrowRight'); expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('02') }
      view.unmount()
    }
  })
  it('I-4 stable layout identities persist while geometry and labels update', () => {
    const view = render(<Stage step={steps[0]} />)
    const node = document.querySelector('[data-layout-id="shared"]')
    view.rerender(<Stage step={steps[1]} />)
    expect(document.querySelector('[data-layout-id="shared"]')).toBe(node)
    expect(node?.textContent).toBe('b')
    expect((node as HTMLElement).style.left).toBe('50px')
    expect(node?.getAttribute('data-layout')).toBe('true')
    expect(JSON.parse(node!.getAttribute('data-transition')!).layout).toEqual(LAYOUT_T)
    expect(document.querySelector('[data-layout-group]')).toBeTruthy()
  })
  it('I-5 newcomers wait for layout and departures carry exit transitions', () => {
    render(<Appear>New</Appear>)
    const node = document.querySelector('[data-presentation-appear]')!
    expect(JSON.parse(node.getAttribute('data-initial')!)).toEqual({ opacity: 0 })
    expect(JSON.parse(node.getAttribute('data-exit')!)).toEqual({ opacity: 0 })
    expect(ENTER_T.delay).toBeGreaterThanOrEqual(LAYOUT_T.duration)
    expect(JSON.parse(node.getAttribute('data-transition')!)).toEqual(ENTER_T)
  })
  it('I-6 same group and component persist; changed group or component remounts', () => {
    let mounts = 0
    function Counted({ payload }: SceneProps<string>) { useEffect(() => { mounts++ }, []); return <span>{payload}</span> }
    function Other({ payload }: SceneProps<string>) { useEffect(() => { mounts++ }, []); return <span>{payload}</span> }
    const view = render(<Stage step={{ ...steps[0], Scene: Counted }} />)
    view.rerender(<Stage step={{ ...steps[1], Scene: Counted }} />)
    expect(mounts).toBe(1)
    expect(screen.getByText('b')).toBeTruthy()
    view.rerender(<Stage step={{ ...steps[1], Scene: Counted, groupKey: 'other' }} />)
    expect(mounts).toBe(2)
    view.rerender(<Stage step={{ ...steps[1], Scene: Other, groupKey: 'other' }} />)
    expect(mounts).toBe(3)
  })
  it('I-7 intentional stacking survives grouped updates and layers stay absolute', () => {
    function Stacked({ payload }: SceneProps<string>) { return <SceneLayer data-presentation-allow-overlap=""><Box id="stack" style={{ position: 'absolute', left: 40, top: 20, zIndex: 3 }}>{payload}</Box><Box id="under" style={{ position: 'absolute', left: 40, top: 20 }}>under</Box></SceneLayer> }
    const view = render(<Stage step={{ ...steps[0], Scene: Stacked }} />)
    const node = document.querySelector('[data-presentation-entity="stack"]') as HTMLElement
    view.rerender(<Stage step={{ ...steps[1], Scene: Stacked }} />)
    expect(node.style.left).toBe('40px'); expect(node.style.zIndex).toBe('3')
    expect((document.querySelector('[data-presentation-layer]') as HTMLElement).style.position).toBe('absolute')
    expect(node.closest('[data-presentation-allow-overlap]')).toBeTruthy()
  })
  it('I-8 primitives forward stable hooks coordinates styles and custom classes', () => {
    for (const Primitive of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
      const view = render(<Primitive id="entity" className="local" data-custom="yes" style={{ position: 'absolute', left: 61, color: 'red' }}>content</Primitive>)
      const node = view.container.firstElementChild as HTMLElement
      expect(node.className).toBe('local'); expect(node.style.left).toBe('61px'); expect(node.getAttribute('data-custom')).toBe('yes'); expect(node.getAttribute('data-layout-id')).toBe('entity')
      view.unmount()
    }
  })
  it('I-9 unstyled kit supplies no visual fallback treatments', () => {
    render(<><Box id="bare">bare</Box><Presentation steps={steps} title="No style" /></>)
    expect(document.querySelector('[data-presentation-entity="bare"]')?.getAttribute('style')).toBeNull()
    for (const node of document.querySelectorAll<HTMLElement>('[style]')) {
      for (const property of ['color', 'backgroundColor', 'fontFamily', 'border', 'boxShadow']) expect(node.style[property as 'color']).toBe('')
    }
  })
  it('I-10 attribution defaults to the repository with a positioned styling hook', () => {
    render(<Presentation steps={steps} title="Attribution" />)
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe(ATTRIBUTION_URL)
    const aside = document.querySelector('[data-presentation-attribution]') as HTMLElement
    expect(aside.style.right).toBe('20px'); expect(aside.style.bottom).toBe('14px')
  })
  it('I-11 header branding is empty by default and accepts host branding', () => {
    const view = render(<Presentation steps={steps} title="Brand" />)
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    view.rerender(<Presentation steps={steps} title="Brand" brand={<a href="/">Host</a>} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
  })
  it('I-12 present mode exposes marker title and hides reading/navigation chrome', () => {
    render(<Presentation steps={steps} title="Present" initialMode="present" />)
    expect(screen.getByRole('heading', { name: 'Alpha' })).toBeTruthy()
    expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    for (const name of ['caption', 'toc', 'navigation', 'progress', 'prev', 'next']) expect(document.querySelector(`[data-presentation-${name}]`)).toBeNull()
  })
  it('I-13 browse mode exposes reading chrome and omits ToC at narrow widths', () => {
    const view = render(<Presentation steps={steps} title="Browse" />)
    for (const name of ['caption', 'toc', 'navigation', 'progress', 'prev', 'next']) expect(document.querySelector(`[data-presentation-${name}]`)).toBeTruthy()
    view.unmount()
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    render(<Presentation steps={steps} title="Narrow" />)
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })
  it('I-14 initial modes and repeated P/button toggles preserve position', () => {
    render(<Presentation steps={steps} title="Modes" initialMode="present" />)
    key('ArrowRight'); key('p'); expect(index()).toBe(1); expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(index()).toBe(1); expect(root().getAttribute('data-presentation-mode')).toBe('present')
  })
  it('I-15 keyboard next and previous keys advance exactly once', () => {
    const { result } = renderHook(() => usePresentationNav(8))
    for (const value of ['ArrowRight', ' ', 'PageDown']) { const before = result.current.index; act(() => key(value)); expect(result.current.index).toBe(before + 1) }
    for (const value of ['ArrowLeft', 'PageUp']) { const before = result.current.index; act(() => key(value)); expect(result.current.index).toBe(before - 1) }
  })
  it('I-16 touch left/right swipes navigate but vertical and short gestures do not', () => {
    render(<Presentation steps={steps} title="Touch" />)
    const swipe = (x: number, y = 0) => { fireEvent.touchStart(root(), { touches: [{ clientX: 200, clientY: 100 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 200 + x, clientY: 100 + y }] }) }
    swipe(-100); expect(index()).toBe(1); swipe(100); expect(index()).toBe(0)
    swipe(-10); swipe(-100, 200); expect(index()).toBe(0)
  })
  it('I-17 progress jumps to step and ToC jumps to first step in era', () => {
    render(<Presentation steps={steps} title="Jump" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Beta' })); expect(index()).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'second' })); expect(index()).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: 'first' })); expect(index()).toBe(0)
  })
  it('I-18 semantic current state and stable hooks follow jumps and prev/next', () => {
    render(<Presentation steps={steps} title="Active" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Gamma' }))
    for (const name of ['progress', 'toc-entry']) expect(document.querySelector(`[data-presentation-${name}][aria-current="step"]`)?.getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' })); expect(screen.getByRole('button', { name: 'Step 2: Beta' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: 'Next step' })); expect(index()).toBe(2)
  })
  it('I-19 interactive targets retain keys and their defaults', () => {
    render(<Presentation steps={steps} title="Focus" brand={<><a href="/">link</a><input aria-label="Input" /><textarea /><select /><details><summary><span>Disclosure</span></summary><p>Details</p></details><div tabIndex={0}>Custom focus target</div><div contentEditable suppressContentEditableWarning>edit</div></>} />)
    const summary = document.querySelector('summary')!
    summary.focus()
    expect(document.activeElement).toBe(summary)
    for (const control of document.querySelectorAll('button,a,input,textarea,select,summary,summary span,[tabindex],[contenteditable]')) for (const value of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
      const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })
      fireEvent(control, event)
      expect(index()).toBe(0); expect(event.defaultPrevented).toBe(false); expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    }
  })
  it('I-20 boundaries clamp for keyboard touch and controls without wrapping', () => {
    render(<Presentation steps={steps} title="Clamp" />)
    key('ArrowLeft'); expect(index()).toBe(0)
    expect((screen.getByRole('button', { name: 'Previous step' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.touchStart(root(), { touches: [{ clientX: 100, clientY: 0 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 300, clientY: 0 }] }); expect(index()).toBe(0)
    key('ArrowRight'); key('ArrowRight'); key('ArrowRight'); expect(index()).toBe(2)
    fireEvent.touchStart(root(), { touches: [{ clientX: 300, clientY: 0 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 100, clientY: 0 }] }); expect(index()).toBe(2)
    expect((screen.getByRole('button', { name: 'Next step' }) as HTMLButtonElement).disabled).toBe(true)
  })
  it('I-21 fixed canvas fits uniformly and disconnects resize observers', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(fitScale(440, 380)).toBe(.5); expect(fitScale(880, 190)).toBe(.5); expect(fitScale(0, 0)).toBe(0)
    const disconnect = vi.fn(), observe = vi.fn()
    class Observer { observe = observe; disconnect = disconnect }
    vi.stubGlobal('ResizeObserver', Observer)
    const view = render(<Presentation steps={steps} title="Fit" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); expect(canvas.style.transform).toContain('scale(')
    const browse = (root() as HTMLElement).style.gridTemplateRows
    key('p'); expect((root() as HTMLElement).style.gridTemplateRows).not.toBe(browse)
    view.unmount(); expect(observe).toHaveBeenCalled(); expect(disconnect).toHaveBeenCalled()
  })
})
describe('sample and routing contracts', () => {
  it('I-31 registry keeps independently loadable presentation entries', async () => {
    const before = [...presentations]
    const extra = { slug: 'another', title: 'Another', load: async () => ({ default: () => <p>Another</p> }) }
    presentations.push(extra)
    expect(presentations.slice(0, -1)).toEqual(before)
    expect((await extra.load()).default).toBeTypeOf('function')
    for (const entry of before) expect((await entry.load()).default).toBeTypeOf('function')
    presentations.pop()
  })
  it('I-32 root and unknown routes list presentations; known routes lazy load', async () => {
    for (const path of ['/', '/unknown']) {
      const view = render(<Router pathname={path} />)
      expect(screen.getByRole('link', { name: /How to Use/ }).getAttribute('href')).toBe('/how-to-make-a-presentation')
      view.unmount()
    }
    render(<Router pathname="/how-to-make-a-presentation" />)
    expect(await screen.findByText('It starts with you, a topic, and mild overconfidence.')).toBeTruthy()
  })
  it('I-38 every generated sample step supplies captions and next/previous behavior', () => {
    render(<Presentation title="Quality" steps={STEPS} />)
    for (let i = 0; i < STEPS.length; i++) {
      expect(screen.getByText(STEPS[i].caption)).toBeTruthy()
      expect(index()).toBe(i)
      if (i < STEPS.length - 1) fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' })); expect(index()).toBe(7)
  })
  it('I-40 sample metadata matches the canonical reference in order', async () => {
    const reference = await import('../scripts/reference.json')
    expect(outline).toEqual(reference.default)
    expect(STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption }))).toEqual(reference.default)
    expect(STEPS).toHaveLength(9)
  })
  it('I-41 ask and gathering introduce the required cumulative elements', () => {
    expect(visibleEntities(1).map(e => e.id)).toEqual(['you', 'prompt'])
    expect(visibleEntities(2).map(e => e.id)).toEqual(expect.arrayContaining(['you', 'prompt', 'skill', 'conversation', 'question']))
    const card = visibleEntities(3).find(e => e.id === 'card-1')!
    expect(card.detail).toBe('title · caption · visual')
    expect(ENTITIES.find(e => e.id === 'morph-1')!.x).toBeGreaterThan(card.x + card.w)
    render(<Stage step={STEPS[2]} />)
    expect(document.querySelector('[data-presentation-entity="how-to:tray"]')).toBeTruthy()
  })
  it('I-42 cards accumulate with docked depth control ghost and unframed tray socket', () => {
    const list = visibleEntities(6), byId = (id: string) => list.find(e => e.id === id)!
    expect(['card-1', 'card-2', 'card-3', 'ghost', 'depth', 'kit'].every(id => list.some(e => e.id === id))).toBe(true)
    expect(byId('depth').x).toBe(byId('you').x)
    expect(byId('kit').y).toBe(byId('tray').y + byId('tray').h)
    expect(byId('tray').kind).toBe('label')
    render(<Stage step={STEPS[5]} />)
    expect(document.querySelector('.entity-ghost')).toBeTruthy()
  })
  it('I-43 build loop and reveal retain pipeline verification edit arc and outer frame', () => {
    const list = visibleEntities(9), byId = (id: string) => list.find(e => e.id === id)!
    expect(byId('verify').y).toBe(byId('card-1').y); expect(byId('verify').x).toBeGreaterThan(byId('card-3').x)
    expect(byId('verify').detail).toBe('build + render'); expect(byId('verify').text).toContain('✓')
    expect(byId('flag').text).toBe('edited'); expect(byId('reveal').kind).toBe('frame')
    render(<Stage step={STEPS[8]} />)
    expect(screen.getByLabelText('Modify connects conversation to edited card')).toBeTruthy()
    expect(document.querySelector('.entity-reveal-label')).toBeTruthy()
  })
  it('I-44 all continuing sample entities retain DOM identity and coordinates through nine grouped beats', () => {
    const view = render(<Stage step={STEPS[0]} />)
    const seen = new Map<string, Element>()
    for (const step of STEPS) {
      view.rerender(<Stage step={step} />)
      for (const entity of visibleEntities(step.payload.beat)) {
        const node = document.querySelector(`[data-presentation-entity="how-to:${entity.id}"]`)!
        if (seen.has(entity.id)) expect(node).toBe(seen.get(entity.id))
        seen.set(entity.id, node)
        expect((node.parentElement as HTMLElement).style.left).toBe(`${entity.x}px`)
        expect((node.parentElement as HTMLElement).style.top).toBe(`${entity.y}px`)
      }
    }
  })
  it('I-46 count and index hooks enumerate active steps', () => {
    render(<Presentation title="Hooks" steps={steps} />)
    expect(root().getAttribute('data-step-count')).toBe('3')
    for (let i = 0; i < 3; i++) { expect(index()).toBe(i); key('ArrowRight') }
    expect(index()).toBe(2)
  })
})
