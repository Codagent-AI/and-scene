import { StrictMode, useEffect, useState, type ReactNode } from 'react'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import type { SceneProps, Step } from '../src/presentation-kit/types'

vi.mock('motion/react', () => {
  const Container = ({ children }: { children: ReactNode }) => <>{children}</>
  const Div = ({ layoutId, layout, initial, animate, exit, transition, children, ...props }: Record<string, unknown> & {children?: ReactNode}) => <div {...props} data-layout-id={layoutId} data-layout={layout ? 'true' : undefined} data-initial={JSON.stringify(initial)} data-animate={JSON.stringify(animate)} data-exit={JSON.stringify(exit)} data-transition={JSON.stringify(transition)}>{children}</div>
  return { AnimatePresence: Container, LayoutGroup: Container, motion: { div: Div } }
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })
function Diagram({ payload }: SceneProps<{ count: number }>) { return <Box id="stable" style={{ left: 20, top: 30 }}><span>{payload.count}</span></Box> }
const steps: Step<{count: number}>[] = [0,1,2].map((count) => ({ id: `s${count}`, era: count < 2 ? 'first' : 'second', title: `Title ${count}`, caption: `Caption ${count}`, groupKey: 'same', Scene: Diagram, payload: {count} }))
const key = (value: string, target: Window | Element = window) => fireEvent.keyDown(target, { key: value })

