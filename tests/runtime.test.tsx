import { useEffect } from 'react'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, DEFAULT_ATTRIBUTION_URL, DESIGN_H, DESIGN_W } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { fitGeometry } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { Router } from '../src/Router'
import Landing from '../src/Landing'
import { presentations } from '../src/presentations'

function Scene({ payload }: SceneProps<{ text: string }>) { return <Box id="fixture:stable">{payload.text}</Box> }
const steps: Step<{ text: string }>[] = ['first', 'second', 'third'].map((id, i) => ({ id, era: i < 2 ? 'start' : 'finish', title: id, caption: `Caption ${id}`, Scene, groupKey: 'same', payload: { text: id } }))
const root = () => document.querySelector('[data-presentation]')!
const index = () => Number(root().getAttribute('data-step-index'))
const key = (value: string, target: Element | Window = window) => fireEvent.keyDown(target, { key: value })

describe('runtime contracts', () => {
  it('I-1 metadata state and order-derived numbering', () => {
    const view = render(<Presentation steps={[steps[2], steps[0]]} title="Fixture" />)
    expect(root().getAttribute('data-step-count')).toBe('2')
    expect(screen.getByRole('heading').textContent).toBe('third')
    expect(screen.getByText('Caption third')).toBeTruthy()
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / finish')
    key('ArrowRight')
    expect(screen.getByRole('heading').textContent).toBe('first')
    expect(root().getAttribute('data-presentation-step-id')).toBe('first')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('02 / start')
    view.rerender(<Presentation steps={[steps[0]]} title="Fixture" />)
    expect(index()).toBe(0)
    expect(root().getAttribute('data-step-count')).toBe('1')
  })
  it('I-4 grouped scene persists payload and changed component remounts', async () => {
    let mounts = 0, unmounts = 0
    function Counted({ payload }: SceneProps<{ text: string }>) { useEffect(() => { mounts++; return () => { unmounts++ } }, []); return <span data-testid="payload">{payload.text}</span> }
    function Other() { return <span>other scene</span> }
    const fixture = steps.map(step => ({ ...step, Scene: Counted }))
    const view = render(<Presentation steps={fixture} title="Fixture" />)
    const instance = screen.getByTestId('payload')
    key('ArrowRight')
    expect(screen.getByTestId('payload')).toBe(instance)
    expect(instance.textContent).toBe('second')
    expect(mounts).toBe(1)
    expect(unmounts).toBe(0)
    view.rerender(<Presentation steps={fixture.map(step => ({ ...step, Scene: Other }))} title="Fixture" />)
    await waitFor(() => expect(unmounts).toBe(1))
    expect(screen.getByText('other scene')).toBeTruthy()
    view.unmount()
  })
  it('I-4 changed group mounts a distinct scene', () => {
    let mounts = 0
    function Counted() { useEffect(() => { mounts++ }, []); return <span>scene</span> }
    render(<Presentation steps={steps.map((step, i) => ({ ...step, Scene: Counted, groupKey: String(i) }))} title="Fixture" />)
    key('ArrowRight')
    expect(mounts).toBe(2)
  })
  it('I-5 intentional positioned stacks survive grouped updates', () => {
    function Stack({ payload }: SceneProps<{ text: string }>) { return <SceneLayer><Box id="a" style={{ position: 'absolute', left: 10, top: 10, width: 80 }}>a</Box><Box id="b" data-presentation-allow-overlap="" style={{ position: 'absolute', left: 20, top: 20, width: 80 }}>{payload.text}</Box></SceneLayer> }
    render(<Presentation steps={steps.map(step => ({ ...step, Scene: Stack }))} title="Stack" />)
    const a = document.querySelector('[data-presentation-entity="a"]') as HTMLElement
    key('ArrowRight')
    expect(document.querySelector('[data-presentation-entity="a"]')).toBe(a)
    expect(a.style.left).toBe('10px')
    const b = document.querySelector('[data-presentation-entity="b"]') as HTMLElement
    expect(b.style.left).toBe('20px'); expect(b.textContent).toBe('second')
  })
  it('I-6 primitive hooks forward identity style classes and data', () => {
    render(<>{[Box, Label, Arrow, Frame, Emphasis, SymbolChip].map((Node, i) => <Node key={i} id={`custom:${i}`} className="custom" data-custom="yes" style={{ position: 'absolute', left: i * 10 }}>text</Node>)}</>)
    const nodes = document.querySelectorAll<HTMLElement>('[data-presentation-node]')
    expect(nodes.length).toBe(6)
    nodes.forEach((node, i) => { expect(node.dataset.presentationEntity).toBe(`custom:${i}`); expect(node.dataset.custom).toBe('yes'); expect(node.className).toBe('custom'); expect(node.style.left).toBe(`${i * 10}px`) })
  })
  it('I-7 unstyled primitive has no injected visual defaults', () => {
    render(<Box id="unstyled">plain</Box>)
    const node = document.querySelector<HTMLElement>('[data-presentation-node]')!
    expect(node.getAttribute('class')).toBeNull()
    for (const value of ['color', 'background', 'font', 'border', 'boxShadow', 'padding', 'margin'] as const) expect(node.style[value]).toBe('')
  })
  it('I-8 default attribution and opt-in branding', () => {
    const view = render(<Presentation steps={steps} title="Fixture" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe(DEFAULT_ATTRIBUTION_URL)
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect((link as HTMLElement).style.bottom).toBe('12px')
    expect((link as HTMLElement).style.right).toBe('24px')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    view.rerender(<Presentation steps={steps} title="Fixture" brand={<a href="/">Host brand</a>} attribution={{ href: 'https://example.org', label: 'custom credit' }} />)
    expect(screen.getByRole('link', { name: 'Host brand' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'custom credit' }).getAttribute('href')).toBe('https://example.org')
    view.rerender(<Presentation steps={steps} title="Fixture" attribution={false} />)
    expect(document.querySelector('[data-presentation-attribution]')).toBeNull()
  })
  it('I-9 browse and present expose required chrome at wide and narrow widths', () => {
    vi.stubGlobal('innerWidth', 1440)
    render(<Presentation steps={steps} title="Fixture" />)
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeTruthy()
    expect(document.querySelector('[data-presentation-caption]')).toBeTruthy()
    act(() => { vi.stubGlobal('innerWidth', 390); window.dispatchEvent(new Event('resize')) })
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    key('p')
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
    expect(document.querySelector('[data-presentation-prev]')).toBeNull()
    expect(document.querySelector('[data-presentation-next]')).toBeNull()
    expect(document.querySelector('[data-presentation-progress]')).toBeNull()
    expect(document.querySelector('[data-presentation-title]')?.textContent).toBe('first')
    expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    vi.unstubAllGlobals()
  })
  it('I-10 initial modes and toggles preserve middle step', () => {
    render(<Presentation steps={steps} title="Fixture" initialMode="present" />)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    key('ArrowRight'); key('P')
    expect(index()).toBe(1)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to present mode' }))
    expect(index()).toBe(1)
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
  })
  it('I-11 every navigation key advances exactly once', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const k of ['ArrowRight', ' ', 'PageDown']) act(() => key(k))
    expect(result.current.index).toBe(3)
    for (const k of ['ArrowLeft', 'PageUp']) act(() => key(k))
    expect(result.current.index).toBe(1)
  })
  it('I-11 touch direction threshold dominance and cancellation', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    const swipe = (x: number, y = 0, cancel = false) => act(() => {
      fireEvent.touchStart(window, { touches: [{ clientX: 100, clientY: 100 }] })
      if (cancel) fireEvent.touchCancel(window)
      fireEvent.touchEnd(window, { changedTouches: [{ clientX: 100 + x, clientY: 100 + y }] })
    })
    swipe(-80); expect(result.current.index).toBe(1)
    swipe(80); expect(result.current.index).toBe(0)
    swipe(-20); swipe(-60, 100); swipe(-80, 0, true)
    expect(result.current.index).toBe(0)
  })
  it('I-12 direct progress and era jumps expose semantic active state', () => {
    vi.stubGlobal('innerWidth', 1440)
    render(<Presentation steps={steps} title="Fixture" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: second' }))
    expect(index()).toBe(1)
    expect(screen.getByRole('button', { name: 'Step 2: second' }).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button', { name: 'start', exact: true }).getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'finish', exact: true }))
    expect(index()).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: 'start', exact: true }))
    expect(index()).toBe(0)
    expect(document.querySelectorAll('[data-presentation-progress-entry][aria-current="step"]').length).toBe(1)
    vi.unstubAllGlobals()
  })
  it('I-13 controls retain keys without deck double handling', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const tag of ['button', 'a', 'input', 'textarea', 'select', 'div']) {
      const control = document.createElement(tag)
      if (tag === 'a') control.setAttribute('href', '/')
      if (tag === 'div') control.setAttribute('contenteditable', 'true')
      document.body.append(control)
      for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'P']) act(() => key(k, control))
      expect(result.current.index).toBe(0); expect(result.current.mode).toBe('browse')
      control.remove()
    }
    const ignored = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true })
    act(() => window.dispatchEvent(ignored)); expect(result.current.index).toBe(0)
  })
  it('I-14 first last and single step clamp with disabled controls', () => {
    render(<Presentation steps={[steps[0]]} title="One" />)
    key('ArrowLeft'); key('ArrowRight')
    expect(index()).toBe(0)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Previous step' }).disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Next step' }).disabled).toBe(true)
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => { result.current.prev(); result.current.jump(100); result.current.next() })
    expect(result.current.index).toBe(2)
    act(() => { result.current.jump(-100); result.current.prev() }); expect(result.current.index).toBe(0)
  })
  it('I-15 uniform canvas fit across resize modes and steps', () => {
    for (const mode of ['browse', 'present'] as const) for (const [w, h] of [[1440,900], [390,844], [200,100]]) {
      const fit = fitGeometry(w,h,mode)
      expect(fit.scale * DESIGN_W).toBeLessThanOrEqual(fit.width + .001)
      expect(fit.scale * DESIGN_H).toBeLessThanOrEqual(fit.height + .001)
    }
    render(<Presentation steps={steps} title="Fixture" />)
    const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    const before = canvas.style.transform
    key('ArrowRight'); expect(canvas.style.transform).toBe(before)
    act(() => { vi.stubGlobal('innerWidth', 390); window.dispatchEvent(new Event('resize')) })
    expect(canvas.style.transform).not.toBe(before)
    vi.unstubAllGlobals()
  })
  it('I-22 landing registry and unknown route preserve registered links', async () => {
    const view = render(<Landing />)
    for (const entry of presentations) expect(screen.getByRole('link', { name: new RegExp(entry.title) }).getAttribute('href')).toBe(`/${entry.slug}`)
    view.rerender(<Router path="/unknown" />)
    expect(screen.getByRole('link')).toBeTruthy()
    view.rerender(<Router path="/how-to-make-a-presentation" />)
    expect(await screen.findByRole('heading', { name: 'You have a topic' })).toBeTruthy()
  })
  it('empty steps fail descriptively', () => {
    expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step')
  })
})
