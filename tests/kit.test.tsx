import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEffect, useState } from 'react'
import { Presentation, Stage, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, Appear } from '../src/presentation-kit'
import type { Step, SceneProps } from '../src/presentation-kit'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_W, DESIGN_H, LAYOUT_T, ENTER_DELAY, ENTER_T } from '../src/presentation-kit/constants'
import { entrance } from '../src/presentation-kit/nodes/Node'
import { Sparkles } from 'lucide-react'
const mounts = vi.fn(), unmounts = vi.fn()
function Scene({ payload }: SceneProps<{ label: string }>) {
  const [local] = useState('retained')
  useEffect(() => { mounts(); return () => { unmounts() } }, [])
  return <Box id="stable" style={{ position: 'absolute', left: 12, top: 24 }} data-label={payload.label}>{payload.label}:{local}</Box>
}
const steps: Step<{ label: string }>[] = ['First','Second','Third'].map((title, i) => ({ id: `s${i}`, era: i < 2 ? 'ask' : 'build', title, caption: `Caption ${i}`, groupKey: 'same', Scene, payload: { label: title } }))
function root() { return document.querySelector('[data-presentation]')! }
describe('scene contracts', () => {
 it('I-15 metadata, numbering, active diagrams and insertion/removal/reorder', () => {
  const { rerender } = render(<Presentation title="Demo" steps={steps} />)
  expect(root().getAttribute('data-step-count')).toBe('3')
  expect(screen.getByRole('heading').textContent).toBe('First')
  expect(screen.getByText('Caption 0')).toBeTruthy()
  expect(screen.getByText('First:retained')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Step 2: Second'))
  expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('02 / ask')
  const reordered = [steps[2], steps[0]]
  rerender(<Presentation title="Demo" steps={reordered} />)
  expect(screen.getByLabelText('Step 1: Third')).toBeTruthy()
  expect(screen.getByLabelText('Step 2: First')).toBeTruthy()
  rerender(<Presentation title="Demo" steps={[steps[1], ...reordered]} />)
  expect(screen.getByLabelText('Step 3: First')).toBeTruthy()
 })
 it('I-18 grouped payloads preserve scene instance; changing scene/group remounts', () => {
  mounts.mockClear(); unmounts.mockClear()
  const { rerender } = render(<Stage step={steps[0]} mode="browse" />)
  rerender(<Stage step={steps[1]} mode="browse" />)
  expect(mounts).toHaveBeenCalledTimes(1); expect(unmounts).toHaveBeenCalledTimes(0)
  expect(screen.getByText('Second:retained')).toBeTruthy()
  rerender(<Stage step={{ ...steps[2], groupKey: 'other' }} mode="browse" />)
  expect(mounts).toHaveBeenCalledTimes(2)
  function Different(props: SceneProps<{ label: string }>) { return <Scene {...props} /> }
  rerender(<Stage step={{ ...steps[2], groupKey: 'other', Scene: Different }} mode="browse" />)
  expect(mounts).toHaveBeenCalledTimes(3)
 })
 it('I-17/I-19 continuing IDs update in place with motion layout and exit/entry ordering', () => {
  const { rerender } = render(<Stage step={steps[0]} mode="browse" />)
  const element = document.querySelector('[data-presentation-entity="stable"]')
  rerender(<Stage step={steps[1]} mode="browse" />)
  expect(document.querySelector('[data-presentation-entity="stable"]')).toBe(element)
  expect(element!.getAttribute('data-label')).toBe('Second')
  expect(element!.closest('[data-presentation-appear]')).toBeNull()
  expect((element as HTMLElement).style.left).toBe('12px')
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  expect(entrance.animate.transition).toEqual({ delay: ENTER_DELAY, duration: ENTER_T })
  expect(entrance.exit).toEqual({ opacity: 0, transition: { delay: 0, duration: ENTER_T } })
 })
 it('I-20 primitives forward identity, hooks, literal geometry, glyphs and independent layers', () => {
  const primitives = [Box,Label,Arrow,Frame,Emphasis,SymbolChip]
  const { container } = render(<><SceneLayer data-test="layer" /><SceneLayer data-test="layer2" />{primitives.map((C, i) => <C key={i} id={`e${i}`} className="custom" data-value="yes" style={{ left: 41, width: 100 }} Icon={Sparkles}>entity {i}</C>)}<Appear>new</Appear></>)
  primitives.forEach((_, i) => {
   const e = container.querySelector(`[data-presentation-entity="e${i}"]`) as HTMLElement
   expect(e.className).toBe('custom'); expect(e.dataset.value).toBe('yes'); expect(e.style.left).toBe('41px'); expect(e.querySelector('svg')).toBeTruthy()
   expect(e.style.color).toBe(''); expect(e.style.border).toBe('')
  })
  container.querySelectorAll('[data-presentation-layer]').forEach(e => expect((e as HTMLElement).style.position).toBe('absolute'))
 })
 it('I-21 attribution default and opt-in header branding', () => {
  const { rerender } = render(<Presentation title="Demo" steps={steps} />)
  const a = screen.getByText('made by and-scene')
  expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
  expect(a.hasAttribute('data-presentation-attribution')).toBe(true)
  expect((a.parentElement as HTMLElement).style.right).toBe('16px')
  expect(document.querySelector('[data-presentation-brand]')).toBeNull()
  rerender(<Presentation title="Demo" steps={steps} brand={<a href="/">Host</a>} />)
  expect(document.querySelector('[data-presentation-brand]')!.textContent).toBe('Host')
 })
 it('I-22/I-23 chrome, initial mode, P toggle and current position', () => {
  Object.defineProperty(window,'innerWidth',{ value: 1440, writable: true })
  render(<Presentation title="Demo" steps={steps} initialMode="present" />)
  expect(root().getAttribute('data-presentation-mode')).toBe('present')
  expect(document.querySelector('[data-presentation-caption]')).toBeNull()
  expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  expect(screen.queryByLabelText('Next step')).toBeNull()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.keyDown(window, { key: 'p' })
  expect(root().getAttribute('data-step-index')).toBe('1')
  expect(screen.getByText('Caption 1')).toBeTruthy()
  expect(document.querySelector('[data-presentation-toc]')).toBeTruthy()
  expect(document.querySelector('[data-presentation-progress]')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Toggle presentation mode'))
  expect(root().getAttribute('data-step-index')).toBe('1')
  expect(root().getAttribute('data-presentation-mode')).toBe('present')
  act(() => { window.innerWidth = 390; window.dispatchEvent(new Event('resize')) })
  fireEvent.keyDown(window, { key: 'p' })
  expect(document.querySelector('[data-presentation-toc]')).toBeNull()
 })
 it('I-26/I-39 progress and first-era jumps expose matching semantic and active hooks', () => {
  window.innerWidth = 1440
  render(<Presentation title="Demo" steps={steps} />)
  fireEvent.click(screen.getByLabelText('Step 3: Third'))
  expect(root().getAttribute('data-step-index')).toBe('2')
  const active = screen.getByLabelText('Step 3: Third')
  expect(active.getAttribute('aria-current')).toBe('step'); expect(active.getAttribute('data-presentation-active')).toBe('true')
  fireEvent.click(screen.getByText('ask', { selector: 'button' }))
  expect(root().getAttribute('data-step-index')).toBe('0')
  fireEvent.click(screen.getByLabelText('Step 2: Second'))
  expect(screen.getByText('ask', { selector: 'button' }).getAttribute('aria-current')).toBe('step')
  fireEvent.click(screen.getByText('ask', { selector: 'button' }))
  expect(root().getAttribute('data-step-index')).toBe('0')
 })
 it('I-28 default fixed canvas and no mode-switch/step-dependent scale animation', () => {
  window.innerWidth = 1200; window.innerHeight = 900
  const { rerender } = render(<Stage step={steps[0]} mode="browse" />)
  const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
  expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
  const transform = canvas.style.transform
  rerender(<Stage step={steps[1]} mode="browse" />)
  expect(canvas.style.transform).toBe(transform)
  expect(canvas.style.transition).toBe('')
  rerender(<Stage step={steps[1]} mode="present" />)
  expect(canvas.style.transition).toBe('')
 })
})
describe('navigation', () => {
 it('I-24 keys and touch swipes each move exactly once; reject vertical/short/multitouch', () => {
  const { result } = renderHook(() => usePresentationNav(10))
  for (const key of ['ArrowRight',' ','PageDown']) { const old=result.current.index; act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable:true }))); expect(result.current.index).toBe(old+1) }
  for (const key of ['ArrowLeft','PageUp']) { const old=result.current.index; act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key }))); expect(result.current.index).toBe(old-1) }
  const swipe = (dx: number, dy: number) => {
    // Touch handlers only read these fields; actual browser events are covered by component dispatch below.
    const target = document.body
    act(() => result.current.onTouchStart({ target, touches: [{ clientX: 200, clientY: 100 }] } as unknown as React.TouchEvent))
    act(() => result.current.onTouchEnd({ changedTouches: [{ clientX: 200+dx, clientY: 100+dy }] } as unknown as React.TouchEvent))
  }
  swipe(-80,1); expect(result.current.index).toBe(2)
  swipe(80,1); expect(result.current.index).toBe(1)
  swipe(-10,0); swipe(70,100); expect(result.current.index).toBe(1)
 })
 it('I-25 focused controls retain keys without deck navigation or P toggle', () => {
  render(<Presentation title="Demo" steps={steps} />)
  for (const tag of ['button','a','input','select','textarea','div']) {
   const control=document.createElement(tag); if(tag==='div') control.setAttribute('contenteditable','true')
   document.body.append(control); control.focus()
   for (const key of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','p']) fireEvent.keyDown(control,{ key })
   expect(root().getAttribute('data-step-index')).toBe('0'); expect(root().getAttribute('data-presentation-mode')).toBe('browse')
   control.remove()
  }
 })
 it('I-27 clamps repeated previous/next and out-of-range jumps including a singleton', () => {
  const { result } = renderHook(() => usePresentationNav(3))
  act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0)
  act(() => { for(let i=0;i<5;i++) result.current.next() }); expect(result.current.index).toBe(2)
  act(() => result.current.jump(-20)); expect(result.current.index).toBe(0)
  act(() => result.current.jump(50)); expect(result.current.index).toBe(2)
  const one=renderHook(() => usePresentationNav(1)); act(() => { one.result.current.next();one.result.current.prev() });expect(one.result.current.index).toBe(0)
 })
 it('I-28 fit scales uniformly for width/height constraints and both modes', () => {
  expect([DESIGN_W,DESIGN_H]).toEqual([880,380])
  expect(fitScale(928,710,'browse')).toBe(1)
  expect(fitScale(488,900,'browse')).toBe(.5)
  expect(fitScale(1440,520,'browse')).toBe(.5)
  expect(fitScale(928,560,'present')).toBe(1)
  expect(fitScale(10,10,'browse')).toBe(0)
 })
})
