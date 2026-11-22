import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEffect, useState } from 'react'
import { Presentation } from '../../src/presentation-kit/Presentation'
import { sceneKey, Stage } from '../../src/presentation-kit/Stage'
import { clampIndex, usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../../src/presentation-kit/constants'
import { eraEntries } from '../../src/presentation-kit/chrome/Toc'
import type { SceneProps, Step } from '../../src/presentation-kit/types'
function Scene({ payload }: SceneProps<number>) { return <div data-testid="payload">{payload}</div> }
const steps: Step<number>[] = [1, 2, 3].map((n, i) => ({ id: `id-${n}`, era: i < 2 ? 'start' : 'end', title: `Title ${n}`, caption: `Caption ${n}. More context.`, Scene, payload: n, groupKey: 'same' }))
function key(key: string, target: Window | Element = window) { fireEvent.keyDown(target, { key }) }
function resize(width: number, height = 900) { act(() => { Object.defineProperty(window, 'innerWidth', { value: width, configurable: true }); Object.defineProperty(window, 'innerHeight', { value: height, configurable: true }); window.dispatchEvent(new Event('resize')) }) }
describe('step contract and grouped host', () => {
  it('I-16 narration, active state and order-derived numbering survive insertion removal and reorder', async () => {
    const view = render(<Presentation steps={steps} title="Story" />)
    expect(screen.getByRole('heading')).toHaveTextContent('Title 1')
    expect(screen.getByText('Caption 1. More context.')).toBeVisible()
    expect(screen.getByTestId('payload')).toHaveTextContent('1')
    for (const reordered of [[{ ...steps[2], id: 'new' }, ...steps], [steps[1], steps[0]], [steps[2], steps[1], steps[0]]]) {
      view.rerender(<Presentation steps={reordered} title="Story" />)
      expect(document.querySelector('[data-presentation-marker]')).toHaveTextContent(`01 / ${reordered[0].era}`)
      await waitFor(() => expect(screen.getAllByTestId('payload')).toHaveLength(1))
      expect(screen.getByTestId('payload')).toHaveTextContent(String(reordered[0].payload))
      expect(screen.getByLabelText(`Step 1: ${reordered[0].title}`)).toHaveAttribute('aria-current', 'step')
    }
  })
  it('I-19 preserves mount and local state within a group; replaces scene across group/component changes', () => {
    let mounts = 0
    function Counter({ payload }: SceneProps<number>) {
      const [local, setLocal] = useState(0)
      useEffect(() => { mounts++ }, [])
      return <button onClick={() => setLocal(i => i + 1)}>local {local} payload {payload}</button>
    }
    const grouped = steps.map(s => ({ ...s, Scene: Counter }))
    const view = render(<Stage steps={grouped} index={0} mode="browse" />)
    fireEvent.click(screen.getByText('local 0 payload 1'))
    view.rerender(<Stage steps={grouped} index={1} mode="browse" />)
    expect(screen.getByText('local 1 payload 2')).toBeInTheDocument()
    expect(mounts).toBe(1)
    const different = grouped.map((s, i) => i === 2 ? { ...s, groupKey: 'other' } : s)
    view.rerender(<Stage steps={different} index={2} mode="browse" />)
    expect(screen.getByText('local 0 payload 3')).toBeInTheDocument()
    expect(mounts).toBe(2)
    function Other({ payload }: SceneProps<number>) {
      const [local] = useState(100)
      useEffect(() => { mounts++ }, [])
      return <span>other {local} payload {payload}</span>
    }
    view.rerender(<Stage steps={different.map((s, i) => i === 2 ? { ...s, Scene: Other } : s)} index={2} mode="browse" />)
    expect(screen.getByText('other 100 payload 3')).toBeInTheDocument()
    expect(mounts).toBe(3)
    expect(sceneKey(steps, 1)).toBe('id-1')
    expect(sceneKey([{ ...steps[0], Scene: Counter }, steps[1]], 1)).toBe('id-2')
    expect(sceneKey([steps[0], { ...steps[1], groupKey: undefined }], 1)).toBe('id-2')
  })
  it('rejects an empty presentation explicitly', () => { expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step') })
})
describe('modes and chrome', () => {
  it('I-22 default attribution and optional header brand', () => {
    const view = render(<Presentation steps={steps} title="Story" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    expect(link.parentElement).toHaveAttribute('data-presentation-attribution')
    expect(link.parentElement).toHaveStyle({ position: 'absolute', right: '16px', bottom: '12px' })
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    view.rerender(<Presentation steps={steps} title="Story" brand={<a href="/">Host</a>} />)
    expect(screen.getByRole('link', { name: 'Host' }).parentElement).toHaveAttribute('data-presentation-brand')
  })
  it('I-23 browse shows narration and wide ToC; present hides reading chrome', () => {
    resize(1440)
    render(<Presentation steps={steps} title="Story" />)
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeInTheDocument()
    expect(screen.getByText(steps[0].caption)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Switch to present mode'))
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByText(steps[0].caption)).toBeNull()
    expect(screen.getByRole('heading')).toHaveTextContent('Title 1')
    expect(screen.getByRole('heading')).toHaveStyle({ whiteSpace: 'nowrap' })
    fireEvent.click(screen.getByLabelText('Switch to browse mode'))
    resize(390)
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    resize(1440)
  })
  it('I-24 initial mode and P toggle preserve current index and switch stage geometry', () => {
    const { container } = render(<Presentation steps={steps} title="Story" initialMode="present" />)
    expect(container.querySelector('[data-presentation]')).toHaveAttribute('data-presentation-mode', 'present')
    key('ArrowRight'); key('p')
    expect(container.querySelector('[data-presentation]')).toHaveAttribute('data-step-index', '1')
    expect(container.querySelector('[data-presentation]')).toHaveAttribute('data-presentation-mode', 'browse')
    expect(container.querySelector('[data-presentation-stage]')).toHaveStyle({ top: `${STAGE_LAYOUT.browse.top}px` })
    key('P')
    expect(container.querySelector('[data-presentation-stage]')).toHaveStyle({ top: `${STAGE_LAYOUT.present.top}px` })
    expect(screen.getByRole('heading')).toHaveTextContent('Title 2')
  })
  it('I-27 direct controls and first-era jumps; I-28 semantic current hooks', () => {
    resize(1440)
    render(<Presentation steps={steps} title="Story" />)
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(screen.getByLabelText('Step 2: Title 2')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByLabelText('Step 2: Title 2')).toHaveAttribute('data-presentation-active', 'true')
    expect(screen.getByLabelText('Step 1: Title 1')).not.toHaveAttribute('aria-current')
    fireEvent.click(screen.getByRole('button', { name: 'end', exact: true }))
    expect(screen.getByRole('button', { name: 'end', exact: true })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByLabelText('Next step')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'start', exact: true }))
    expect(screen.getByLabelText('Previous step')).toBeDisabled()
    fireEvent.click(screen.getByLabelText('Step 3: Title 3'))
    fireEvent.click(screen.getByLabelText('Previous step'))
    expect(document.querySelector('[data-presentation]')).toHaveAttribute('data-step-index', '1')
    expect(eraEntries(steps)).toEqual([{ era: 'start', index: 0 }, { era: 'end', index: 2 }])
  })
})
describe('navigation', () => {
  it('I-25 every keyboard alias and listener cleanup', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const hook = renderHook(() => usePresentationNav(10))
    for (const name of ['ArrowRight', ' ', 'PageDown']) act(() => key(name))
    expect(hook.result.current.index).toBe(3)
    for (const name of ['ArrowLeft', 'PageUp']) act(() => key(name))
    expect(hook.result.current.index).toBe(1)
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    expect(hook.result.current.index).toBe(1)
    hook.unmount()
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
  it.each(['button', 'a', 'input', 'select', 'textarea', 'editable', 'role'])('I-25 focused %s keeps its keys', tag => {
    render(<><Presentation steps={steps} title="Story" />{tag === 'editable' ? <div contentEditable data-testid="control"><span>edit</span></div> : tag === 'role' ? <div role="slider" tabIndex={0} data-testid="control" /> : <div data-testid="control">{tag === 'a' ? <a href="#">control</a> : tag === 'button' ? <button>control</button> : tag === 'input' ? <input /> : tag === 'select' ? <select /> : <textarea />}</div>}</>)
    const holder = screen.getByTestId('control')
    const control = holder.firstElementChild || holder
    for (const k of ['ArrowRight', ' ', 'PageDown', 'p']) key(k, control)
    expect(document.querySelector('[data-presentation]')).toHaveAttribute('data-step-index', '0')
    expect(document.querySelector('[data-presentation]')).toHaveAttribute('data-presentation-mode', 'browse')
  })
  it('I-26 swipes left/right; rejects vertical, small, control, and multi-touch gestures', () => {
    const { container } = render(<Presentation steps={steps} title="Story" />)
    const host = container.querySelector('[data-presentation]')!
    const swipe = (x: number, y: number, target = host, fingers = 1) => {
      fireEvent.touchStart(target, { touches: Array.from({ length: fingers }, () => ({ clientX: 100, clientY: 100 })) })
      fireEvent.touchEnd(target, { changedTouches: [{ clientX: x, clientY: y }] })
    }
    swipe(20, 105); expect(host).toHaveAttribute('data-step-index', '1')
    swipe(180, 105); expect(host).toHaveAttribute('data-step-index', '0')
    swipe(20, 300); swipe(90, 101); swipe(20, 105, screen.getByLabelText('Next step')); swipe(20, 105, host, 2)
    expect(host).toHaveAttribute('data-step-index', '0')
  })
  it('I-29 repeated navigation and direct jumps clamp at both ends', () => {
    const hook = renderHook(() => usePresentationNav(3))
    act(() => { hook.result.current.prev(); hook.result.current.prev() })
    expect(hook.result.current.index).toBe(0)
    act(() => { for (let i = 0; i < 10; i++) hook.result.current.next() })
    expect(hook.result.current.index).toBe(2)
    act(() => hook.result.current.jump(-100)); expect(hook.result.current.index).toBe(0)
    act(() => hook.result.current.jump(100)); expect(hook.result.current.index).toBe(2)
    expect(clampIndex(-5, 3)).toBe(0)
  })
})
describe('fixed canvas', () => {
  it('I-30 uniform fit across wide narrow short and per-mode geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) for (const [width, height] of [[1440, 900], [390, 844], [800, 400], [120, 140]]) {
      const scale = fitScale(width, height, mode)
      expect(scale).toBeGreaterThanOrEqual(0)
      expect(scale * DESIGN_W).toBeLessThanOrEqual(Math.max(0, width - 48))
      expect(scale * DESIGN_H).toBeLessThanOrEqual(Math.max(0, height - STAGE_LAYOUT[mode].top - STAGE_LAYOUT[mode].bottom))
    }
    expect(fitScale(1440, 700, 'present')).toBeGreaterThan(fitScale(1440, 700, 'browse'))
  })
  it('I-30 resize updates scale, steps do not; transform is uniform and cleanup removes resize listener', () => {
    resize(1440)
    const remove = vi.spyOn(window, 'removeEventListener')
    const hook = renderHook(() => useFitScale('browse'))
    const view = render(<Presentation steps={steps} title="Story" />)
    const canvas = view.container.querySelector('[data-presentation-canvas]')!
    expect(canvas).toHaveStyle({ width: '880px', height: '380px', transform: `scale(${hook.result.current})` })
    const before = canvas.getAttribute('data-scale')
    key('ArrowRight'); expect(canvas).toHaveAttribute('data-scale', before!)
    resize(390)
    expect(canvas).not.toHaveAttribute('data-scale', before!)
    expect(canvas).toHaveStyle({ transform: `scale(${hook.result.current})` })
    hook.unmount(); view.unmount()
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    resize(1440)
  })
})
