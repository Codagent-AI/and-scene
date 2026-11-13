import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, LAYOUT_T, STAGE_LAYOUT } from '../src/presentation-kit/constants'
import { Box } from '../src/presentation-kit/nodes/Box'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import type { Step, SceneProps } from '../src/presentation-kit/types'

afterEach(cleanup)
const mounts = vi.fn(), unmounts = vi.fn()
function Scene({ payload }: SceneProps<{ value: number }>) {
  useEffect(() => { mounts(); return () => { unmounts() } }, [])
  return <SceneLayer><Box id="persistent" style={{ left: 20, top: 30 }} data-value={payload.value}>entity {payload.value}</Box></SceneLayer>
}
const steps: Step<{ value: number }>[] = [0, 1, 2].map((value) => ({ id: `s${value}`, era: value < 2 ? 'start' : 'end', title: `Title ${value}`, caption: `Paragraph ${value}.`, Scene, groupKey: 'same', payload: { value } }))
const key = (name: string, target: EventTarget = window) => fireEvent.keyDown(target, { key: name })
describe('scene kit', () => {
 it('I-1 narration and active diagram follow the selected step', () => {
  render(<Presentation steps={steps} title="Example" />)
  expect(screen.getByRole('heading', {name:'Title 0'})).toBeTruthy(); expect(screen.getByText('Paragraph 0.')).toBeTruthy()
  expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-count')).toBe('3')
  key('ArrowRight'); expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1'); expect(screen.getByText('entity 1')).toBeTruthy(); expect(screen.getByText('Paragraph 1.')).toBeTruthy()
 })
 it('I-2 numbering derives from reordered positions', () => {
  render(<Presentation steps={[steps[2], steps[0]]} title="Example" />)
  expect(screen.getByTestId('step-marker').textContent).toBe('01 / 02')
  key('ArrowRight'); expect(screen.getByTestId('step-marker').textContent).toBe('02 / 02')
 })
 it('I-4 I-6 I-7 grouped scenes preserve instances, geometry, and identity', () => {
  mounts.mockClear(); unmounts.mockClear()
  const view=render(<Presentation steps={steps} title="Example" />)
  const entity=document.querySelector('[data-presentation-entity="persistent"]')!
  expect(mounts).toHaveBeenCalledTimes(1)
  key('ArrowRight'); expect(document.querySelector('[data-presentation-entity="persistent"]')).toBe(entity)
  expect(entity.getAttribute('data-value')).toBe('1'); expect((entity as HTMLElement).style.left).toBe('20px')
  expect(unmounts).not.toHaveBeenCalled()
  view.unmount(); expect(unmounts).toHaveBeenCalledTimes(1)
 })
 it('I-6 changing scene group or component creates a new scene instance', () => {
  const Other=({payload}:SceneProps<{value:number}>)=><div>other {payload.value}</div>
  render(<Presentation steps={[steps[0],{...steps[1],groupKey:'other'}, {...steps[2],groupKey:'other',Scene:Other}]} title="Example" />)
  const first=document.querySelector('[data-presentation-scene]')
  key('ArrowRight'); expect(document.querySelector('[data-presentation-scene][data-active="true"]')).not.toBe(first)
  key('ArrowRight'); expect(screen.getByText('other 2')).toBeTruthy()
 })
 it('I-5 newcomer timing follows layout motion', () => { expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration) })
 it('I-8 primitives forward style, class, data, and arbitrary scene children', () => {
  render(<SceneLayer><Box id="x" className="custom" style={{left:42}} data-custom="yes">Raw children</Box></SceneLayer>)
  const node=document.querySelector('[data-presentation-entity="x"]')! as HTMLElement
  expect(node.className).toBe('custom'); expect(node.style.left).toBe('42px'); expect(node.dataset.custom).toBe('yes')
 })
 it('I-10 default attribution and opt-in brand', () => {
  const view=render(<Presentation steps={steps} title="Example" />)
  const link=screen.getByRole('link',{name:'made by and-scene'})
  expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
  expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
  expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
  view.rerender(<Presentation steps={steps} title="Example" brand={<a href="/">Host</a>} />)
  expect(screen.getByRole('link',{name:'Host'})).toBeTruthy()
 })
 it('I-11 I-12 I-13 modes expose expected chrome and retain position', () => {
  render(<Presentation steps={steps} title="Example" initialMode="present" />)
  expect(screen.queryByText('Paragraph 0.')).toBeNull(); expect(screen.queryByRole('button',{name:'Next step'})).toBeNull()
  key('ArrowRight'); key('p')
  expect(screen.getByText('Paragraph 1.')).toBeTruthy(); expect(screen.getByRole('button',{name:'Next step'})).toBeTruthy()
  expect(screen.getByRole('navigation',{name:'Sections'})).toBeTruthy(); expect(screen.getByRole('navigation',{name:'Steps'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Toggle presentation mode'})); expect(screen.getByRole('heading',{name:'Title 1'})).toBeTruthy()
 })
 it('I-14 keyboard mappings and focused controls keep their keys', () => {
  const {result}=renderHook(()=>usePresentationNav(8))
  for(const name of ['ArrowRight',' ','PageDown']) { act(()=>key(name)); }
  expect(result.current.index).toBe(3)
  for(const name of ['ArrowLeft','PageUp']) { act(()=>key(name)); }
  expect(result.current.index).toBe(1)
  for(const tag of ['button','input','textarea','select','a','div','summary']) {
   const target=document.createElement(tag); if(tag==='div')target.setAttribute('contenteditable','true'); if(tag==='a')target.setAttribute('href','#')
   document.body.append(target); act(()=>key('ArrowRight',target)); act(()=>key('p',target)); target.remove()
  }
  expect(result.current.index).toBe(1); expect(result.current.mode).toBe('browse')
 })
 it('I-15 I-18 swipes and boundaries clamp without wrapping', () => {
  render(<Presentation steps={steps} title="Example" />)
  const host=document.querySelector('[data-presentation-root]')!
  const swipe=(start:number,end:number,y=10)=>{fireEvent.touchStart(host,{touches:[{clientX:start,clientY:10}]});fireEvent.touchEnd(host,{changedTouches:[{clientX:end,clientY:y}]})}
  key('ArrowLeft'); expect(host.getAttribute('data-step-index')).toBe('0')
  swipe(100,10); expect(host.getAttribute('data-step-index')).toBe('1')
  swipe(10,100); expect(host.getAttribute('data-step-index')).toBe('0')
  swipe(100,10,200); expect(host.getAttribute('data-step-index')).toBe('0')
  key('End'); key('ArrowRight'); key('ArrowRight'); key('ArrowRight'); swipe(100,10)
  expect(host.getAttribute('data-step-index')).toBe('2')
 })
 it('I-16 I-17 I-18 direct jumps, current semantics, controls, and era starts', () => {
  render(<Presentation steps={steps} title="Example" />)
  expect(screen.getByRole('button',{name:'Previous step'}).hasAttribute('disabled')).toBe(true)
  fireEvent.click(screen.getByRole('button',{name:'Step 3: Title 2'}));
  expect(screen.getByRole('button',{name:'Step 3: Title 2'}).getAttribute('aria-current')).toBe('step')
  expect(screen.getByRole('button',{name:'end'}).getAttribute('data-active')).toBe('true')
  fireEvent.click(screen.getByRole('button',{name:'start'})); expect(screen.getByText('Paragraph 0.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Next step'})); expect(screen.getByText('Paragraph 1.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Previous step'})); expect(screen.getByText('Paragraph 0.')).toBeTruthy()
 })
 it('I-19 fixed canvas and uniform fit across modes and widths', () => {
  expect([DESIGN_W,DESIGN_H]).toEqual([880,380])
  expect(fitScale(440,190)).toBe(.5); expect(fitScale(1760,380)).toBe(1)
  expect(fitScale(0,0)).toBe(0)
  render(<Presentation steps={steps} title="Example" />)
  const canvas=document.querySelector('[data-presentation-canvas]') as HTMLElement
  expect(canvas.style.width).toBe('880px');expect(canvas.style.height).toBe('380px')
 })
})
it('I-19 fit observes resizing and cleans up observers and listeners', () => {
 let callback:()=>void=()=>{}
 const disconnect=vi.fn(), observe=vi.fn()
 class Observer {constructor(update:()=>void){callback=update} observe=observe;disconnect=disconnect}
 vi.stubGlobal('ResizeObserver',Observer)
 const rectangle={width:440,height:190}
 const element={getBoundingClientRect:()=>rectangle} as HTMLElement
 const ref={current:element}
 const {result,unmount}=renderHook(()=>useFitScale(ref))
 expect(result.current).toBe(.5)
 rectangle.width=880;rectangle.height=760;act(()=>callback());expect(result.current).toBe(1)
 rectangle.width=220;rectangle.height=95;act(()=>fireEvent(window,new Event('resize')));expect(result.current).toBe(.25)
 unmount();expect(disconnect).toHaveBeenCalledTimes(1);vi.unstubAllGlobals()
 expect(STAGE_LAYOUT.browse.header).not.toBe(STAGE_LAYOUT.present.header)
 expect(STAGE_LAYOUT.browse.footer).not.toBe(STAGE_LAYOUT.present.footer)
})
it('I-14 navigation listener is removed after unmount and cancelled touches do not navigate', () => {
 const remove=vi.spyOn(window,'removeEventListener')
 const {result,unmount}=renderHook(()=>usePresentationNav(2))
 unmount();expect(remove.mock.calls.some(call=>call[0]==='keydown')).toBe(true);remove.mockRestore()
 expect(result.current.index).toBe(0)
 render(<Presentation steps={steps} title="Example" />)
 const host=document.querySelector('[data-presentation-root]')!
 fireEvent.touchStart(host,{touches:[{clientX:100,clientY:10}]});fireEvent.touchCancel(host)
 fireEvent.touchEnd(host,{changedTouches:[{clientX:10,clientY:10}]})
 expect(host.getAttribute('data-step-index')).toBe('0')
})
