import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer } from '../src/presentation-kit/nodes/primitives'
import { usePresentationNav, clamp, swipeDirection } from '../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import type { SceneProps, Step } from '../src/presentation-kit/types'
import { eras } from '../src/presentation-kit/chrome/eras'
const Scene = ({ payload }: SceneProps<number>) => <Box entityId="continuing" style={{ left: payload * 10 }}>{payload}</Box>
const steps: Step<number>[] = [0, 1, 2].map(i => ({ id: `s${i}`, era: i < 2 ? 'start' : 'end', title: `Title ${i}`, caption: `Caption paragraph ${i}.`, Scene, payload: i, groupKey: 'diagram' }))
function present(props: Partial<Parameters<typeof Presentation<number>>[0]> = {}) { return render(<Presentation steps={steps} title="test" {...props} />) }
describe('runtime contracts', () => {
  it('I-4 departing entity remains during exit then leaves the scene', async () => {
    const view = render(<AnimatePresence><Box key="departing" entityId="departing">leaves</Box></AnimatePresence>)
    view.rerender(<AnimatePresence>{null}</AnimatePresence>)
    expect(document.querySelector('[data-presentation-entity="departing"]')).toBeTruthy()
    await waitFor(() => expect(document.querySelector('[data-presentation-entity="departing"]')).toBeNull(), { timeout: 2000 })
  })
  it('I-1 active metadata and diagram follow ordered step state', () => {
    present(); expect(screen.getByRole('heading').textContent).toBe('Title 0'); expect(screen.getByText('Caption paragraph 0.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true })); expect(screen.getByRole('heading').textContent).toBe('Title 1'); expect(document.querySelector('[data-presentation-entity]')?.textContent).toBe('1')
  })
  it('I-2 numbering derives from inserted removed and reordered arrays', () => {
    for (const reordered of [[steps[2], ...steps], [steps[2], steps[0]], [steps[1], steps[0], steps[2]]]) {
      const view = present({ steps: reordered.map((s, i) => ({ ...s, id: `unique${i}` })) }); expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01 /')
      fireEvent.click(screen.getAllByRole('button', { name: /^Step 2:/ })[0]); expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('02 /'); view.unmount()
    }
  })
  it('I-6 grouped instance persists with new payload and remounts when group or Scene changes', async () => {
    const mount = vi.fn(), unmount = vi.fn()
    function Persistent({ payload }: SceneProps<number>) { useEffect(() => { mount(); return unmount }, []); return <div>{payload}</div> }
    function Other() { return <div>other scene</div> }
    const view = render(<Stage step={{ ...steps[0], Scene: Persistent }} mode="browse" />)
    view.rerender(<Stage step={{ ...steps[1], Scene: Persistent }} mode="browse" />)
    expect(mount).toHaveBeenCalledTimes(1); expect(screen.getByText('1')).toBeTruthy()
    view.rerender(<Stage step={{ ...steps[1], Scene: Other }} mode="browse" />); expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(2); await waitFor(() => expect(unmount).toHaveBeenCalledTimes(1))
    view.rerender(<Stage step={{ ...steps[2], Scene: Persistent, groupKey: 'new' }} mode="browse" />); expect(mount).toHaveBeenCalledTimes(2)
  })
  it('I-7 layers preserve author coordinates and stacking without reflow', () => {
    render(<><SceneLayer style={{ zIndex: 3 }}><Box entityId="a" style={{ position: 'absolute', left: 4, top: 8 }}>A</Box></SceneLayer><SceneLayer><Box entityId="b" style={{ position: 'absolute', left: 4, top: 8 }}>B</Box></SceneLayer></>)
    expect((document.querySelector('[data-presentation-layer]') as HTMLElement).style.position).toBe('absolute')
    expect((document.querySelector('[data-presentation-layer]') as HTMLElement).style.zIndex).toBe('3')
    for (const e of document.querySelectorAll<HTMLElement>('[data-presentation-entity]')) expect(e.style.left).toBe('4px')
  })
  it('I-8 primitives forward stable identity author styles classes and data hooks', () => {
    const primitives = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    primitives.forEach((Node, i) => { const view = render(<Node entityId={`e${i}`} className="local" style={{ left: 12 }} data-author="yes">entity</Node>); const node = document.querySelector<HTMLElement>(`[data-presentation-entity="e${i}"]`)!; expect(node.className).toContain('local'); expect(node.style.left).toBe('12px'); expect(node.dataset.author).toBe('yes'); expect(node.dataset.presentationNode).toBeTruthy(); view.unmount() })
  })
  it('I-9 unstyled primitives supply no visual defaults', () => {
    render(<><Box entityId="box">box</Box><Label entityId="label">label</Label><Arrow entityId="arrow">arrow</Arrow><Frame entityId="frame">frame</Frame><Emphasis entityId="emphasis">emphasis</Emphasis><SymbolChip entityId="symbol">symbol</SymbolChip></>)
    for (const node of document.querySelectorAll<HTMLElement>('[data-presentation-node]')) for (const prop of ['color', 'background', 'fontFamily', 'border', 'boxShadow', 'padding', 'margin']) expect(node.style.getPropertyValue(prop.replace(/[A-Z]/g, x => `-${x.toLowerCase()}`))).toBe('')
  })
  it('I-10 attribution defaults to repository link and bottom-right hook while brand is opt-in', () => {
    const view = present(); expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    const attribution = document.querySelector<HTMLElement>('[data-presentation-attribution]')!; expect(attribution.style.right).toBe('24px'); expect(attribution.style.bottom).toBe('16px'); expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    view.rerender(<Presentation steps={steps} title="test" brand={<a href="/">Host</a>} />); expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
  })
  it('I-11 present mode is title-focused and hides reading navigation', () => { present({ initialMode: 'present' }); expect(screen.getByRole('heading').textContent).toBe('Title 0'); expect(document.querySelector('[data-presentation-marker]')).toBeTruthy(); for (const hook of ['caption', 'toc', 'navigation', 'progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull() })
  it('I-12 browse mode exposes caption controls progress and responsive ToC', () => {
    window.innerWidth = 1440; const view = present(); for (const hook of ['caption', 'toc', 'navigation', 'progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
    act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) }); expect(document.querySelector('[data-presentation-toc]')).toBeNull(); view.unmount(); window.innerWidth = 1440
  })
  it('I-13 mode toggles preserve middle step and honor initial mode', () => { present(); fireEvent.click(screen.getByRole('button', { name: 'Step 2: Title 1' })); fireEvent.keyDown(window, { key: 'p' }); expect(document.querySelector('main')?.dataset.presentationMode).toBe('present'); expect(document.querySelector('main')?.dataset.stepIndex).toBe('1'); fireEvent.click(screen.getByRole('button', { name: 'Toggle presentation mode' })); expect(document.querySelector('main')?.dataset.stepIndex).toBe('1'); expect(document.querySelector('main')?.dataset.presentationMode).toBe('browse') })
  it('I-14 each keyboard navigation key changes index exactly once', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    for (const key of ['ArrowRight', ' ', 'PageDown']) { act(() => result.current.go(1)); act(() => fireEvent.keyDown(window, { key })); expect(result.current.index).toBe(2) }
    for (const key of ['ArrowLeft', 'PageUp']) { act(() => result.current.go(2)); act(() => fireEvent.keyDown(window, { key })); expect(result.current.index).toBe(1) }
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })); expect(result.current.index).toBe(1)
  })
  it('I-15 touch swipes navigate and vertical short cancelled gestures do not', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    const swipe = (x: number, y = 0) => { fireEvent.touchStart(window, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(window, { changedTouches: [{ clientX: 100 + x, clientY: 100 + y }] }) }
    act(() => swipe(-70)); expect(result.current.index).toBe(1); act(() => swipe(70)); expect(result.current.index).toBe(0)
    act(() => { swipe(-20); swipe(-60, 100); fireEvent.touchStart(window, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchCancel(window); fireEvent.touchEnd(window, { changedTouches: [{ clientX: 0, clientY: 100 }] }) }); expect(result.current.index).toBe(0)
    expect(swipeDirection(-50, 0)).toBe(1); expect(swipeDirection(50, 0)).toBe(-1)
  })
  it('I-16 direct progress and era jumps choose exact step and first era step', () => {
    window.innerWidth = 1440
    present(); fireEvent.click(screen.getByRole('button', { name: 'Step 2: Title 1' })); expect(document.querySelector('main')?.dataset.stepIndex).toBe('1'); fireEvent.click(screen.getByRole('button', { name: 'end', exact: true })); expect(document.querySelector('main')?.dataset.stepIndex).toBe('2'); fireEvent.click(screen.getByRole('button', { name: 'start', exact: true })); expect(document.querySelector('main')?.dataset.stepIndex).toBe('0'); expect(eras(steps)).toEqual([{ era: 'start', index: 0 }, { era: 'end', index: 2 }])
  })
  it('I-17 active progress and ToC semantics track sequential and direct navigation', () => { window.innerWidth = 1440; present(); fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true })); const active = screen.getByRole('button', { name: 'Step 2: Title 1' }); expect(active.getAttribute('aria-current')).toBe('step'); expect(active.dataset.presentationActive).toBe('true'); expect(screen.getByRole('button', { name: 'start', exact: true }).getAttribute('aria-current')).toBe('step'); fireEvent.click(screen.getByRole('button', { name: 'end', exact: true })); expect(active.getAttribute('aria-current')).toBeNull(); expect(active.dataset.presentationActive).toBe('false') })
  it('I-18 focused interactive elements keep keys without double deck navigation', () => {
    present(); const controls = ['button', 'a', 'input', 'select', 'textarea', 'summary', 'div', 'custom-role', 'custom-tabindex']
    for (const tag of controls) { const e = document.createElement(tag); if (tag === 'custom-role') e.setAttribute('role', 'combobox'); if (tag === 'custom-tabindex') e.setAttribute('tabindex', '0'); if (tag === 'div') e.setAttribute('contenteditable', 'true'); document.body.append(e); e.focus(); for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) fireEvent.keyDown(e, { key }); expect(document.querySelector('main')?.dataset.stepIndex).toBe('0'); expect(document.querySelector('main')?.dataset.presentationMode).toBe('browse'); e.remove() }
  })
  it('I-19 boundaries clamp for repeated next previous and direct jumps', () => {
    const { result } = renderHook(() => usePresentationNav(3)); act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0); act(() => result.current.go(99)); expect(result.current.index).toBe(2); act(() => { result.current.next(); result.current.next() }); expect(result.current.index).toBe(2); act(() => result.current.go(-10)); expect(result.current.index).toBe(0); expect(clamp(2, 0)).toBe(0)
  })
  it('I-20 canvas dimensions and uniform mode-specific fit remain independent of step', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380]); for (const mode of ['browse', 'present'] as const) for (const [w, h] of [[1440, 900], [390, 844], [800, 350]]) { const scale = fitScale(w, h, mode); expect(scale).toBeGreaterThanOrEqual(0); expect(scale * 880).toBeLessThanOrEqual(w); expect(scale * 380).toBeLessThanOrEqual(h) }
    expect(fitScale(0, 0, 'browse')).toBe(0); expect(fitScale(880, 500, 'present')).toBeGreaterThan(fitScale(880, 500, 'browse'))
    const { result } = renderHook(() => useFitScale('browse')); const original = result.current.scale; act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) }); expect(result.current.scale).not.toBe(original); window.innerWidth = 1440
    const view = render(<Stage step={steps[0]} mode="browse" />); const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!; expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); const transform = canvas.style.transform; view.rerender(<Stage step={steps[1]} mode="browse" />); expect(canvas.style.transform).toBe(transform); expect(transform).toMatch(/^scale\([\d.]+\)$/)
  })
  it('I-33 every step supplies caption and next previous controls', () => { present(); steps.forEach((s, i) => { fireEvent.click(screen.getByRole('button', { name: `Step ${i + 1}: ${s.title}` })); expect(screen.getByText(s.caption)).toBeTruthy(); expect(screen.getByRole('button', { name: 'Previous', exact: true })).toBeTruthy(); expect(screen.getByRole('button', { name: 'Next', exact: true })).toBeTruthy() }) })
  it('empty steps fail explicitly', () => { expect(() => present({ steps: [] })).toThrow('requires at least one step') })
  it('I-5 entering entities wait for layout duration', () => { expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration); expect(ENTER_T.delay).toBe(ENTER_DELAY); const view = render(<Appear>new</Appear>); expect(document.querySelector('[data-presentation-appear]')).toBeTruthy(); view.unmount() })
})
