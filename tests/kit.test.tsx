import { AnimatePresence } from 'motion/react'
import { StrictMode, useEffect } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { fireEvent, render, renderHook, act, screen, waitFor } from '@testing-library/react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { Stage } from '../src/presentation-kit/Stage'
import { sceneKey } from '../src/presentation-kit/sceneKey'
import { validateSteps } from '../src/presentation-kit/types'
import type { Step, SceneProps } from '../src/presentation-kit/types'
import { usePresentationNav } from '../src/presentation-kit/usePresentationNav'
import { fitScale, useFitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T, enterMotion } from '../src/presentation-kit/constants'
import { Box } from '../src/presentation-kit/nodes/Box'
import { Label } from '../src/presentation-kit/nodes/Label'
import { Arrow } from '../src/presentation-kit/nodes/Arrow'
import { Frame } from '../src/presentation-kit/nodes/Frame'
import { Emphasis } from '../src/presentation-kit/nodes/Emphasis'
import { SymbolChip } from '../src/presentation-kit/nodes/SymbolChip'
import { SceneLayer } from '../src/presentation-kit/nodes/SceneLayer'
import { Appear } from '../src/presentation-kit/nodes/Appear'
import { Router } from '../src/Router'
import { resolveRoute } from '../src/routes'
import { eraEntries } from '../src/presentation-kit/eras'
import { STEPS, Story } from '../src/presentations/how-to-make-a-presentation/steps/Story'
import { positions, visibleEntities } from '../src/presentations/how-to-make-a-presentation/entities'
import { UserRound } from 'lucide-react'
function Scene({ payload }: SceneProps<number>) { return <Box id="test:entity" style={{ left: payload, position: 'absolute' }}>state {payload}</Box> }
const steps: Step<number>[] = [
  { id: 'a', era: 'opening', title: 'First title', caption: 'First paragraph.', Scene, payload: 10, groupKey: 'one' },
  { id: 'b', era: 'opening', title: 'Second title', caption: 'Second paragraph.', Scene, payload: 20, groupKey: 'one' },
  { id: 'c', era: 'closing', title: 'Third title', caption: 'Third paragraph.', Scene, payload: 30, groupKey: 'one' },
]
function show(props = {}) { return render(<Presentation title="Test presentation" steps={steps} {...props} />) }
const key = (key: string, target: EventTarget = window) => fireEvent.keyDown(target, { key })
const root = () => document.querySelector('[data-presentation]')!
describe('scene contracts', () => {
  test('I-1 required metadata and active diagram', () => {
    expect(() => validateSteps([])).toThrow('at least one')
    expect(() => validateSteps([{ ...steps[0], caption: '' }])).toThrow('Incomplete')
    expect(() => validateSteps([steps[0], steps[0]])).toThrow('Duplicate')
    show(); expect(root().getAttribute('data-step-id')).toBe('a')
    expect(screen.getByText('First title')).toBeTruthy(); expect(screen.getByText('First paragraph.')).toBeTruthy()
    key('ArrowRight'); expect(screen.getByText('state 20')).toBeTruthy(); expect(root().getAttribute('data-step-era')).toBe('opening')
  })
  test('I-2 numbering derives from reordered inserted removed positions', () => {
    const { rerender } = show()
    rerender(<Presentation title="Test" steps={[steps[2], steps[0]]} />)
    expect(screen.getByLabelText('Step 1: Third title')).toBeTruthy()
    expect(screen.queryByLabelText('Step 3: Third title')).toBeNull()
    rerender(<Presentation title="Test" steps={[steps[1], steps[2], steps[0]]} />)
    expect(screen.getByLabelText('Step 3: First title')).toBeTruthy()
  })
  test('I-4 continuing entity keeps DOM identity and updates position and content', () => {
    show(); const entity = document.querySelector('[data-presentation-node="box"]')
    key('ArrowRight'); expect(document.querySelector('[data-presentation-node="box"]')).toBe(entity)
    expect((entity as HTMLElement).style.left).toBe('20px'); expect(entity?.textContent).toBe('state 20')
  })
  test('I-5 newcomer waits for layout and removed entity fades before unmount', async () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T); expect(ENTER_T).toBeGreaterThan(0)
    expect(enterMotion.initial.opacity).toBe(0); expect(enterMotion.animate.opacity).toBe(1); expect(enterMotion.exit.opacity).toBe(0)
    const completed = vi.fn()
    const { rerender } = render(<AnimatePresence><Appear key="entity" onAnimationComplete={completed}><span>new</span></Appear></AnimatePresence>)
    const element = document.querySelector('[data-presentation-appear]') as HTMLElement
    expect(element.style.opacity).toBe('0')
    await new Promise(resolve => setTimeout(resolve, 250))
    expect(element.style.opacity).toBe('0')
    await waitFor(() => expect(element.style.opacity).toBe('1'), { timeout: 2000 })
    completed.mockClear()
    rerender(<AnimatePresence>{null}</AnimatePresence>)
    expect(element.isConnected).toBe(true)
    await waitFor(() => { const opacity = Number(element.style.opacity); expect(opacity).toBeGreaterThan(0); expect(opacity).toBeLessThan(1) }, { timeout: 2000, interval: 10 })
    await waitFor(() => expect(element.isConnected).toBe(false), { timeout: 2000 })
    expect(completed.mock.calls[0][0]).toEqual({ opacity: 0 })
  })
  test('I-6 grouped scene retains mounted instance and distinguishes component or group changes', () => {
    let mounts = 0, unmounts = 0
    function Persistent({ payload }: SceneProps<number>) { useEffect(() => { mounts++; return () => { unmounts++ } }, []); return <span>{payload}</span> }
    const grouped = steps.map(s => ({ ...s, Scene: Persistent }))
    const { rerender, unmount } = render(<Stage step={grouped[0]} scale={1} />)
    rerender(<Stage step={grouped[1]} scale={1} />)
    expect(mounts).toBe(1); expect(unmounts).toBe(0); expect(screen.getByText('20')).toBeTruthy()
    expect(sceneKey(grouped[0])).toBe(sceneKey(grouped[1]))
    expect(sceneKey({ ...grouped[0], groupKey: 'other' })).not.toBe(sceneKey(grouped[0]))
    expect(sceneKey({ ...grouped[0], Scene })).not.toBe(sceneKey(grouped[0]))
    rerender(<Stage step={{ ...grouped[1], groupKey: 'other' }} scale={1} />); expect(mounts).toBe(2)
    unmount(); expect(unmounts).toBe(2)
  })
  test('I-7 grouped composition preserves overlapping coordinates and stacking', () => {
    function Overlap({ payload }: SceneProps<number>) { return <SceneLayer><Box id="back" style={{ left: 100, top: 100, position: 'absolute', zIndex: 1 }}>back {payload}</Box><Box id="front" data-presentation-allow-overlap="" style={{ left: 110, top: 100, position: 'absolute', zIndex: 2 }}>front</Box></SceneLayer> }
    const { rerender } = render(<Stage step={{ ...steps[0], Scene: Overlap }} scale={1} />)
    const front = screen.getByText('front'); rerender(<Stage step={{ ...steps[1], Scene: Overlap }} scale={1} />)
    expect(screen.getByText('front')).toBe(front); expect(front.style.left).toBe('110px'); expect(front.style.zIndex).toBe('2')
  })
  test('I-8 primitives forward author hooks coordinates classes and glyphs', () => {
    render(<><Box id="box" Icon={UserRound} className="local" style={{ position: 'absolute', left: 14 }} data-author="yes">box</Box>{[Label, Arrow, Frame, Emphasis, SymbolChip].map((Node, i) => <Node key={i} id={`node-${i}`} data-author="yes">{i}</Node>)}</>)
    const box = screen.getByText('box'); expect(box.className).toBe('local'); expect(box.style.left).toBe('14px'); expect(box.getAttribute('data-author')).toBe('yes')
    expect(box.querySelector('svg')).toBeTruthy(); expect(document.querySelectorAll('[data-author="yes"]')).toHaveLength(6)
  })
})
describe('chrome', () => {
  test('I-10 default attribution has project destination hook and bottom-right geometry', () => {
    show(); const a = screen.getByRole('link', { name: 'made by and-scene' })
    expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene'); expect(a.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(a.parentElement?.style.right).toBe('24px'); expect(a.parentElement?.style.bottom).toBe('12px')
  })
  test('I-11 branding is opt-in', () => {
    const { rerender } = show(); expect(document.querySelector('header a')).toBeNull()
    rerender(<Presentation steps={steps} title="Test" brand={<a href="/">Host brand</a>} />)
    expect(screen.getByRole('link', { name: 'Host brand' })).toBeTruthy()
  })
  test('I-12 present chrome is title-focused', () => {
    show({ initialMode: 'present' }); expect(screen.getByText('First title')).toBeTruthy()
    expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    for (const hook of ['caption', 'toc', 'prev', 'next', 'progress']) expect(document.querySelector(`[data-presentation-${hook}]`)).toBeNull()
  })
  test('I-13 browse chrome and wide-only ToC', () => {
    window.innerWidth = 1400; const { rerender } = show()
    expect(screen.getByText('First paragraph.')).toBeTruthy(); expect(screen.getByLabelText('Sections')).toBeTruthy()
    expect(screen.getByLabelText('Steps')).toBeTruthy(); expect(screen.getByLabelText('Next step')).toBeTruthy()
    act(() => { window.innerWidth = 390; fireEvent(window, new Event('resize')) }); rerender(<Presentation steps={steps} title="Test" />)
    expect(screen.queryByLabelText('Sections')).toBeNull()
    window.innerWidth = 1400
  })
  test('I-14 initial modes toggle with P and preserve index', () => {
    show(); key('ArrowRight'); key('p'); expect(root().getAttribute('data-presentation-mode')).toBe('present'); expect(root().getAttribute('data-step-index')).toBe('1')
    fireEvent.click(screen.getByLabelText('Switch to browse mode')); expect(root().getAttribute('data-step-index')).toBe('1'); expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  })
  test('I-17 direct jumps and section-first navigation', () => {
    window.innerWidth = 1400; show(); fireEvent.click(screen.getByLabelText('Step 2: Second title')); expect(root().getAttribute('data-step-index')).toBe('1')
    fireEvent.click(screen.getByText('closing')); expect(root().getAttribute('data-step-index')).toBe('2')
    fireEvent.click(screen.getByText('opening')); expect(root().getAttribute('data-step-index')).toBe('0')
    expect(eraEntries(steps)).toEqual([{ era: 'opening', index: 0 }, { era: 'closing', index: 2 }])
  })
  test('I-18 active semantic state and hooks follow navigation', () => {
    window.innerWidth = 1400; show(); key('ArrowRight')
    expect(screen.getByLabelText('Step 2: Second title').getAttribute('aria-current')).toBe('step')
    expect(screen.getByText('opening').getAttribute('data-presentation-active')).toBe('true')
    key('ArrowRight'); expect(screen.getByText('closing').getAttribute('aria-current')).toBe('step'); expect(screen.getByText('opening').getAttribute('data-presentation-active')).toBe('false')
  })
  test('I-36 each browse caption and next/previous controls work', () => {
    show()
    for (let i = 0; i < steps.length; i++) { expect(screen.getByText(steps[i].caption)).toBeTruthy(); if (i < steps.length - 1) fireEvent.click(screen.getByLabelText('Next step')) }
    fireEvent.click(screen.getByLabelText('Previous step')); expect(root().getAttribute('data-step-index')).toBe('1')
  })
  test('I-42 public count and index hooks enumerate current steps', () => {
    show(); expect(root().getAttribute('data-step-count')).toBe('3'); expect(root().getAttribute('data-step-index')).toBe('0')
    key('ArrowRight'); expect(root().getAttribute('data-step-index')).toBe('1')
  })
})
describe('navigation and scaling', () => {
  test('I-15 supported keyboard directions act once', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const k of ['ArrowRight', ' ', 'PageDown']) act(() => key(k))
    expect(result.current.index).toBe(3)
    for (const k of ['ArrowLeft', 'PageUp']) act(() => key(k))
    expect(result.current.index).toBe(1)
  })
  test('I-16 horizontal swipes navigate and vertical/small gestures do not', () => {
    show(); const swipe = (dx: number, dy: number) => { fireEvent.touchStart(root(), { touches: [{ clientX: 200, clientY: 200 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] }) }
    swipe(-100, 4); expect(root().getAttribute('data-step-index')).toBe('1')
    swipe(100, 4); expect(root().getAttribute('data-step-index')).toBe('0')
    swipe(-10, 0); swipe(-50, 120); expect(root().getAttribute('data-step-index')).toBe('0')
  })
  test('I-19 native ARIA editable and tabindex controls retain their keys', () => {
    show()
    const fixtures = ['<button>button</button>', '<a href="#">link</a>', '<input />', '<select><option>x</option></select>', '<textarea></textarea>', '<details><summary><span>summary</span></summary></details>', '<video controls></video>', '<audio controls></audio>', '<iframe></iframe>', '<div contenteditable="true"><span>editable</span></div>', '<div tabindex="0">focusable</div>', '<div tabindex="-1">programmatic</div>',
      ...['button','link','checkbox','radio','combobox','listbox','option','menu','menubar','menuitem','menuitemcheckbox','menuitemradio','slider','spinbutton','scrollbar','tab','tablist','textbox','searchbox','switch','tree','treeitem','grid','gridcell','treegrid'].map(role => `<div role="${role}"><span>${role}</span></div>`)]
    for (const html of fixtures) {
      const host = document.createElement('section'); host.innerHTML = html; document.body.append(host)
      const control = host.querySelector('span') || host.querySelector('summary') || host.firstElementChild!
      const ownHandler = vi.fn(); control.addEventListener('keydown', ownHandler)
      for (const k of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) {
        const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
        act(() => { control.dispatchEvent(event) })
        expect(event.defaultPrevented, html).toBe(false)
      }
      expect(ownHandler).toHaveBeenCalledTimes(6)
      expect(root().getAttribute('data-step-index'), html).toBe('0'); expect(root().getAttribute('data-presentation-mode'), html).toBe('browse'); host.remove()
    }
  })
  test('I-20 all navigation actions clamp at boundaries', () => {
    show(); key('ArrowLeft'); expect(root().getAttribute('data-step-index')).toBe('0'); expect((screen.getByLabelText('Previous step') as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 5; i++) key('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe('2'); expect((screen.getByLabelText('Next step') as HTMLButtonElement).disabled).toBe(true)
    const { result } = renderHook(() => usePresentationNav(3)); act(() => result.current.jump(-5)); expect(result.current.index).toBe(0); act(() => result.current.jump(99)); expect(result.current.index).toBe(2)
  })
  test('I-21 default canvas and fit scale remain uniform across modes and resize', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    for (const mode of ['browse', 'present'] as const) for (const [w,h] of [[1440,900],[390,700],[900,400]]) {
      const s = fitScale(w,h,mode); expect(s).toBeGreaterThanOrEqual(0); expect(880*s).toBeLessThanOrEqual(w); expect(380*s).toBeLessThanOrEqual(h)
    }
    expect(fitScale(390, 900, 'browse')).toBeCloseTo(342 / 880)
    expect(fitScale(100, 100, 'browse')).toBe(0)
    const { result } = renderHook(() => useFitScale('browse')); const before = result.current.scale
    act(() => { window.innerWidth = 390; fireEvent(window, new Event('resize')) }); expect(result.current.scale).not.toBe(before)
    show(); const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); expect(canvas.style.transform).toMatch(/^scale\(/)
    window.innerWidth = 1400
  })
  test('I-22 StrictMode listeners clean up without double actions', () => {
    const add = vi.spyOn(window,'addEventListener'), remove = vi.spyOn(window,'removeEventListener')
    const { result, unmount } = renderHook(() => ({ nav: usePresentationNav(5), scale: useFitScale('browse') }), { wrapper: StrictMode })
    act(() => key('ArrowRight')); expect(result.current.nav.index).toBe(1); unmount()
    for (const event of ['keydown','resize']) {
      const added = add.mock.calls.filter(c => c[0] === event); const removed = remove.mock.calls.filter(c => c[0] === event)
      expect(added.length).toBe(removed.length); for (const c of added) expect(removed.some(r => r[1] === c[1])).toBe(true)
    }
    add.mockRestore(); remove.mockRestore()
  })
})
describe('sample and registry', () => {
  test('I-30 explicit registry resolves coexisting routes and unknown fallback', () => {
    const entries = ['one', 'two'].map(slug => ({ slug, title: slug, load: async () => ({ default: () => null }) }))
    expect(resolveRoute('/one', entries)?.slug).toBe('one'); expect(resolveRoute('/two/',entries)?.slug).toBe('two'); expect(resolveRoute('/other',entries)).toBeUndefined()
    render(<Router path="/unknown" />); expect(screen.getByRole('link', { name: /How to Use/ }).getAttribute('href')).toBe('/how-to-make-a-presentation')
  })
  test('I-39 canonical sample metadata and nine grouped states', () => {
    expect(STEPS).toHaveLength(9); expect(STEPS.map(s=>s.payload)).toEqual([1,2,3,4,5,6,7,8,9]); expect(new Set(STEPS.map(s=>s.groupKey)).size).toBe(1)
    expect(STEPS[8].title).toBe("You're looking at one"); expect(STEPS[6].caption).toContain('builds and renders every step')
  })
  test('I-40 sample accumulates identities at invariant positions', () => {
    for (let i = 2; i <= 9; i++) for (const id of visibleEntities(i-1)) expect(visibleEntities(i)).toContain(id)
    const { rerender } = render(<Story payload={1} />); const you = screen.getByText('you'); const initial = you.getAttribute('style')
    for (let beat = 2; beat <= 9; beat++) { rerender(<Story payload={beat} />); expect(screen.getByText('you')).toBe(you); expect(you.getAttribute('style')).toBe(initial) }
    expect(positions.verify.top).toBe(210); expect(positions.kit.top).toBe(positions.tray.top + positions.tray.height)
    expect(screen.getByText('↑ edited in place').style.top).toBe('192px');
    expect(document.querySelector('[data-presentation-node="frame"]')).toBeTruthy(); expect(screen.getByText('build + render ✓')).toBeTruthy()
  })
})
