import { StrictMode, useEffect, useState } from 'react'
import type { ComponentProps } from 'react'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { AnimatePresence, motion } from 'motion/react'
import { Circle } from 'lucide-react'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, Appear, ENTER_DELAY, ENTER_T, LAYOUT_T, DESIGN_W, DESIGN_H, MIN_SCALE, STAGE_LAYOUT } from '../../src/presentation-kit'
import type { SceneProps, Step } from '../../src/presentation-kit'
import { appearance } from '../../src/presentation-kit/nodes/Appear'
import { Header } from '../../src/presentation-kit/chrome/Header'
import { Footer } from '../../src/presentation-kit/chrome/Footer'
import { Toc } from '../../src/presentation-kit/chrome/Toc'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../../src/presentation-kit/useFitScale'
import { typedSteps } from '../../src/presentation-kit/type-contract'
const Scene = ({ payload }: SceneProps<{ text: string }>) => <Box layoutId="shared" data-testid="diagram">{payload.text}</Box>
const steps: Step<{ text: string }>[] = ['A', 'B', 'C', 'D'].map((title, i) => ({ id: title, era: i < 2 ? 'first' : 'second', title, caption: `${title} paragraph caption.`, Scene, payload: { text: `diagram ${title}` }, groupKey: 'diagram' }))
function root() { return document.querySelector('[data-presentation-root]')! }
function index() { return Number(root().getAttribute('data-step-index')) }
function key(k: string, target: Element | Window = window) { fireEvent.keyDown(target, { key: k }) }
function resize(width: number, height: number) { act(() => { window.innerWidth = width; window.innerHeight = height; window.dispatchEvent(new Event('resize')) }) }
describe('step contract', () => {
 it('renders metadata diagram and derived numbering through insertion removal and reorder', async () => {
  const view = render(<Presentation title="test" steps={steps} />)
  for (const order of [[steps[2], steps[0], steps[1]], [steps[2], steps[3], steps[0], steps[1]], [steps[2], steps[1]]]) {
   view.rerender(<Presentation title="test" steps={order} />)
   expect(root().getAttribute('data-step-count')).toBe(String(order.length))
   expect(root().getAttribute('data-step-id')).toBe('C')
   expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe(`01 / ${order.length} · second`)
   expect(document.querySelector('h1')!.textContent).toBe('C')
   expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe('C paragraph caption.')
   expect(screen.getByTestId('diagram').textContent).toBe('diagram C')
  }
  fireEvent.click(screen.getByLabelText('Next step'))
  expect(index()).toBe(1); expect(root().getAttribute('data-step-id')).toBe('B')
  expect(document.querySelector('[data-presentation-marker]')!.textContent).toBe('02 / 2 · first')
 })
 it('preserves typed payload contracts', () => { expectTypeOf(typedSteps[0].payload).toEqualTypeOf<{ message: string; count: number }>(); expectTypeOf<ComponentProps<typeof Box>['Icon']>().toEqualTypeOf<typeof Circle | undefined>() })
})
describe('mode and chrome', () => {
 it('renders both modes, real controls, wide and narrow ToC', () => {
  resize(1440,900)
  render(<Presentation title="test" steps={steps} />)
  expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
  expect(screen.getByText('A paragraph caption.')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Next step')); expect(index()).toBe(1)
  fireEvent.click(screen.getByLabelText('Previous step')); expect(index()).toBe(0)
  resize(390,844); expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
  fireEvent.click(screen.getByLabelText('Toggle presentation mode'))
  expect(screen.queryByLabelText('Next step')).toBeNull(); expect(document.querySelector('[data-presentation-caption]')).toBeNull()
  expect(screen.queryByRole('navigation')).toBeNull(); expect(document.querySelector('h1')!.textContent).toBe('A')
 })
 it('configures initial mode and toggles via public action and P without losing index', () => {
  const v = render(<Presentation title="test" steps={steps} initialMode="present" />)
  expect(root().getAttribute('data-presentation-mode')).toBe('present')
  key('ArrowRight'); expect(index()).toBe(1)
  for (let i=0;i<4;i++) { key('p'); expect(index()).toBe(1); fireEvent.click(screen.getByLabelText('Toggle presentation mode')); expect(index()).toBe(1) }
  v.unmount(); render(<Presentation title="test" steps={steps} initialMode="browse" />); expect(root().getAttribute('data-presentation-mode')).toBe('browse')
 })
 it('jumps by actual progress and era buttons with current-state semantics', () => {
  resize(1440,900); render(<Presentation title="test" steps={steps} />)
  fireEvent.click(screen.getByLabelText('Step 4: D')); expect(index()).toBe(3)
  fireEvent.click(screen.getByText('second', { selector: 'button' })); expect(index()).toBe(2)
  for (const action of [() => key('ArrowRight'), () => key('ArrowLeft'), () => fireEvent.click(screen.getByText('first', { selector: 'button' }))]) {
   action()
   const dots = [...document.querySelectorAll('[data-presentation-progress]')]
   dots.forEach((d,i) => { expect(d.hasAttribute('aria-current')).toBe(i===index()); expect(d.hasAttribute('data-presentation-active')).toBe(i===index()) })
   const era = steps[index()].era
   document.querySelectorAll('[data-presentation-toc-entry]').forEach(e => expect(e.getAttribute('aria-current')).toBe(e.textContent === era ? 'step' : null))
  }
 })
 it('provides bottom-right attribution and opt-in branding', () => {
  const v = render(<Presentation title="test" steps={steps} />)
  const a=screen.getByText('made by and-scene'); expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene'); expect(a.hasAttribute('data-presentation-attribution')).toBe(true)
  expect((a as HTMLElement).style.right).toBe('16px'); expect((a as HTMLElement).style.bottom).toBe('12px')
  expect(document.querySelector('header a')).toBeNull()
  v.rerender(<Presentation title="test" steps={steps} brand={<a href="/">Host</a>} />); expect(screen.getByText('Host')).toBeTruthy()
 })
})
describe('navigation', () => {
 it('handles each keyboard shortcut exactly once under StrictMode and removes listeners', () => {
  const remove = vi.spyOn(window,'removeEventListener')
  const { result, unmount }=renderHook(() => usePresentationNav(8),{wrapper:StrictMode})
  for(const k of ['ArrowRight',' ','PageDown']) { const before=result.current.index; act(()=>key(k)); expect(result.current.index).toBe(before+1) }
  for(const k of ['ArrowLeft','PageUp']) { const before=result.current.index; act(()=>key(k)); expect(result.current.index).toBe(before-1) }
  const prev=result.current.index; unmount(); act(()=>key('ArrowRight')); expect(result.current.index).toBe(prev); expect(remove).toHaveBeenCalledWith('keydown',expect.any(Function)); remove.mockRestore()
 })
 it('does not intercept focused controls descendants or editable content, including P', () => {
  render(<><Presentation title="test" steps={steps}/><button><span>nested</span></button><a href="#">link</a><input/><select/><textarea/><div contentEditable suppressContentEditableWarning>editable<span>child</span></div></>)
  for(const target of document.querySelectorAll('button,a,input,select,textarea,[contenteditable],button span,[contenteditable] span')) for(const k of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','p']) {
   const event = new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}); target.dispatchEvent(event)
   expect(index()).toBe(0); expect(event.defaultPrevented).toBe(false); expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  }
 })
 it('swipes once in each direction and ignores vertical or cancelled gestures', () => {
  render(<Presentation title="test" steps={steps}/>); const el=root()
  const swipe=(x:number,y:number) => { fireEvent.touchStart(el,{touches:[{clientX:200,clientY:200}]}); fireEvent.touchMove(el,{touches:[{clientX:x,clientY:y}]}); fireEvent.touchEnd(el,{changedTouches:[{clientX:x,clientY:y}]}) }
  swipe(100,210); expect(index()).toBe(1); swipe(200,100); expect(index()).toBe(1); swipe(300,210); expect(index()).toBe(0)
  fireEvent.touchStart(el,{touches:[{clientX:200,clientY:200}]}); fireEvent.touchCancel(el); fireEvent.touchEnd(el,{changedTouches:[{clientX:50,clientY:200}]}); expect(index()).toBe(0)
 })
 it('clamps hook keyboard swipe and screen controls at both boundaries', () => {
  const h=renderHook(()=>usePresentationNav(2)); act(()=>{h.result.current.prev();h.result.current.prev()}); expect(h.result.current.index).toBe(0); act(()=>{h.result.current.next();h.result.current.next()}); expect(h.result.current.index).toBe(1); h.unmount()
  render(<Presentation title="test" steps={steps}/>);
  for(let i=0;i<6;i++) { key('ArrowLeft'); fireEvent.touchStart(root(),{touches:[{clientX:100,clientY:0}]});fireEvent.touchEnd(root(),{changedTouches:[{clientX:200,clientY:0}]}); fireEvent.click(screen.getByLabelText('Previous step')) }; expect(index()).toBe(0)
  for(let i=0;i<8;i++) key('ArrowRight')
  for(let i=0;i<6;i++) { key('PageDown');fireEvent.touchStart(root(),{touches:[{clientX:200,clientY:0}]});fireEvent.touchEnd(root(),{changedTouches:[{clientX:100,clientY:0}]});fireEvent.click(screen.getByLabelText('Next step')) }; expect(index()).toBe(3)
 })
})
describe('scaling', () => {
 it('uses uniform mode geometry fixed dimensions floor and resize cleanup', () => {
  expect([DESIGN_W,DESIGN_H]).toEqual([880,380])
  for(const mode of ['browse','present'] as const) for(const [w,h] of [[1440,900],[390,844],[1000,400],[10,10]]) {
   const g=STAGE_LAYOUT[mode]; expect(fitScale(w,h,mode)).toBe(Math.max(MIN_SCALE,Math.min(1,(w-g.sides*2)/880,(h-g.top-g.bottom)/380)))
  }
  resize(1440,900); const remove=vi.spyOn(window,'removeEventListener'); const h=renderHook(()=>useFitScale('browse')); const before=h.result.current; resize(390,844); expect(h.result.current).toBeLessThan(before); h.unmount();expect(remove).toHaveBeenCalledWith('resize',expect.any(Function));remove.mockRestore()
  render(<Presentation title="test" steps={steps}/>); const canvas=document.querySelector('[data-presentation-canvas]') as HTMLElement; const transform=canvas.style.transform; key('ArrowRight');expect(canvas.style.transform).toBe(transform);expect(canvas.style.width).toBe('880px');expect(canvas.style.height).toBe('380px')
 })
})
describe('primitives and continuity', () => {
 it('forwards hooks coordinates identity custom data and optional Lucide glyphs on every primitive and chrome', () => {
  const nodes=[Box,Label,Arrow,Frame,Emphasis,SymbolChip]
  const hooks=['box','label','arrow','frame','emphasis','symbol-chip']
  for(const [i,Node] of nodes.entries()) {
   const v=render(<Node layoutId={`n${i}`} className="local" data-custom="ok" style={{position:'absolute',left:40,top:50,zIndex:2}} Icon={i===0?Circle:undefined}>text</Node>)
   const el=v.container.firstElementChild as HTMLElement;expect(el.className).toBe('local');expect(el.dataset.custom).toBe('ok');expect(el.style.left).toBe('40px');expect(el.style.top).toBe('50px');expect(el.style.zIndex).toBe('2');expect(el.hasAttribute(`data-presentation-${hooks[i]}`)).toBe(true);expect(Box({layoutId:`n${i}`}).props.layoutId).toBe(`n${i}`);expect(el.querySelector('[data-presentation-glyph]')!==null).toBe(i===0);v.unmount()
  }
  const v=render(<SceneLayer className="layer" data-custom="layer" style={{zIndex:5}}><motion.div layoutId="raw" style={{position:'absolute',left:40,top:50}}/><Box layoutId="overlap" style={{position:'absolute',left:40,top:50}}/></SceneLayer>)
  expect((v.container.firstChild as HTMLElement).style.position).toBe('absolute');expect((v.container.firstChild as HTMLElement).style.zIndex).toBe('5');v.unmount()
  const props={className:'local-chrome','data-custom':'ok',style:{left:12}}
  const c=render(<><Header {...props} title="title" marker="marker"/><Toc {...props} steps={steps} index={0} jump={()=>{}}/><Footer {...props} steps={steps} index={0} mode="browse" next={()=>{}} prev={()=>{}} jump={()=>{}}/></>)
  for(const el of c.container.children) {expect(el.className).toBe('local-chrome');expect((el as HTMLElement).style.left).toBe('12px');expect(el.getAttribute('data-custom')).toBe('ok')}
 })
 it('keeps grouped instance local state and DOM then remounts on group Scene or ungrouped identity', async () => {
  let mounts=0
  function Persistent({payload}:SceneProps<{text:string}>) { const [state]=useState(()=>++mounts);return <Box layoutId="persistent" data-testid="persistent">{state}:{payload.text}</Box> }
  function Other(p:SceneProps<{text:string}>) {return <Persistent {...p}/>}
  const grouped=steps.map(s=>({...s,Scene:Persistent}))
  const v=render(<Presentation title="test" steps={grouped}/>);const first=screen.getByTestId('persistent');key('ArrowRight');expect(screen.getByTestId('persistent')).toBe(first);expect(first.textContent).toBe('1:diagram B');expect(first.closest('[data-presentation-appear]')).toBeNull()
  v.rerender(<Presentation title="test" steps={grouped.map(s=>({...s,groupKey:'other'}))}/>);await waitFor(()=>expect(mounts).toBe(2))
  v.rerender(<Presentation title="test" steps={grouped.map(s=>({...s,Scene:Other}))}/>);await waitFor(()=>expect(mounts).toBe(3))
  v.rerender(<Presentation title="test" steps={grouped.map(s=>({...s,groupKey:undefined}))}/>);await waitFor(()=>expect(mounts).toBe(4));key('ArrowRight');await waitFor(()=>expect(mounts).toBe(5))
 })
 it('applies real entrance timing and preserves a departing child until exit completes', async () => {
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T);expect(appearance.transition).toEqual({delay:ENTER_DELAY,duration:ENTER_T})
  const v=render(<AnimatePresence><Appear key="new"><span>newcomer</span></Appear></AnimatePresence>)
  expect(screen.getByText('newcomer').parentElement!.style.opacity).toBe('0')
  await new Promise(resolve=>setTimeout(resolve, Math.floor(LAYOUT_T*1000)))
  expect(screen.getByText('newcomer').parentElement!.style.opacity).toBe('0')
  expect(Appear({}).props.transition).toEqual({delay:ENTER_DELAY,duration:ENTER_T})
  await waitFor(()=>expect(Number(screen.getByText('newcomer').parentElement!.style.opacity)).toBeGreaterThan(0),{timeout:2000})
  v.rerender(<AnimatePresence>{null}</AnimatePresence>);expect(screen.getByText('newcomer')).toBeTruthy()
  await waitFor(()=>expect(screen.queryByText('newcomer')).toBeNull(),{timeout:2000})
 })
 it('updates persisting layout geometry content and emphasis with layout transition wired', () => {
  const v=render(<Box layoutId="move" data-testid="move" style={{left:10,width:30}} data-emphasis="quiet">old</Box>);const el=screen.getByTestId('move')
  v.rerender(<Box layoutId="move" data-testid="move" style={{left:60,width:90}} data-emphasis="strong">new</Box>);expect(screen.getByTestId('move')).toBe(el);expect(el.style.left).toBe('60px');expect(el.style.width).toBe('90px');expect(el.dataset.emphasis).toBe('strong');expect(el.textContent).toBe('new')
  const box=Box({layoutId:'move',children:'test'});expect(box.props.layout).toBe(true);expect(box.props.layoutId).toBe('move');expect(box.props.transition.layout.duration).toBe(LAYOUT_T)
 })
 it('replays effects without duplicate scene-side subscriptions', () => {
  let active=0;function Replay(){useEffect(()=>{active++;return()=>{active--}},[]);return null}
  const v=render(<StrictMode><Replay/></StrictMode>);expect(active).toBe(1);v.unmount();expect(active).toBe(0)
 })
})
