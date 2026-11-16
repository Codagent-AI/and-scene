import { useEffect } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, Appear, ENTER_DELAY, LAYOUT_T, type SceneProps, type Step } from '../src/presentation-kit'
import { appearance } from '../src/presentation-kit/nodes/Appear'
import { usePresentationNav, clamp } from '../src/presentation-kit/usePresentationNav'
import { fitGeometry } from '../src/presentation-kit/useFitScale'
import { Stage } from '../src/presentation-kit/Stage'
import { eras } from '../src/presentation-kit/chrome/Toc'
vi.mock('motion/react', () => ({
  motion: { div: ({ layoutId, layout, initial, animate, exit, transition, ...props }: Record<string, unknown>) => <div {...props} data-layoutid={layoutId} data-layout={String(layout)} data-initial={JSON.stringify(initial)} data-animate={JSON.stringify(animate)} data-exit={JSON.stringify(exit)} data-transition={JSON.stringify(transition)} /> },
  LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))
function Scene({ payload }: SceneProps<string>) { return <Box entityId="test:anchor">{payload}</Box> }
const steps: Step<string>[] = ['A','B','C'].map((s, i) => ({ id: s, era: i < 2 ? 'opening' : 'closing', title: `Title ${s}`, caption: `Caption ${s}`, payload: `Diagram ${s}`, groupKey: 'shared', Scene }))
function viewport(width = 1440, height = 900) { window.innerWidth = width; window.innerHeight = height; fireEvent(window, new Event('resize')) }
describe('runtime contracts', () => {
  it('I-1 active narration identity and diagram', () => {
    render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByRole('heading').textContent).toBe('Title A')
    expect(screen.getByText('Caption A')).toBeTruthy(); expect(screen.getByText('Diagram A')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Next →' }))
    expect(screen.getByRole('heading').textContent).toBe('Title B'); expect(screen.getByText('Caption B')).toBeTruthy()
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  })
  it('I-2 order derived numbers after insertion removal and reorder', () => {
    const { rerender } = render(<Presentation steps={[steps[2],steps[0]]} title="Test" />)
    expect(screen.getByRole('button', { name: 'Step 1: Title C' }).textContent).toBe('1')
    rerender(<Presentation steps={[steps[1],steps[2],steps[0]]} title="Test" />)
    expect(screen.getByRole('button', { name: 'Step 3: Title A' }).textContent).toBe('3')
    rerender(<Presentation steps={[steps[0]]} title="Test" />)
    expect(screen.queryByRole('button', { name: /Step 2:/ })).toBeNull()
  })
  it('I-4 I-6 newcomers settle and continuing identities retain wrappers', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(appearance.exit.opacity).toBe(0)
    const { rerender } = render(<Appear><Box entityId="anchor" style={{ left: 1, width: 10 }}>before</Box></Appear>)
    const wrapper = document.querySelector('[data-presentation-appear]')
    const entity = document.querySelector('[data-layoutid="anchor"]')
    rerender(<Appear><Box entityId="anchor" style={{ left: 42, width: 80 }} className="emphasized">after</Box></Appear>)
    expect(document.querySelector('[data-presentation-appear]')).toBe(wrapper)
    expect(document.querySelector('[data-layoutid="anchor"]')).toBe(entity)
    expect(entity?.textContent).toBe('after'); expect((entity as HTMLElement).style.left).toBe('42px')
    expect(entity?.getAttribute('data-transition')).toContain('layout')
    expect(wrapper?.getAttribute('data-animate')).toContain('delay')
  })
  it('I-5 grouped instances persist only for matching Scene and group', () => {
    const mount = vi.fn(), unmount = vi.fn(), payload = vi.fn()
    function Stateful({ payload: value }: SceneProps<string>) { useEffect(() => { mount(); return unmount }, []); payload(value); return <span>{value}</span> }
    function Other() { useEffect(() => { mount(); return unmount }, []); return <span>other</span> }
    const base = { ...steps[0], Scene: Stateful }
    const { rerender } = render(<Stage step={base} scale={1} />)
    rerender(<Stage step={{ ...base, id: 'second', payload: 'updated' }} scale={1} />)
    expect(mount).toHaveBeenCalledTimes(1); expect(payload).toHaveBeenLastCalledWith('updated')
    rerender(<Stage step={{ ...base, groupKey: 'new-group' }} scale={1} />)
    expect(mount).toHaveBeenCalledTimes(2); expect(unmount).toHaveBeenCalledTimes(1)
    rerender(<Stage step={{ ...base, Scene: Other, groupKey: 'new-group' }} scale={1} />)
    expect(mount).toHaveBeenCalledTimes(3)
  })
  it('I-7 I-8 primitive hooks forward identity styles classes and data without visual defaults', () => {
    const nodes = [Box,Label,Arrow,Frame,Emphasis,SymbolChip]
    const { container } = render(<SceneLayer>{nodes.map((Node,i) => <Node key={i} entityId={`id-${i}`} className="local" data-owner="author" style={{ position: 'absolute', left: 25, top: 50 }}>node</Node>)}</SceneLayer>)
    for (const node of container.querySelectorAll('[data-presentation-node]')) {
      expect(node.getAttribute('class')).toBe('local'); expect(node.getAttribute('data-owner')).toBe('author')
      expect((node as HTMLElement).style.left).toBe('25px'); expect((node as HTMLElement).style.color).toBe('')
      expect((node as HTMLElement).style.border).toBe(''); expect((node as HTMLElement).style.fontFamily).toBe('')
    }
    expect(container.querySelectorAll('[data-layoutid]').length).toBe(6)
  })
  it('I-9 attribution and opt in branding', () => {
    const { rerender } = render(<Presentation steps={steps} title="Test" />)
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.closest('aside')?.style.right).toBe('24px'); expect(link.closest('aside')?.style.bottom).toBe('16px')
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('')
    rerender(<Presentation steps={steps} title="Test" brand={<a href="/">Host</a>} attribution={<a href="/credits">Credits</a>} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy(); expect(screen.queryByText('made by and-scene')).toBeNull()
  })
  it('I-10 I-11 mode chrome position and responsive ToC', () => {
    viewport()
    render(<Presentation steps={steps} title="Test" />)
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' }); fireEvent.keyDown(window, { key: 'p' })
    expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
    expect(screen.queryByText('Caption B')).toBeNull(); expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.getByRole('heading').style.whiteSpace).toBe('nowrap')
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('02 / opening')
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(screen.getByText('Caption B')).toBeTruthy()
    viewport(390,844); expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeTruthy()
  })
  it('I-11 declared present mode opens without caption', () => {
    render(<Presentation steps={steps} title="Test" initialMode="present" />)
    expect(document.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(screen.queryByText('Caption A')).toBeNull()
  })
  it('I-12 keyboard navigation all aliases and mode key', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const key of ['ArrowRight',' ','PageDown']) act(() => fireEvent.keyDown(window,{key}))
    expect(result.current.index).toBe(3)
    for (const key of ['ArrowLeft','PageUp']) act(() => fireEvent.keyDown(window,{key}))
    expect(result.current.index).toBe(1)
    act(() => fireEvent.keyDown(window,{key:'P'})); expect(result.current.mode).toBe('present')
    act(() => fireEvent.keyDown(window,{key:'p'})); expect(result.current.mode).toBe('browse')
    act(() => fireEvent.keyDown(window,{key:'ArrowRight',ctrlKey:true})); expect(result.current.index).toBe(1)
  })
  it('I-13 swipe directions thresholds vertical and cancellation', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    const swipe = (x: number,y: number) => { fireEvent.touchStart(window,{touches:[{clientX:100,clientY:100}]});fireEvent.touchEnd(window,{changedTouches:[{clientX:x,clientY:y}]}) }
    act(() => swipe(0,100)); expect(result.current.index).toBe(1)
    act(() => swipe(200,100)); expect(result.current.index).toBe(0)
    act(() => swipe(80,100)); act(() => swipe(0,300)); expect(result.current.index).toBe(0)
    act(() => { fireEvent.touchStart(window,{touches:[{clientX:100,clientY:100}]});fireEvent.touchCancel(window);fireEvent.touchEnd(window,{changedTouches:[{clientX:0,clientY:100}]}) });expect(result.current.index).toBe(0)
  })
  it('I-14 direct jumps sections and semantic active hooks', () => {
    viewport(); render(<Presentation steps={steps} title="Test" />)
    fireEvent.click(screen.getByRole('button',{name:'Step 2: Title B'}))
    expect(screen.getByRole('button',{name:'Step 2: Title B'}).getAttribute('aria-current')).toBe('step')
    expect(screen.getByRole('button',{name:'opening'}).getAttribute('data-presentation-active')).toBe('true')
    fireEvent.click(screen.getByRole('button',{name:'closing'}));expect(screen.getByText('Diagram C')).toBeTruthy()
    fireEvent.click(screen.getByRole('button',{name:'opening'}));expect(screen.getByText('Diagram A')).toBeTruthy()
    expect(screen.getByRole('button',{name:'closing'}).hasAttribute('aria-current')).toBe(false)
    expect(eras([steps[0],steps[2],steps[1]])).toEqual([{era:'opening',index:0},{era:'closing',index:1}])
  })
  it('I-15 focused controls and editable descendants keep keys', () => {
    const { result } = renderHook(() => usePresentationNav(5))
    const { container } = render(<div><button><span>button</span></button><a href="#">link</a><input /><textarea /><select><option>one</option></select><div contentEditable suppressContentEditableWarning><span>edit</span></div><div role="slider" tabIndex={0}>slider</div></div>)
    for (const element of container.querySelectorAll('button,a,input,textarea,select,[contenteditable],[role="slider"],span')) {
      act(() => { for(const key of ['ArrowRight',' ','PageDown','p']) fireEvent.keyDown(element,{key,bubbles:true}) })
      expect(result.current.index).toBe(0);expect(result.current.mode).toBe('browse')
    }
  })
  it('I-16 boundary clamp direct jumps shrink and listener cleanup', () => {
    const { result, rerender, unmount } = renderHook(({count}) => usePresentationNav(count), {initialProps:{count:3}})
    act(() => result.current.prev());expect(result.current.index).toBe(0)
    act(() => { result.current.go(99); result.current.next() });expect(result.current.index).toBe(2)
    act(() => result.current.go(-20));expect(result.current.index).toBe(0)
    act(() => result.current.go(2));rerender({count:1});expect(result.current.index).toBe(0)
    unmount();expect(clamp(20,0)).toBe(0)
    const add=vi.spyOn(window,'addEventListener'),remove=vi.spyOn(window,'removeEventListener')
    const hook=renderHook(()=>usePresentationNav(3));hook.unmount()
    for(const event of ['keydown','touchstart','touchend','touchcancel']) {
      const listener=add.mock.calls.find(c=>c[0]===event)?.[1]
      expect(remove.mock.calls.some(c=>c[0]===event&&c[1]===listener)).toBe(true)
    }
    add.mockRestore();remove.mockRestore()
  })
  it('I-17 uniform fit geometry resize modes and step independent scale', () => {
    for(const mode of ['browse','present'] as const) for(const [w,h] of [[1440,900],[390,844],[800,400],[200,200]]) {
      const fit=fitGeometry(w,h,mode)
      expect(fit.scale*880).toBeLessThanOrEqual(fit.width+.001);expect(fit.scale*380).toBeLessThanOrEqual(fit.height+.001)
    }
    viewport();render(<Presentation steps={steps} title="Test" />)
    const canvas=document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px');expect(canvas.style.height).toBe('380px')
    const scale=canvas.style.transform;fireEvent.keyDown(window,{key:'ArrowRight'});expect(canvas.style.transform).toBe(scale)
    viewport(390,844);expect(canvas.style.transform).not.toBe(scale)
  })
  it('empty presentations reject invalid input', () => { expect(()=>render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step') })
})
