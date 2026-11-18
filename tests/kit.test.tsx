// @vitest-environment jsdom
import React, { useEffect } from 'react'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation, Stage, Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer, ENTER_DELAY, ENTER_T, LAYOUT_T, fitScale, stageGeometry, useFitScale, usePresentationNav, clampStep } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { eras } from '../src/presentation-kit/chrome/eras'

// Motion's props are the unit boundary: projection itself runs in Chromium verification.
vi.mock('motion/react', async () => {
  const ReactModule = await import('react')
  const MotionDiv = ReactModule.forwardRef<HTMLDivElement, Record<string, unknown>>(function MotionDiv(props, ref) {
    const { layoutId, layout, initial, animate, exit, transition, ...domProps } = props
    return ReactModule.createElement('div', { ...domProps, ref, 'data-motion-layout-id': layoutId, 'data-motion-layout': JSON.stringify(layout), 'data-motion-initial': JSON.stringify(initial), 'data-motion-animate': JSON.stringify(animate), 'data-motion-exit': JSON.stringify(exit), 'data-motion-transition': JSON.stringify(transition) })
  })
  return { motion: { div: MotionDiv }, LayoutGroup: ({children}: {children: React.ReactNode}) => children, AnimatePresence: ({children}: {children: React.ReactNode}) => children }
})

afterEach(cleanup)
function Diagram({payload, stepIndex}: SceneProps<{ label: string }>) { return <Box id="shared" style={{ position: 'absolute', left: stepIndex * 10 }}>{payload.label}</Box> }
const steps: Step<{label:string}>[] = [
  { id: 'one', era: 'start', title: 'First', caption: 'First paragraph.', payload: {label:'A'}, Scene: Diagram, groupKey: 'same' },
  { id: 'two', era: 'start', title: 'Second', caption: 'Second paragraph.', payload: {label:'B'}, Scene: Diagram, groupKey: 'same' },
  { id: 'three', era: 'finish', title: 'Third', caption: 'Third paragraph.', payload: {label:'C'}, Scene: Diagram, groupKey: 'same' },
]
const root = () => document.querySelector('[data-presentation-root]')!
const key = (value: string, target: EventTarget = window) => fireEvent.keyDown(target, { key: value })

