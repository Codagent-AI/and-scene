import { describe, it, expect } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation, Box, Appear, SceneLayer } from '../src/presentation-kit'
import type { Step, SceneProps } from '../src/presentation-kit'
import { validateSteps } from '../src/presentation-kit/types'
import { Stage } from '../src/presentation-kit/Stage'
import { LAYOUT_T, ENTER_T, DESIGN_W, DESIGN_H, STAGE_LAYOUT, ATTRIBUTION_URL } from '../src/presentation-kit/constants'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
function Scene({ payload }: SceneProps<number>) { return <Box id="test:entity" style={{ left: payload * 10, width: payload + 100 }} data-emphasis={payload}><span>state {payload}</span></Box> }
const steps: Step<number>[] = [0, 1, 2, 3].map(i => ({ id: `s${i}`, era: i < 2 ? 'intro' : 'end', title: `Title ${i}`, caption: `Caption ${i}. A paragraph.`, Scene, payload: i, groupKey: 'test' }))
const mount = (props = {}) => render(<Presentation title="Test" steps={steps} {...props} />)
const index = () => Number(document.querySelector('[data-presentation]')?.getAttribute('data-step-index'))
const motion = (el: Element) => JSON.parse(el.getAttribute('data-motion')!)
describe('scene kit', () => {
  it('I-1 step contract validates metadata and renders only the active payload', () => {
    expect(() => validateSteps(steps)).not.toThrow()
    expect(() => validateSteps([])).toThrow('at least one')
    for (const key of ['id', 'era', 'title', 'caption']) expect(() => validateSteps([{ ...steps[0], [key]: '' }])).toThrow('Every step')
    expect(() => validateSteps([steps[0], steps[0]])).toThrow('Duplicate')
    expect(() => validateSteps([{ ...steps[0], Scene: undefined } as unknown as Step<number>])).toThrow('Missing scene')
    mount(); expect(screen.getByText('state 0')).toBeTruthy(); expect(screen.queryByText('state 1')).toBeNull()
  })
  it('I-2 numbering follows reordered inserted and removed positions', () => {
    mount({ steps: [steps[3], { ...steps[1], id: 'inserted' }, steps[0]] })
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('01 / end')
    fireEvent.click(screen.getByLabelText('Step 2: Title 1'))
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toContain('02 / intro')
    expect(index()).toBe(1)
  })
  it('I-4 continuing entities keep layout identity while size label position and emphasis change', () => {
    const view = render(<Scene payload={0} />); const node = document.querySelector('[data-presentation-node]')!
    view.rerender(<Scene payload={2} />)
    expect(document.querySelector('[data-presentation-node]')).toBe(node)
    expect(motion(node).layoutId).toBe('test:entity'); expect(motion(node).layout).toBe(true)
    expect(motion(node).transition.layout.duration).toBe(LAYOUT_T.duration)
    expect(node.getAttribute('style')).toContain('left: 20px'); expect(node.getAttribute('style')).toContain('width: 102px')
    expect(node.textContent).toBe('state 2'); expect(node.getAttribute('data-emphasis')).toBe('2')
  })
  it('I-5 entry waits for layout and departure has an immediate exit transition', () => {
    render(<Appear><Box id="new">new</Box></Appear>)
    const config = motion(document.querySelector('[data-presentation-appear]')!)
    expect(config.initial.opacity).toBe(0); expect(config.animate.opacity).toBe(1)
    expect(config.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T.duration)
    expect(config.transition).toEqual(ENTER_T)
    expect(config.exit).toEqual({ opacity: 0, transition: { delay: 0, duration: ENTER_T.duration } })
  })
  it('I-6 grouped scenes retain instance and payload while changed group or component remounts', () => {
    let mounts = 0, unmounts = 0
    function Tracked({ payload }: SceneProps<number>) { useEffect(() => { mounts++; return () => { unmounts++ } }, []); return <span>{payload}</span> }
    const a = { ...steps[0], Scene: Tracked }
    const view = render(<Stage step={a} scale={1} />)
    view.rerender(<Stage step={{ ...a, id: 'next', payload: 2 }} scale={1} />)
    expect(mounts).toBe(1); expect(unmounts).toBe(0); expect(screen.getByText('2')).toBeTruthy()
    view.rerender(<Stage step={{ ...a, groupKey: 'different' }} scale={1} />)
    expect(mounts).toBe(2); expect(unmounts).toBe(1)
    view.rerender(<Stage step={{ ...a, Scene }} scale={1} />); expect(unmounts).toBe(2)
  })
  it('I-7 grouped continuing nodes avoid entry fades and overlapping layer coordinates stay literal', () => {
    const view = render(<Stage step={steps[0]} scale={1} />)
    const node = document.querySelector('[data-presentation-node]')!
    view.rerender(<Stage step={steps[1]} scale={1} />)
    expect(document.querySelector('[data-presentation-node]')).toBe(node)
    expect(motion(node).initial).toBeUndefined(); expect(node.closest('[data-presentation-appear]')).toBeNull()
    render(<SceneLayer><Box id="a" style={{ position: 'absolute', left: 20, top: 30 }}>A</Box><Box id="b" style={{ position: 'absolute', left: 20, top: 30 }}>B</Box></SceneLayer>)
    expect(screen.getByText('A').getAttribute('style')).toEqual(screen.getByText('B').getAttribute('style'))
    expect(document.querySelector('[data-presentation-layer]')?.getAttribute('style')).toContain('position: absolute')
  })
  it('I-8 unstyled nodes expose hooks and forward author styles without visual defaults', () => {
    render(<Box id="hook" className="local" data-local="yes" style={{ left: 10 }}>unstyled</Box>)
    const box = screen.getByText('unstyled'); expect(box.className).toBe('local'); expect(box.getAttribute('data-local')).toBe('yes')
    expect(box.getAttribute('data-presentation-node')).toBe('box'); expect(box.getAttribute('style')).toBe('left: 10px;')
  })
  it('I-9 default attribution has text destination hook and bottom right geometry with opt-in brand', () => {
    const view = mount(); const link = screen.getByText('made by and-scene')
    expect(link.getAttribute('href')).toBe(ATTRIBUTION_URL); expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.style.right).toBe('16px'); expect(link.style.bottom).toBe('12px')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    view.rerender(<Presentation title="T" steps={steps} brand={<a href="/">Host</a>} />)
    expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe('Host')
  })
  it('I-10 present mode shows marker and title and hides reading and navigation chrome', () => {
    mount({ initialMode: 'present' }); expect(screen.getByText('Title 0')).toBeTruthy()
    expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    for (const hook of ['caption','toc','navigation','progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
  it('I-11 browse mode exposes reading chrome and ToC only for wide viewports', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true }); mount()
    for (const hook of ['title','caption','toc','navigation','progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
    act(() => { window.innerWidth = 400; window.dispatchEvent(new Event('resize')) })
    expect(document.querySelector('[data-presentation-toc]')).toBeNull()
  })
  it('I-12 initial mode and toggles preserve the middle step', () => {
    const { result } = renderHook(() => usePresentationNav(4, 'present'))
    expect(result.current.mode).toBe('present'); act(() => result.current.jump(2)); act(() => result.current.toggle())
    expect(result.current.mode).toBe('browse'); expect(result.current.index).toBe(2)
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' })))
    expect(result.current.mode).toBe('present'); expect(result.current.index).toBe(2)
  })
  it('I-13 all keyboard aliases navigate once and prevent default', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const key of ['ArrowRight', ' ', 'PageDown']) { const old = result.current.index; const event = new KeyboardEvent('keydown', { key, cancelable: true }); act(() => window.dispatchEvent(event)); expect(result.current.index).toBe(old+1); expect(event.defaultPrevented).toBe(true) }
    for (const key of ['ArrowLeft', 'PageUp']) { const old = result.current.index; act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key }))); expect(result.current.index).toBe(old-1) }
  })
  it('I-14 horizontal swipes navigate but vertical and short gestures do not', () => {
    mount(); const root = document.querySelector('[data-presentation]')!
    const swipe = (x: number, y: number) => { fireEvent.touchStart(root, { changedTouches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(root, { changedTouches: [{ clientX: x, clientY: y }] }) }
    swipe(20,100); expect(index()).toBe(1); swipe(190,100); expect(index()).toBe(0)
    swipe(90,100); swipe(80,200); expect(index()).toBe(0)
  })
  it('I-15 direct progress and era jumps select intended indices', () => {
    window.innerWidth = 1440; mount(); fireEvent.click(screen.getByLabelText('Step 4: Title 3')); expect(index()).toBe(3)
    fireEvent.click(screen.getByText('end')); expect(index()).toBe(2)
    fireEvent.click(screen.getByText('intro')); expect(index()).toBe(0)
  })
  it('I-16 active semantic and styling hooks follow sequential and direct navigation', () => {
    window.innerWidth = 1440; mount(); fireEvent.click(screen.getByLabelText('Next step'))
    expect(screen.getByLabelText('Step 2: Title 1').getAttribute('aria-current')).toBe('step')
    expect(screen.getByLabelText('Step 1: Title 0').getAttribute('data-presentation-active')).toBe('false')
    fireEvent.click(screen.getByLabelText('Step 4: Title 3'))
    expect(screen.getByText('end').getAttribute('aria-current')).toBe('step')
    expect(screen.getByText('end').getAttribute('data-presentation-active')).toBe('true')
  })
  it('I-17 interactive elements keep their navigation keys', () => {
    mount()
    for (const tag of ['button','a','input','textarea','select','summary','div']) {
      const el = document.createElement(tag); if(tag === 'div') el.setAttribute('contenteditable','true'); document.body.append(el); el.focus()
      for(const key of ['ArrowRight',' ','PageDown','ArrowLeft','PageUp','p']) fireEvent.keyDown(el,{key})
      expect(index()).toBe(0); expect(document.querySelector('[data-presentation]')?.getAttribute('data-presentation-mode')).toBe('browse'); el.remove()
    }
  })
  it('I-18 boundaries clamp repeatedly through previous next and jump actions', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => { result.current.prev(); result.current.prev() }); expect(result.current.index).toBe(0)
    act(() => { result.current.next(); result.current.next(); result.current.next() }); expect(result.current.index).toBe(2)
    act(() => result.current.jump(-10)); expect(result.current.index).toBe(0)
    act(() => result.current.jump(40)); expect(result.current.index).toBe(2)
  })
  it('I-38 public step hooks expose count and active index after navigation', () => {
    mount()
    const root = document.querySelector('[data-presentation]')!
    expect(root.getAttribute('data-step-count')).toBe(String(steps.length))
    expect(root.getAttribute('data-step-index')).toBe('0')
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(root.getAttribute('data-step-count')).toBe('4')
    expect(root.getAttribute('data-step-index')).toBe('1')
    fireEvent.click(screen.getByLabelText('Step 4: Title 3'))
    expect(root.getAttribute('data-step-index')).toBe('3')
    expect(root.getAttribute('data-step-count')).toBe('4')
  })
  it('I-19 fixed canvas fit is uniform per mode and responds to viewport resize', () => {
    expect([DESIGN_W,DESIGN_H]).toEqual([880,380])
    for(const mode of ['browse','present'] as const) for(const [w,h] of [[1440,900],[390,844],[1200,350],[20,20]]) {
      const s = fitScale(w,h,mode), g = STAGE_LAYOUT[mode]; expect(s).toBeGreaterThanOrEqual(0)
      expect(s * 880).toBeLessThanOrEqual(Math.max(0,w-g.left-g.right)); expect(s * 380).toBeLessThanOrEqual(Math.max(0,h-g.top-g.bottom))
    }
    const { result } = renderHook(() => useFitScale('browse')); const old = result.current
    act(() => { window.innerWidth = 300; window.innerHeight = 700; window.dispatchEvent(new Event('resize')) }); expect(result.current).not.toBe(old)
    mount(); const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); expect(canvas.style.transform).toMatch(/^scale\(/)
  })
})
