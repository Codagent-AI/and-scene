import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import type { SceneProps, Step } from '../src/presentation-kit/types'
import { usePresentationNav, clampIndex, swipeDirection } from '../src/presentation-kit/usePresentationNav'
import { fitGeometry, useFitScale } from '../src/presentation-kit/useFitScale'
import { Router } from '../src/Router'
import { routeFor } from '../src/routes'
import { presentations } from '../src/presentations'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { Circle } from 'lucide-react'
const Scene = ({ payload }: SceneProps<number>) => <div data-testid="payload">{payload}</div>
const steps: Step<number>[] = ['ask', 'ask', 'build'].map((era, i) => ({ id: `id${i}`, era, title: `Title ${i}`, caption: `Caption ${i}`, payload: i, Scene, groupKey: 'shared' }))
const root = () => document.querySelector('[data-presentation-root]')!
const key = (k: string, target: Element | Window = window) => fireEvent.keyDown(target, { key: k })
function viewport(width: number, height = 900) { Object.defineProperties(window, { innerWidth: { value: width, configurable: true }, innerHeight: { value: height, configurable: true } }); fireEvent(window, new Event('resize')) }

describe('runtime contracts', () => {
  it('I-1 narration, identity and order-derived numbering', () => {
    const view = render(<Presentation steps={steps} title="Example" />)
    expect(screen.getByText('Title 0')).toBeInTheDocument(); expect(screen.getByText('Caption 0')).toBeInTheDocument()
    expect(screen.getByTestId('payload')).toHaveTextContent('0')
    view.rerender(<Presentation steps={[steps[2], steps[0]]} title="Example" />)
    expect(screen.getByText('Title 2')).toBeInTheDocument()
    expect(document.querySelector('[data-presentation-marker]')).toHaveTextContent('01 / build')
    expect(root()).toHaveAttribute('data-step-count', '2')
    view.rerender(<Presentation steps={[steps[0]]} title="Example" />)
    expect(root()).toHaveAttribute('data-step-count', '1')
    expect(screen.getByText('Caption 0')).toBeInTheDocument()
  })
  it('I-4 grouped scenes preserve local state and payload; different groups and components replace instances', async () => {
    const mount = vi.fn(), unmount = vi.fn()
    function Persistent({ payload }: SceneProps<number>) { const [token] = useState(() => Math.random()); useEffect(() => { mount(); return unmount }, []); return <div data-testid="persist" data-token={token}>{payload}</div> }
    const step = { ...steps[0], Scene: Persistent }
    const view = render(<Stage step={step} scale={1} />)
    const token = screen.getByTestId('persist').dataset.token
    view.rerender(<Stage step={{ ...step, id: 'next', payload: 9 }} scale={1} />)
    expect(mount).toHaveBeenCalledTimes(1); expect(screen.getByTestId('persist')).toHaveTextContent('9'); expect(screen.getByTestId('persist').dataset.token).toBe(token)
    view.rerender(<Stage step={{ ...step, groupKey: 'other' }} scale={1} />)
    expect(mount).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(unmount).toHaveBeenCalledTimes(1))
    const priorHost = screen.getByTestId('persist').closest('[data-presentation-scene]')
    view.rerender(<Stage step={{ ...step, groupKey: 'other', Scene }} scale={1} />)
    expect(screen.getByTestId('payload').closest('[data-presentation-scene]')).not.toBe(priorHost)
    await waitFor(() => expect(unmount).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('payload')).toBeInTheDocument()
  })
  it('I-6 I-7 primitives forward identity, hooks, glyph, literal coordinates and supply no visual defaults', () => {
    for (const Primitive of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
      const view = render(<Primitive id="stable" className="local" data-custom="yes" style={{ left: 27 }} Icon={Circle}>Text</Primitive>)
      const el = view.container.firstElementChild!
      expect(el).toHaveAttribute('data-presentation-entity', 'stable'); expect(el).toHaveClass('local'); expect(el).toHaveAttribute('data-custom', 'yes'); expect(el).toHaveStyle({ left: '27px' }); expect(el.querySelector('svg')).toBeTruthy()
      for (const property of ['color', 'backgroundColor', 'fontFamily', 'border', 'boxShadow', 'padding', 'margin']) expect((el as HTMLElement).style[property as 'color']).toBe('')
      view.unmount()
    }
    const { container } = render(<SceneLayer style={{ zIndex: 3 }} data-custom="layer" />)
    expect(container.firstChild).toHaveStyle({ position: 'absolute', inset: '0', zIndex: '3' })
  })
  it('I-8 attribution default and explicit host branding', () => {
    const view = render(<Presentation steps={steps} title="Example" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene'); expect(link).toHaveAttribute('data-presentation-attribution')
    expect(link.parentElement).toHaveStyle({ position: 'absolute', bottom: '12px', right: '16px' }); expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    view.rerender(<Presentation steps={steps} title="Example" brand={<a href="/">Host brand</a>} />)
    expect(screen.getByRole('link', { name: 'Host brand' })).toBeInTheDocument()
  })
  it('I-9 I-10 browse and present chrome, initial mode and position preservation', () => {
    viewport(1440)
    const view = render(<Presentation steps={steps} title="Example" />)
    expect(screen.getByText('Caption 0')).toBeInTheDocument(); expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument()
    key('ArrowRight'); key('p')
    expect(root()).toHaveAttribute('data-presentation-mode', 'present'); expect(root()).toHaveAttribute('data-step-index', '1')
    expect(screen.getByText('Title 1')).toBeInTheDocument(); expect(document.querySelector('[data-presentation-caption]')).toBeNull(); expect(screen.queryByRole('navigation')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' })); expect(screen.getByText('Caption 1')).toBeInTheDocument()
    act(() => viewport(400)); expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    view.unmount(); render(<Presentation steps={steps} title="Example" initialMode="present" />); expect(root()).toHaveAttribute('data-presentation-mode', 'present')
  })
  it('I-11 keyboard mappings, control ownership, modifiers and listener cleanup', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(10))
    for (const k of ['ArrowRight', ' ', 'PageDown']) act(() => key(k))
    expect(result.current.index).toBe(3)
    for (const k of ['ArrowLeft', 'PageUp']) act(() => key(k))
    expect(result.current.index).toBe(1)
    for (const tag of ['button', 'a', 'input', 'textarea', 'select', 'summary', 'div']) {
      const el = document.createElement(tag)
      if (tag === 'div') el.contentEditable = 'true'
      if (tag === 'div') el.setAttribute('contenteditable', 'true')
      const child = document.createElement('span'); el.append(child); document.body.append(el)
      act(() => key('ArrowRight', child)); expect(result.current.index).toBe(1)
      el.remove()
    }
    for (const attributes of [{ role: 'listbox' }, { role: 'switch' }, { tabindex: '0' }, { tabindex: '-1' }]) {
      const control = document.createElement('div')
      for (const [name, value] of Object.entries(attributes)) control.setAttribute(name, value)
      document.body.append(control); act(() => key('ArrowRight', control)); expect(result.current.index).toBe(1); control.remove()
    }
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })); expect(result.current.index).toBe(1)
    const remove = vi.spyOn(window, 'removeEventListener'); unmount(); expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function)); remove.mockRestore()
  })
  it('I-12 touch swipe directions, vertical rejection and touch reset', () => {
    render(<Presentation steps={steps} title="Example" />)
    const swipe = (dx: number, dy = 0) => { fireEvent.touchStart(root(), { touches: [{ clientX: 200, clientY: 200 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] }) }
    swipe(-80); expect(root()).toHaveAttribute('data-step-index', '1'); swipe(80); expect(root()).toHaveAttribute('data-step-index', '0'); swipe(-10); swipe(-80, 200); expect(root()).toHaveAttribute('data-step-index', '0')
    fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 0, clientY: 0 }] }); expect(root()).toHaveAttribute('data-step-index', '0')
    expect(swipeDirection(-40, 0)).toBe(1)
  })
  it('I-13 direct jumps and semantic active state', () => {
    viewport(1440); render(<Presentation steps={steps} title="Example" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 2: Title 1' })); expect(root()).toHaveAttribute('data-step-index', '1')
    expect(screen.getByRole('button', { name: 'Step 2: Title 1' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'ask' })).toHaveAttribute('data-presentation-active', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'build' })); expect(root()).toHaveAttribute('data-step-index', '2')
    fireEvent.click(screen.getByRole('button', { name: 'ask' })); expect(root()).toHaveAttribute('data-step-index', '0')
    expect(screen.getByRole('button', { name: 'build' })).not.toHaveAttribute('aria-current')
  })
  it('I-14 boundaries clamp for repeated and direct navigation, including one step', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0)
    act(() => { for (let i = 0; i < 8; i++) result.current.next() }); expect(result.current.index).toBe(2)
    act(() => result.current.go(-100)); expect(result.current.index).toBe(0)
    act(() => result.current.go(100)); expect(result.current.index).toBe(2)
    expect(clampIndex(100, 1)).toBe(0); expect(clampIndex(-1, 1)).toBe(0)
  })
  it('I-15 fixed uniform canvas and fit changes only with viewport/mode', () => {
    for (const mode of ['browse', 'present'] as const) for (const [w, h] of [[1440, 900], [390, 844], [900, 400], [100, 100]]) {
      const fit = fitGeometry(w, h, mode)
      expect(fit.scale).toBeGreaterThanOrEqual(0); expect(880 * fit.scale).toBeLessThanOrEqual(Math.max(0, w - fit.left - fit.right)); expect(380 * fit.scale).toBeLessThanOrEqual(Math.max(0, h - fit.top - fit.bottom))
    }
    viewport(1440); const { result } = renderHook(() => useFitScale('browse'))
    act(() => viewport(390)); expect(result.current.scale).toBeCloseTo(342 / 880)
    render(<Presentation steps={steps} title="Example" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas).toHaveStyle({ width: '880px', height: '380px', transform: `scale(${342 / 880})` })
    const transform = canvas.style.transform; key('ArrowRight'); expect(canvas.style.transform).toBe(transform)
    act(() => viewport(1000)); expect(canvas.style.transform).not.toBe(transform)
  })
  it('I-22 explicit registry routing, root and unknown fallback', async () => {
    expect(routeFor('/missing')).toBeUndefined(); expect(routeFor('/')).toBeUndefined()
    for (const entry of presentations) { expect(routeFor(`/${entry.slug}`)).toBe(entry); expect((await entry.load()).default).toBeTypeOf('function') }
    render(<Router path="/unknown" />); expect(screen.getByRole('link', { name: /Explore the scene/ })).toHaveAttribute('href', '/how-to-make-a-presentation')
  })
})
