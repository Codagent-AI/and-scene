import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { ENTER_DELAY, ENTER_T, LAYOUT_T, DESIGN_H, DESIGN_W } from '../src/presentation-kit/constants'
import type { SceneProps, Step } from '../src/presentation-kit/types'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { StoryScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
import { nodes } from '../src/presentations/how-to-make-a-presentation/steps/nodes'
import { presentations, resolvePresentation } from '../src/presentations'
import Landing from '../src/Landing'
import expected from '../scripts/reference.json'
function Scene({ payload }: SceneProps<number>) { return <Box id="stable">{payload}</Box> }
const steps: Step<number>[] = [0,1,2].map(i => ({ id: `s${i}`, era: i < 2 ? 'first' : 'second', title: `Title ${i}`, caption: `Caption ${i}`, Scene, payload: i, groupKey: 'group' }))

describe('contracts', () => {
 it('I-7 registry preserves explicit routes and landing links with unknown fallback', () => {
   render(<Landing />)
   for (const p of presentations) { expect(screen.getByText(p.title).closest('a')?.getAttribute('href')).toBe(`/${p.slug}`); expect(resolvePresentation(`/${p.slug}/`)).toBe(p) }
   expect(resolvePresentation('/unknown')).toBeUndefined()
 })
 it('I-12 I-13 metadata, captions, active state and position-derived numbering', () => {
   const altered = [steps[2], steps[0]]
   const { rerender } = render(<Presentation title="Test" steps={altered} />)
   expect(screen.getByText('Caption 2')).toBeTruthy()
   expect(screen.getByLabelText('Step 1: Title 2').getAttribute('aria-current')).toBe('step')
   rerender(<Presentation title="Test" steps={[steps[1], ...altered]} />)
   expect(screen.getByLabelText('Step 1: Title 1')).toBeTruthy()
   expect(screen.getByText('Caption 1')).toBeTruthy()
   fireEvent.click(screen.getByLabelText('Step 3: Title 0'))
   rerender(<Presentation title="Test" steps={[steps[1]]} />)
   expect(screen.getByText('Caption 1')).toBeTruthy()
   for (const s of STEPS) for (const key of ['id','era','title','caption','Scene','payload']) expect(s).toHaveProperty(key)
 })
 it('I-14 typed payloads cross the actual boundary without casts', () => {
   const Typed = ({ payload }: SceneProps<{ value: string }>) => <span>{payload.value}</span>
   const typed: Step<{ value: string }>[] = [{ ...steps[0], Scene: Typed, payload: { value: 'typed' } }]
   render(<Presentation steps={typed} title="Typed" />)
   expect(screen.getByText('typed')).toBeTruthy()
   // @ts-expect-error a string payload cannot satisfy the typed Scene contract
   const invalid: Step<{ value: string }> = { ...typed[0], payload: 'wrong' }
   expect(invalid).toBeTruthy()
 })
 it('I-15 stable layout identity, delayed entry and departure wiring', () => {
   const { container, rerender } = render(<Box id="persist">before</Box>)
   const original = container.firstChild
   rerender(<Box id="persist" style={{ left: 40, width: 120 }}>after</Box>)
   expect(container.firstChild).toBe(original)
   expect(container.querySelector('[data-entity-id="persist"]')?.textContent).toBe('after')
   expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration)
   expect(ENTER_T.delay).toBe(ENTER_DELAY)
   const a = render(<Appear>new</Appear>)
   expect(a.container.querySelector('[data-presentation-appear]')).toBeTruthy()
 })
 it('I-16 grouped scene retains instance and payload; changing group or Scene remounts', () => {
   const mount = vi.fn(), unmount = vi.fn()
   function Stateful({ payload }: SceneProps<number>) { useEffect(() => { mount(); return unmount }, []); return <span>state {payload}</span> }
   const a = { ...steps[0], Scene: Stateful }
   const { rerender } = render(<Stage step={a} mode="browse" />)
   rerender(<Stage step={{ ...a, id: 'next', payload: 2 }} mode="browse" />)
   expect(mount).toHaveBeenCalledTimes(1)
   expect(screen.getByText('state 2')).toBeTruthy()
   rerender(<Stage step={{ ...a, groupKey: 'different' }} mode="browse" />)
   expect(mount).toHaveBeenCalledTimes(2)
   rerender(<Stage step={{ ...a, groupKey: 'different', Scene }} mode="browse" />)
   expect(unmount).toHaveBeenCalled()
 })
 it('I-17 I-18 geometry, overlap and primitive hooks are author-controlled', () => {
   const primitives = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
   for (const Component of primitives) {
     const { container, unmount } = render(<SceneLayer><Component id="literal" className="author" style={{ position: 'absolute', left: 17, top: 23 }} data-allow-overlap>text</Component></SceneLayer>)
     const node = container.querySelector('[data-entity-id]') as HTMLElement
     expect(node.className).toBe('author'); expect(node.style.left).toBe('17px'); expect(node.style.top).toBe('23px')
     expect(node.getAttribute('data-allow-overlap')).toBe('true')
     expect(node.style.color).toBe(''); expect(node.style.border).toBe(''); expect(node.style.fontFamily).toBe('')
     expect((container.querySelector('[data-presentation-layer]') as HTMLElement).style.position).toBe('absolute')
     unmount()
   }
 })
 it('I-19 attribution defaults and opt-in header brand', () => {
   const { container, rerender } = render(<Presentation title="Test" steps={steps} />)
   const link = screen.getByText('made by and-scene').closest('a')!
   expect(link.href).toBe('https://github.com/Codagent-AI/and-scene')
   expect(link.closest('[data-presentation-attribution]')?.getAttribute('style')).toContain('right: 16px')
   expect(container.querySelector('header a')).toBeNull()
   rerender(<Presentation title="Test" steps={steps} brand={<a href="/">Host</a>} />)
   expect(container.querySelector('header a')?.textContent).toBe('Host')
 })
 it('I-20 I-21 mode chrome, initial mode and preserved index', () => {
   const { container, unmount } = render(<Presentation title="Test" steps={steps} />)
   fireEvent.click(screen.getByLabelText('Step 2: Title 1'))
   fireEvent.click(screen.getByLabelText('Toggle presentation mode'))
   expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
   expect(screen.queryByText('Caption 1')).toBeNull()
   expect(container.querySelector('[data-presentation-toc]')).toBeNull()
   expect(screen.queryByLabelText('Next step')).toBeNull()
   expect(screen.getByText('Title 1')).toBeTruthy()
   fireEvent.click(screen.getByLabelText('Toggle presentation mode'))
   expect(screen.getByText('Caption 1')).toBeTruthy()
   unmount()
   const hook = renderHook(() => usePresentationNav(3, 'present'))
   expect(hook.result.current.mode).toBe('present')
   act(() => { fireEvent.keyDown(window, { key: 'p' }) })
   expect(hook.result.current.mode).toBe('browse')
 })
 it('I-22 all keyboard mappings and focused controls retain keys', () => {
   const { result } = renderHook(() => usePresentationNav(10))
   for (const key of ['ArrowRight',' ','PageDown']) act(() => { fireEvent.keyDown(window, { key }) })
   expect(result.current.index).toBe(3)
   for (const key of ['ArrowLeft','PageUp']) act(() => { fireEvent.keyDown(window, { key }) })
   expect(result.current.index).toBe(1)
   for (const tag of ['button','input','select','textarea','a','div']) {
     const control = document.createElement(tag)
     if (tag === 'div') control.setAttribute('contenteditable','true')
     document.body.append(control)
     for (const key of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','p']) act(() => { fireEvent.keyDown(control, { key }) })
     expect(result.current.index).toBe(1); expect(result.current.mode).toBe('browse'); control.remove()
   }
 })
 it('I-23 swipes navigate horizontally and ignore short or vertical movement', () => {
   render(<Presentation title="Test" steps={steps} />)
   const root = screen.getByRole('main')
   const swipe = (x: number, y: number) => { fireEvent.touchStart(root, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(root, { changedTouches: [{ clientX: x, clientY: y }] }) }
   swipe(0, 100); expect(root.getAttribute('data-step-index')).toBe('1')
   swipe(200, 100); expect(root.getAttribute('data-step-index')).toBe('0')
   swipe(90, 100); swipe(50, 250); expect(root.getAttribute('data-step-index')).toBe('0')
 })
 it('I-24 progress jumps, era-first jumps and semantic active hooks', () => {
   const { container } = render(<Presentation title="Test" steps={steps} />)
   fireEvent.click(screen.getByLabelText('Step 3: Title 2'))
   expect(screen.getByText('second').getAttribute('aria-current')).toBe('step')
   expect(screen.getByText('second').getAttribute('data-presentation-active')).toBe('true')
   fireEvent.click(screen.getByText('first'))
   expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
   expect(screen.getByLabelText('Step 1: Title 0').getAttribute('aria-current')).toBe('step')
 })
 it('I-25 clamps at both boundaries including one-step decks', () => {
   const { result } = renderHook(() => usePresentationNav(3))
   act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0)
   act(() => { result.current.next(); result.current.next(); result.current.next(); result.current.next() }); expect(result.current.index).toBe(2)
   const single = renderHook(() => usePresentationNav(1))
   act(() => { single.result.current.next(); single.result.current.prev() }); expect(single.result.current.index).toBe(0)
 })
 it('I-26 uniform fit across viewport and mode geometry; resize cleanup', () => {
   expect([DESIGN_W,DESIGN_H]).toEqual([880,380])
   for (const mode of ['browse','present'] as const) for (const [w,h] of [[1440,1000],[375,700],[1000,350],[0,0]]) {
     const scale = fitScale(w,h,mode)
     expect(scale).toBeGreaterThanOrEqual(0)
     expect(880 * scale).toBeLessThanOrEqual(Math.max(w,0))
     expect(380 * scale).toBeLessThanOrEqual(Math.max(h,0))
   }
   const remove = vi.spyOn(window,'removeEventListener')
   const { container, unmount } = render(<Stage step={steps[0]} mode="browse" />)
   act(() => { window.innerWidth = 375; fireEvent(window, new Event('resize')) })
   expect(parseFloat((container.querySelector('[data-presentation-canvas]') as HTMLElement).style.transform.slice(6))).toBeCloseTo(fitScale(375,window.innerHeight,'browse'), 5)
   unmount(); expect(remove.mock.calls.some(c => c[0] === 'resize')).toBe(true)
   remove.mockRestore()
 })
 it('I-28 exact normative sample metadata in order', () => { expect(STEPS.map(({ id,era,title,caption }) => ({ id,era,title,caption }))).toEqual(expected) })
 it('I-29 I-30 I-31 I-32 accumulated entities retain coordinates and scene intent', () => {
   const { container, rerender } = render(<StoryScene payload={1} />)
   const first = container.querySelector('[data-story-entity="you"]')
   for (let beat = 1; beat <= 9; beat++) {
     rerender(<StoryScene payload={beat} />)
     expect(container.querySelector('[data-story-entity="you"]')).toBe(first)
     expect(!!container.querySelector('[data-story-connector="conversation"]')).toBe(beat >= 2)
     expect(!!container.querySelector('[data-story-connector="modify"]')).toBe(beat >= 8)
     for (const node of nodes) {
       const element = container.querySelector(`[data-story-entity="${node.id}"]`) as HTMLElement | null
       expect(!!element).toBe(node.beat <= beat)
       if (element) { expect(element.style.left).toBe(`${node.x}px`); expect(element.style.top).toBe(`${node.y}px`) }
     }
   }
   expect(nodes.find(n => n.id === 'kit')!.y).toBe(nodes.find(n => n.id === 'tray')!.y + nodes.find(n => n.id === 'tray')!.h)
   expect(nodes.find(n => n.id === 'verify')!.y).toBe(nodes.find(n => n.id === 'card-1')!.y)
   expect(screen.getByText('build + render / pass')).toBeTruthy()
   expect(screen.getByText('AND SCENE. / YOU’RE LOOKING AT ONE.')).toBeTruthy()
 })
})