describe('kit contract', () => {
  it('I-1 metadata and numbering follow reordered step positions', () => {
    const {container} = render(<Presentation title="Example" steps={[steps[2],steps[0]]} />)
    expect(screen.getByRole('heading').textContent).toBe('Title 2')
    expect(screen.getByText('Caption 2')).toBeTruthy()
    expect(container.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / second')
    expect(container.querySelector('[data-presentation-root]')?.getAttribute('data-step-count')).toBe('2')
    expect(screen.getByLabelText('Step 1: Title 2')).toBeTruthy()
  })
  it('I-3 primitives project stable identity and sequence entrance after layout with exit', () => {
    const {container, rerender} = render(<Box id="node" style={{left:20}}>Old label</Box>)
    const node = container.firstElementChild
    rerender(<Box id="node" style={{left:40}}>New label</Box>)
    expect(container.firstElementChild).toBe(node)
    expect(node?.getAttribute('data-layout-id')).toBe('node')
    expect(node?.getAttribute('data-layout')).toBe('true')
    expect(node?.getAttribute('data-exit')).toContain('opacity')
    const t = JSON.parse(node!.getAttribute('data-transition')!)
    expect(t.layout.duration).toBe(LAYOUT_T)
    expect(t.opacity.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(t.opacity.duration).toBe(ENTER_T)
    expect(ENTER_DELAY).toBe(LAYOUT_T)
    expect(node?.textContent).toBe('New label')
  })
  it('I-4 same Scene/group retains instance and new payload; changed group or Scene remounts', () => {
    const mounted = vi.fn(), unmounted = vi.fn()
    function Stateful({payload}: SceneProps<{count:number}>) {
      const [identity] = useState(() => Math.random())
      useEffect(() => { mounted(); return unmounted }, [])
      return <output data-instance={identity}>{payload.count}</output>
    }
    const first = {...steps[0], Scene:Stateful}
    const {container,rerender} = render(<Stage step={first} scale={1} />)
    const instance = container.querySelector('output')
    rerender(<Stage step={{...steps[1], Scene:Stateful}} scale={1} />)
    expect(container.querySelector('output')).toBe(instance)
    expect(instance?.textContent).toBe('1')
    expect(mounted).toHaveBeenCalledTimes(1)
    rerender(<Stage step={{...first,groupKey:'other'}} scale={1} />)
    expect(mounted).toHaveBeenCalledTimes(2)
    expect(unmounted).toHaveBeenCalledTimes(1)
    rerender(<Stage step={{...first,groupKey:'other',Scene:Diagram}} scale={1} />)
    expect(unmounted).toHaveBeenCalledTimes(2)
  })
  it('I-5 continuing nodes have no newcomer wrapper and preserve stacked coordinates', () => {
    const {container,rerender} = render(<Stage step={steps[0]} scale={1} />)
    const node=container.querySelector('[data-presentation-entity]')
    rerender(<Stage step={steps[1]} scale={1} />)
    expect(container.querySelector('[data-presentation-entity]')).toBe(node)
    expect(node?.closest('[data-presentation-appear]')).toBeNull()
    expect((node as HTMLElement).style.left).toBe('20px')
    expect((node as HTMLElement).style.top).toBe('30px')
  })
  it('I-7 forwards author hooks and coordinates without visual defaults', () => {
    const {container}=render(<SceneLayer><Box id="x" className="author" data-custom="yes" style={{left:32,color:'red'}}>X</Box><Appear>new</Appear></SceneLayer>)
    const node=container.querySelector('[data-presentation-entity="x"]') as HTMLElement
    expect(node.className).toBe('author'); expect(node.dataset.custom).toBe('yes')
    expect(node.style.left).toBe('32px'); expect(node.style.color).toBe('red')
    expect(node.style.border).toBe(''); expect(node.style.fontFamily).toBe('')
    expect((container.firstElementChild as HTMLElement).style.position).toBe('absolute')
  })
  it('I-8 attribution defaults to repository link and header branding is opt-in', () => {
    const {container,rerender}=render(<Presentation title="Example" steps={steps} />)
    const link=screen.getByRole('link',{name:'made by and-scene'})
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect((link.parentElement as HTMLElement).style.right).toBe('16px')
    expect(container.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    rerender(<Presentation title="Example" steps={steps} brand={<a href="/host">Host</a>} />)
    expect(screen.getByRole('link',{name:'Host'})).toBeTruthy()
  })
  it('I-9 present mode hides reading chrome and shows marker title', () => {
    const {container}=render(<Presentation title="Example" steps={steps} initialMode="present" />)
    expect(screen.getByRole('heading').textContent).toBe('Title 0')
    for(const hook of ['caption','toc','navigation','progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
    expect(container.querySelector('[data-presentation-marker]')).toBeTruthy()
  })
  it('I-10 browse chrome includes caption controls progress and responsive ToC', () => {
    vi.stubGlobal('innerWidth',1280)
    const {container}=render(<Presentation title="Example" steps={steps} />)
    for(const hook of ['caption','toc','navigation','progress']) expect(container.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
    act(()=> { window.innerWidth=600; fireEvent(window,new Event('resize')) })
    expect(container.querySelector('[data-presentation-toc]')).toBeNull()
    vi.unstubAllGlobals()
  })
  it('I-11 initial modes and toggles preserve current step', () => {
    const {result}=renderHook(()=>usePresentationNav(4,'present'))
    expect(result.current.mode).toBe('present')
    act(()=>result.current.jump(2)); act(()=>result.current.toggleMode())
    expect(result.current.mode).toBe('browse'); expect(result.current.index).toBe(2)
    act(()=>key('p')); expect(result.current.mode).toBe('present'); expect(result.current.index).toBe(2)
  })
  it('I-12 keyboard mappings change exactly one step and unrelated keys do nothing', () => {
    const {result}=renderHook(()=>usePresentationNav(20))
    for(const k of ['ArrowRight',' ','PageDown']) { const before=result.current.index; act(()=>key(k)); expect(result.current.index).toBe(before+1) }
    for(const k of ['ArrowLeft','PageUp']) { const before=result.current.index; act(()=>key(k)); expect(result.current.index).toBe(before-1) }
    act(()=>key('Escape')); expect(result.current.index).toBe(1)
  })
  it('I-13 left/right touch swipes navigate while vertical short and cancelled swipes do not', () => {
    const {result}=renderHook(()=>usePresentationNav(4))
    const swipe=(x:number,y:number)=> {fireEvent.touchStart(window,{touches:[{clientX:100,clientY:100}]});fireEvent.touchEnd(window,{changedTouches:[{clientX:x,clientY:y}]})}
    act(()=>swipe(20,100)); expect(result.current.index).toBe(1)
    act(()=>swipe(180,100)); expect(result.current.index).toBe(0)
    act(()=>swipe(80,100)); act(()=>swipe(50,300)); expect(result.current.index).toBe(0)
    act(()=> {fireEvent.touchStart(window,{touches:[{clientX:100,clientY:100}]}); fireEvent.touchCancel(window); fireEvent.touchEnd(window,{changedTouches:[{clientX:0,clientY:100}]})});expect(result.current.index).toBe(0)
  })
  it('I-14 direct progress and era jumps expose matching active semantics', () => {
    vi.stubGlobal('innerWidth',1280)
    const {container}=render(<Presentation title="Example" steps={steps} />)
    fireEvent.click(screen.getByLabelText('Step 2: Title 1'))
    expect(screen.getByLabelText('Step 2: Title 1').getAttribute('aria-current')).toBe('step')
    expect(screen.getByLabelText('Step 2: Title 1').getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByRole('button',{name:'second'})); expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByRole('button',{name:'first'})); expect(container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
    expect(screen.getByRole('button',{name:'first'}).getAttribute('aria-current')).toBe('step')
    vi.unstubAllGlobals()
  })
  it('I-15 focused controls retain navigation keys', () => {
    const {result}=renderHook(()=>usePresentationNav(4))
    const {container}=render(<><button>Button</button><a href="#">Link</a><input/><textarea/><select/><div contentEditable/><div role="slider"/></>)
    for(const control of Array.from(container.children)) for(const k of ['ArrowRight',' ','PageDown','p']) act(()=>key(k,control))
    expect(result.current.index).toBe(0);expect(result.current.mode).toBe('browse')
  })
  it('I-16 clamps previous next and direct jumps at both ends', () => {
    const {result}=renderHook(()=>usePresentationNav(3))
    act(()=>result.current.prev()); expect(result.current.index).toBe(0)
    act(()=>result.current.jump(-40));expect(result.current.index).toBe(0)
    act(()=>result.current.jump(40));expect(result.current.index).toBe(2)
    act(()=>result.current.next());expect(result.current.index).toBe(2)
    act(()=>key('ArrowRight'));expect(result.current.index).toBe(2)
  })
  it('I-17 fit scaling is uniform across viewport geometries and fixed within mode', () => {
    expect(DESIGN_W).toBe(880);expect(DESIGN_H).toBe(380)
    expect(fitScale(928,680,'browse')).toBe(1)
    expect(fitScale(488,1000,'browse')).toBe(0.5)
    expect(fitScale(1000,490,'browse')).toBe(0.5)
    expect(fitScale(1000,360,'present')).toBe(0.5)
    expect(fitScale(10,10,'browse')).toBe(0)
    const {result}=renderHook(()=>useFitScale('browse'))
    const scale=result.current; act(()=>key('ArrowRight'));expect(result.current).toBe(scale)
    act(()=> { window.innerWidth=488;window.innerHeight=1000;fireEvent(window,new Event('resize')) });expect(result.current).toBe(0.5)
    const {container}=render(<Stage step={steps[0]} scale={0.5}/>)
    const canvas=container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px');expect(canvas.style.height).toBe('380px');expect(canvas.style.transform).toBe('scale(0.5)')
  })
  it('I-18 unmount removes input resize listeners and StrictMode handles keys once', () => {
    const add=vi.spyOn(window,'addEventListener'), remove=vi.spyOn(window,'removeEventListener')
    const {result,unmount}=renderHook(()=> {useFitScale('browse');return usePresentationNav(3)}, {wrapper:StrictMode})
    act(()=>key('ArrowRight'));expect(result.current.index).toBe(1)
    unmount()
    for(const type of ['keydown','touchstart','touchend','touchcancel','resize']) {
      const added=add.mock.calls.filter(c=>c[0]===type), removed=remove.mock.calls.filter(c=>c[0]===type)
      expect(added.length).toBeGreaterThan(0);expect(removed.map(c=>c[1])).toEqual(added.map(c=>c[1]))
    }
  })
  it('I-30 captions update and next/previous controls navigate all steps', () => {
    render(<Presentation title="Example" steps={steps}/>)
    expect(screen.getByLabelText('Previous step').hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByLabelText('Next step'));expect(screen.getByText('Caption 1')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Next step'));expect(screen.getByText('Caption 2')).toBeTruthy()
    expect(screen.getByLabelText('Next step').hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByLabelText('Previous step'));expect(screen.getByText('Caption 1')).toBeTruthy()
    expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption 1')
    expect(document.querySelector('[data-presentation-caption]')).toBeVisible()
  })
})