describe('scene and primitive contracts', () => {
  it('I-1 carries identity narration and active diagram', () => {
    render(<Presentation steps={steps} title="Demo" />)
    expect(screen.getByRole('heading').textContent).toBe('First')
    expect(document.querySelector('[data-presentation-era]')?.textContent).toBe('start')
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe('First paragraph.')
    expect(document.querySelector('[data-presentation-entity="shared"]')?.textContent).toBe('A')
    expect(root().getAttribute('data-step-count')).toBe('3')
  })
  it('I-2 derives numbering from insertion removal and reordering', () => {
    const { rerender } = render(<Presentation steps={[steps[2], steps[0]]} title="Demo" />)
    expect(document.querySelector('[data-presentation-step-number]')?.textContent).toBe('01')
    key('ArrowRight')
    expect(document.querySelector('[data-presentation-step-number]')?.textContent).toBe('02')
    rerender(<Presentation steps={[steps[1], steps[2], steps[0]]} title="Demo" />)
    expect(document.querySelector('[data-presentation-title]')?.textContent).toBe('Third')
    expect(document.querySelector('[data-presentation-step-number]')?.textContent).toBe('02')
    rerender(<Presentation steps={[steps[0]]} title="Demo" />)
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
  it('I-4 keeps layout identity while position size label and emphasis update', () => {
    const {container, rerender} = render(<Box id="persist" style={{left:10,width:20}} data-emphasis="low">Old</Box>)
    const entity = container.firstElementChild
    rerender(<Box id="persist" style={{left:60,width:80}} data-emphasis="high">New</Box>)
    expect(container.firstElementChild).toBe(entity)
    expect(entity?.getAttribute('data-motion-layout-id')).toBe('persist')
    expect(entity?.getAttribute('data-motion-layout')).toBe('true')
    expect(entity?.textContent).toBe('New')
    expect(entity?.getAttribute('data-emphasis')).toBe('high')
    expect((entity as HTMLElement).style.left).toBe('60px')
    expect((entity as HTMLElement).style.width).toBe('80px')
  })
  it('I-5 delays newcomers and configures departing entity exit', () => {
    const {container, rerender} = render(<Appear><Box id="new">New</Box></Appear>)
    const appear = container.firstElementChild!
    expect(JSON.parse(appear.getAttribute('data-motion-transition')!).delay).toBe(ENTER_DELAY)
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(JSON.parse(appear.getAttribute('data-motion-initial')!)).toEqual({opacity:0})
    expect(JSON.parse(appear.getAttribute('data-motion-animate')!)).toEqual({opacity:1})
    const node = container.querySelector('[data-presentation-node]')!
    expect(JSON.parse(node.getAttribute('data-motion-exit')!)).toEqual({opacity:0,transition:{duration:ENTER_T}})
    rerender(<div />)
    expect(container.querySelector('[data-presentation-node]')).toBeNull()
  })
  it('I-6 preserves grouped instance and updates payload; changed group or Scene remounts', () => {
    const mount = vi.fn(), unmount = vi.fn()
    function Tracked({payload}: SceneProps<{label:string}>) { useEffect(() => {mount(); return unmount}, []); return <span>{payload.label}</span> }
    const first = {...steps[0], Scene: Tracked}
    const {rerender} = render(<Stage step={first} stepIndex={0} scale={1} />)
    rerender(<Stage step={{...first,payload:{label:'changed'}}} stepIndex={1} scale={1} />)
    expect(mount).toHaveBeenCalledTimes(1)
    expect(screen.getByText('changed')).toBeTruthy()
    rerender(<Stage step={{...first,groupKey:'other'}} stepIndex={2} scale={1} />)
    expect(mount).toHaveBeenCalledTimes(2)
    expect(unmount).toHaveBeenCalledTimes(1)
    rerender(<Stage step={{...first,groupKey:'other',Scene:Diagram}} stepIndex={2} scale={1} />)
    expect(unmount).toHaveBeenCalledTimes(2)
  })
  it('I-7 continuing entities avoid newcomer fades and preserve intentional stacking', () => {
    const {container, rerender} = render(<SceneLayer><Box id="overlap" style={{position:'absolute',left:10,top:20,zIndex:2}}>One</Box></SceneLayer>)
    const node = container.querySelector('[data-presentation-entity]')
    rerender(<SceneLayer><Box id="overlap" style={{position:'absolute',left:10,top:20,zIndex:2}}>Two</Box><Label id="other" style={{position:'absolute',left:10,top:20,zIndex:1}}>Below</Label></SceneLayer>)
    expect(container.querySelector('[data-presentation-entity]')).toBe(node)
    expect(node?.getAttribute('data-motion-initial')).toBe('false')
    expect(container.querySelector('[data-presentation-appear]')).toBeNull()
    expect((node as HTMLElement).style.zIndex).toBe('2')
    expect((node as HTMLElement).style.left).toBe('10px')
  })
  it('I-8 exposes custom class style data hooks on every primitive and raw scene content', () => {
    const primitives = [Box,Label,Arrow,Frame,Emphasis,SymbolChip]
    const {container} = render(<SceneLayer>{primitives.map((Node, i) => <Node key={i} id={`id-${i}`} className="custom" data-local="yes" style={{left:42}}>Node</Node>)}<div data-raw-motion-compatible="yes" /></SceneLayer>)
    for (const node of container.querySelectorAll('[data-presentation-node]')) {
      expect(node.className).toBe('custom')
      expect(node.getAttribute('data-local')).toBe('yes')
      expect((node as HTMLElement).style.left).toBe('42px')
    }
    expect(container.querySelector('[data-raw-motion-compatible]')).toBeTruthy()
    expect((container.firstElementChild as HTMLElement).style.position).toBe('absolute')
  })
  it('I-10 supplies default attribution hook and opt-in branding', () => {
    const {rerender} = render(<Presentation steps={steps} title="Demo" />)
    const link = screen.getByRole('link', {name:'made by and-scene'})
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    const slot = document.querySelector('[data-presentation-attribution-slot]') as HTMLElement
    expect(slot.style.bottom).toBe('0px'); expect(slot.style.right).toBe('0px')
    rerender(<Presentation steps={steps} title="Demo" brand={<a href="/">Host</a>} attribution={<span>Custom credit</span>} />)
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('Host')
    expect(screen.queryByText('made by and-scene')).toBeNull()
  })
})

describe('modes and chrome', () => {
  it('I-11 present is title focused with reading and navigation chrome hidden', () => {
    render(<Presentation steps={steps} title="Demo" initialMode="present" />)
    expect(screen.getByRole('heading').textContent).toBe('First')
    expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    for(const hook of ['caption','toc','progress','prev','next']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    expect((screen.getByRole('heading') as HTMLElement).style.whiteSpace).toBe('nowrap')
  })
  it('I-12 browse shows reading chrome and responsive ToC', () => {
    Object.defineProperty(window, 'innerWidth', {value:1280,writable:true})
    render(<Presentation steps={steps} title="Demo" />)
    for(const hook of ['title','caption','toc','progress','prev','next']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
    act(() => {window.innerWidth=480;window.dispatchEvent(new Event('resize'))})
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
    expect(document.querySelector('[data-presentation-caption]')?.tagName).toBe('P')
  })
  it('I-13 initial modes and P toggles preserve the active position', () => {
    render(<Presentation steps={steps} title="Demo" initialMode="browse" />)
    key('ArrowRight'); key('p')
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    expect(root().getAttribute('data-step-index')).toBe('1')
    key('P')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    expect(root().getAttribute('data-step-index')).toBe('1')
  })
  it('I-16 direct progress and era jumps select intended steps', () => {
    window.innerWidth=1280
    render(<Presentation steps={steps} title="Demo" />)
    fireEvent.click(screen.getByRole('button',{name:'Step 2: Second'}))
    expect(root().getAttribute('data-step-index')).toBe('1')
    fireEvent.click(screen.getByRole('button',{name:'finish'}))
    expect(root().getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button',{name:'start'}))
    expect(root().getAttribute('data-step-index')).toBe('0')
    expect(eras(steps)).toEqual([{era:'start',index:0},{era:'finish',index:2}])
  })
  it('I-17 active semantic and stable hooks update with step and era', () => {
    window.innerWidth=1280
    render(<Presentation steps={steps} title="Demo" />)
    const first = screen.getByRole('button',{name:'Step 1: First'})
    expect(first.getAttribute('aria-current')).toBe('step')
    expect(first.getAttribute('data-presentation-active')).toBe('true')
    key('ArrowRight'); key('ArrowRight')
    expect(first.getAttribute('aria-current')).toBeNull()
    expect(first.getAttribute('data-presentation-active')).toBe('false')
    expect(screen.getByRole('button',{name:'finish'}).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button',{name:'start'}).getAttribute('data-presentation-active')).toBe('false')
  })
})

describe('navigation input', () => {
  it.each(['ArrowRight',' ','PageDown'])('I-14 next key %s advances exactly once', nextKey => {
    const {result} = renderHook(() => usePresentationNav(4))
    act(() => key(nextKey))
    expect(result.current.index).toBe(1)
  })
  it.each(['ArrowLeft','PageUp'])('I-14 previous key %s reverses exactly once', prevKey => {
    const {result} = renderHook(() => usePresentationNav(4))
    act(() => result.current.jump(2)); act(() => key(prevKey))
    expect(result.current.index).toBe(1)
  })
  it('I-15 horizontal swipes navigate while vertical and short gestures do not', () => {
    render(<Presentation steps={steps} title="Demo" />)
    const swipe = (x:number,y:number) => {fireEvent.touchStart(root(),{touches:[{clientX:150,clientY:150}]});fireEvent.touchEnd(root(),{changedTouches:[{clientX:x,clientY:y}]})}
    swipe(50,155); expect(root().getAttribute('data-step-index')).toBe('1')
    swipe(250,155); expect(root().getAttribute('data-step-index')).toBe('0')
    swipe(160,300); swipe(140,150)
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.touchEnd(root(),{changedTouches:[{clientX:0,clientY:0}]})
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
  it.each(['button','a','input','select','textarea','div'])('I-18 focused %s retains navigation and mode keys', tag => {
    render(<Presentation steps={steps} title="Demo" />)
    const control = document.createElement(tag)
    if(tag==='div') control.setAttribute('contenteditable','true')
    if(tag==='a') control.setAttribute('href','#')
    document.body.appendChild(control); control.focus()
    for(const value of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','p']) {
      const event = new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true})
      act(() => control.dispatchEvent(event))
      expect(event.defaultPrevented).toBe(false)
      expect(root().getAttribute('data-step-index')).toBe('0')
      expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    }
    control.remove()
  })
  it('I-19 clamps next previous keys swipe and jumps at both ends including one step', () => {
    const {result} = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev()); expect(result.current.index).toBe(0)
    act(() => key('PageUp')); expect(result.current.index).toBe(0)
    act(() => result.current.jump(99)); expect(result.current.index).toBe(2)
    act(() => result.current.next()); act(() => key('ArrowRight')); expect(result.current.index).toBe(2)
    act(() => result.current.jump(-9)); expect(result.current.index).toBe(0)
    expect(clampStep(9,1)).toBe(0); expect(clampStep(-1,1)).toBe(0)
    cleanup()
    render(<Presentation steps={[steps[0]]} title="Single" />)
    fireEvent.touchStart(root(),{touches:[{clientX:200,clientY:10}]});fireEvent.touchEnd(root(),{changedTouches:[{clientX:0,clientY:10}]})
    expect(root().getAttribute('data-step-index')).toBe('0')
    fireEvent.touchStart(root(),{touches:[{clientX:0,clientY:10}]});fireEvent.touchEnd(root(),{changedTouches:[{clientX:200,clientY:10}]})
    expect(root().getAttribute('data-step-index')).toBe('0')
  })
})

describe('canvas fit', () => {
  it('I-20 scales uniformly within mode geometry without internal reflow', () => {
    expect(fitScale(880,380)).toBe(1)
    expect(fitScale(440,380)).toBe(0.5)
    expect(fitScale(880,190)).toBe(0.5)
    expect(stageGeometry(1280,'browse').left).toBeGreaterThan(stageGeometry(480,'browse').left)
    expect(stageGeometry(1280,'present').bottom).toBeLessThan(stageGeometry(1280,'browse').bottom)
    const {result} = renderHook(() => useFitScale('browse'))
    const prior = result.current.scale
    act(() => {window.innerWidth=480;window.dispatchEvent(new Event('resize'))})
    expect(result.current.scale).toBeLessThan(prior)
    cleanup()
    render(<Presentation steps={steps} title="Demo" />)
    const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
    expect(canvas.style.transform).toMatch(/^scale\([\d.]+\)$/)
    expect(document.querySelector('[data-presentation-entity]')?.textContent).toBe('A')
  })
})
