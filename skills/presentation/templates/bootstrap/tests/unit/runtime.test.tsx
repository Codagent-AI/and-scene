import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from '../../src/presentation-kit/Presentation'
import { Stage } from '../../src/presentation-kit/Stage'
import { validateSteps } from '../../src/presentation-kit/types'
import type { Step, SceneProps } from '../../src/presentation-kit/types'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../../src/presentation-kit/useFitScale'
import { Box } from '../../src/presentation-kit/nodes/Box'
import { SceneLayer } from '../../src/presentation-kit/nodes/SceneLayer'
import { ENTER_DELAY, ENTER_T, LAYOUT_T, DESIGN_W, DESIGN_H } from '../../src/presentation-kit/constants'
function Scene({ payload }: SceneProps<{ text: string }>) { return <Box id="test:stable" className="custom" style={{ left: 30 }} data-custom="yes">{payload.text}</Box> }
const steps: Step<{ text: string }>[] = [0, 1, 2].map(i => ({ id: `s${i}`, era: i < 2 ? 'start' : 'end', title: `Title ${i}`, caption: `Paragraph ${i}.`, Scene, groupKey: 'shared', payload: { text: `State ${i}` } }))
describe('step contract', () => {
  it('I-1 validates narration and rejects empty, duplicate, or missing metadata', () => {
    expect(() => validateSteps(steps)).not.toThrow()
    expect(() => validateSteps([])).toThrow('at least one')
    expect(() => validateSteps([steps[0], steps[0]])).toThrow('Duplicate')
    for (const key of ['id', 'era', 'title', 'caption']) expect(() => validateSteps([{ ...steps[0], [key]: ' ' }])).toThrow(`Missing step ${key}`)
    render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByText('State 0')).toBeInTheDocument()
  })
  it('I-2 derives numbering after insert remove and reorder', () => {
    const { rerender, container } = render(<Presentation steps={steps} title="Test" />)
    const changed = [steps[2], { ...steps[1], id: 'inserted' }, steps[0]]
    rerender(<Presentation steps={changed} title="Test" />)
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('01 / 03')
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('02 / 03')
    rerender(<Presentation steps={[changed[0], changed[2]]} title="Test" />)
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('02 / 02')
    expect(container.querySelector('[data-step-id]')).toHaveAttribute('data-step-id', 's0')
  })
  it('I-6 persists grouped scenes and replaces changed component or group', async () => {
    const mount = vi.fn(), unmount = vi.fn()
    function Counting({ payload }: SceneProps<{ text: string }>) { useEffect(() => { mount(); return unmount }, []); return <div>{payload.text}</div> }
    const first = { ...steps[0], Scene: Counting }
    const { rerender } = render(<Stage step={first} />)
    rerender(<Stage step={{ ...first, id: 'next', payload: { text: 'updated' } }} />)
    expect(mount).toHaveBeenCalledTimes(1); expect(screen.getByText('updated')).toBeInTheDocument()
    rerender(<Stage step={{ ...first, Scene }} />)
    await waitFor(() => expect(unmount).toHaveBeenCalledTimes(1))
    rerender(<Stage step={{ ...first, groupKey: 'other' }} />)
    expect(mount).toHaveBeenCalledTimes(2)
  })
  it('I-7 keeps continuing entity DOM identity while updating label', () => {
    const { container, rerender } = render(<Stage step={steps[0]} />)
    const node = container.querySelector('[data-presentation-entity]')
    rerender(<Stage step={steps[1]} />)
    expect(container.querySelector('[data-presentation-entity]')).toBe(node)
    expect(node).toHaveTextContent('State 1')
    expect(node?.closest('[data-presentation-appear]')).toBeNull()
  })
  it('I-8 forwards primitive class data and coordinate styles without visual defaults', () => {
    const { container } = render(<SceneLayer><Scene payload={{ text: 'custom' }} /></SceneLayer>)
    const node = container.querySelector('[data-presentation-entity]')!
    expect(node).toHaveClass('custom'); expect(node).toHaveAttribute('data-custom', 'yes'); expect(node).toHaveStyle({ left: '30px' })
    expect(node.getAttribute('style')).not.toMatch(/color|background|border|font|shadow/)
    expect(container.querySelector('[data-presentation-layer]')).toHaveStyle({ position: 'absolute', inset: '0' })
  })
  it('I-5 sequences entrants after layout and exits without enter delay', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration)
    expect(ENTER_T.delay).toBe(ENTER_DELAY)
    expect(ENTER_T.duration).toBeGreaterThan(0)
  })
})
describe('chrome', () => {
  it('I-9 defaults attribution and supports explicit host branding and override', () => {
    const { container, rerender } = render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    expect(container.querySelector('[data-presentation-attribution]')).toHaveStyle({ position: 'absolute', right: '0px', bottom: '0px' })
    expect(container.querySelector('[data-presentation-brand]')).toBeEmptyDOMElement()
    rerender(<Presentation steps={steps} title="Test" brand={<a href="/">Host</a>} attribution={false} />)
    expect(screen.getByText('Host')).toBeInTheDocument(); expect(screen.queryByText('made by and-scene')).toBeNull()
    rerender(<Presentation steps={steps} title="Test" attribution={{ label: 'Custom credit', href: 'https://example.com' }} />)
    expect(screen.getByText('Custom credit')).toHaveAttribute('href', 'https://example.com')
  })
  it('I-10 present mode is title-focused and hides reading controls', () => {
    const { container } = render(<Presentation steps={steps} title="Test" initialMode="present" />)
    expect(screen.getByRole('heading', { name: 'Title 0' })).toBeInTheDocument()
    for (const hook of ['caption', 'toc', 'navigation', 'progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    expect(container.querySelector('[data-presentation-marker]')).toHaveTextContent('01 / 03')
  })
  it('I-11 browse mode shows reading controls and hides ToC at narrow widths', () => {
    vi.stubGlobal('innerWidth', 1440)
    const { container } = render(<Presentation steps={steps} title="Test" />)
    for (const hook of ['title', 'caption', 'toc', 'navigation', 'progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).not.toBeNull()
    expect(screen.getByText('Paragraph 0.')).toBeInTheDocument()
    act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) })
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    window.innerWidth = 1440
  })
  it('I-12 toggles from either initial mode while preserving position', () => {
    const { container } = render(<Presentation steps={steps} title="Test" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' }); fireEvent.keyDown(window, { key: 'p' })
    expect(container.querySelector('main')).toHaveAttribute('data-presentation-mode', 'present')
    expect(container.querySelector('main')).toHaveAttribute('data-step-index', '1')
    fireEvent.click(screen.getByLabelText('Switch to browse mode'))
    expect(container.querySelector('main')).toHaveAttribute('data-presentation-mode', 'browse')
    expect(container.querySelector('main')).toHaveAttribute('data-step-index', '1')
  })
  it('I-15 direct jumps and I-16 active semantics agree for steps and eras', () => {
    window.innerWidth = 1440
    const { container } = render(<Presentation steps={steps} title="Test" />)
    fireEvent.click(screen.getByLabelText('Step 3: Title 2'))
    expect(screen.getByLabelText('Step 3: Title 2')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'end' })).toHaveAttribute('data-presentation-active', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'start' }))
    expect(container.querySelector('main')).toHaveAttribute('data-step-index', '0')
    expect(screen.getByLabelText('Step 1: Title 0')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByLabelText('Step 3: Title 2')).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'end' })).toHaveAttribute('data-presentation-active', 'false')
  })
})
describe('navigation', () => {
  it.each(['ArrowRight', ' ', 'PageDown'])('I-13 advances exactly once with %s', key => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key })) })
    expect(result.current.index).toBe(1)
  })
  it.each(['ArrowLeft', 'PageUp'])('I-13 reverses exactly once with %s', key => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.jump(2)); act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key })) })
    expect(result.current.index).toBe(1)
  })
  it('I-14 swipes horizontally and ignores short vertical cancelled and control gestures', () => {
    const { container } = render(<Presentation steps={steps} title="Test" />)
    const root = container.querySelector('main')!
    const swipe = (dx: number, dy = 0, target = root) => {
      fireEvent.touchStart(target, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchEnd(target, { changedTouches: [{ clientX: 100 + dx, clientY: 100 + dy }] })
    }
    swipe(80); expect(root).toHaveAttribute('data-step-index', '0')
    swipe(-80); expect(root).toHaveAttribute('data-step-index', '1')
    swipe(80); expect(root).toHaveAttribute('data-step-index', '0')
    swipe(-10); swipe(-80, 120); swipe(-80, 0, screen.getByLabelText('Next step'))
    fireEvent.touchStart(root, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchCancel(root); fireEvent.touchEnd(root, { changedTouches: [{ clientX: 0, clientY: 100 }] })
    expect(root).toHaveAttribute('data-step-index', '0')
    swipe(-80); swipe(-80); swipe(-80); expect(root).toHaveAttribute('data-step-index', '2')
  })
  it('I-17 interactive nested controls and editable content keep their keys', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    const { container } = render(<div><button><span>Control</span></button><input /><textarea /><select /><a href="#">link</a><div contentEditable suppressContentEditableWarning>edit</div><div role="slider" /><div role="combobox" /><div tabIndex={0} /></div>)
    for (const target of container.querySelectorAll('span,input,textarea,select,a,[contenteditable],[role],[tabindex]')) for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) fireEvent.keyDown(target, { key })
    expect(result.current.index).toBe(0); expect(result.current.mode).toBe('browse')
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true }); expect(result.current.index).toBe(0)
  })
  it('I-18 clamps next prev jump keys and swipe at both ends', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev()); expect(result.current.index).toBe(0)
    act(() => result.current.jump(-20)); expect(result.current.index).toBe(0)
    act(() => result.current.jump(50)); expect(result.current.index).toBe(2)
    act(() => result.current.next()); expect(result.current.index).toBe(2)
    fireEvent.keyDown(window, { key: 'ArrowRight' }); expect(result.current.index).toBe(2)
    act(() => result.current.jump(0)); fireEvent.keyDown(window, { key: 'ArrowLeft' }); expect(result.current.index).toBe(0)
  })
})
describe('scaling', () => {
  it('I-19 fits a fixed 880 by 380 canvas uniformly at all bounds', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(fitScale(880, 380)).toBe(1); expect(fitScale(440, 760)).toBe(.5)
    expect(fitScale(1760, 190)).toBe(.5); expect(fitScale(0, 0)).toBe(0)
    expect(fitScale(-1, 100)).toBe(0)
    const { container } = render(<Stage step={steps[0]} />)
    expect(container.querySelector('[data-presentation-canvas]')).toHaveStyle({ width: '880px', height: '380px' })
  })
  it('I-19 observes resizes and disconnects on cleanup', () => {
    const disconnect = vi.fn(), observe = vi.fn()
    let measure = () => {}
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { measure = callback } observe = observe; disconnect = disconnect })
    function Fit() { const { ref, scale } = useFitScale(); return <div ref={ref} data-testid="fit" data-scale={scale} /> }
    const { unmount } = render(<Fit />); expect(observe).toHaveBeenCalledTimes(1)
    const node = screen.getByTestId('fit')
    Object.defineProperties(node, { clientWidth: { value: 440, configurable: true }, clientHeight: { value: 380 } })
    act(() => measure()); expect(node).toHaveAttribute('data-scale', '0.5')
    Object.defineProperty(node, 'clientWidth', { value: 880 }); act(() => measure())
    expect(node).toHaveAttribute('data-scale', '1')
    unmount(); expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
