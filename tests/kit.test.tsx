import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Presentation, Stage, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, Appear, ENTER_DELAY, ENTER_T, LAYOUT_T, DESIGN_W, DESIGN_H } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { Footer } from '../src/presentation-kit/chrome/Footer'
import { Toc } from '../src/presentation-kit/chrome/Toc'
import { fitScale, stageGeometry, useFitScale } from '../src/presentation-kit/useFitScale'
import { clampIndex, ownsKeys, swipeDirection } from '../src/presentation-kit/usePresentationNav'
afterEach(cleanup)
function Scene({ payload }: SceneProps<{ text: string }>) { return <Box id="shared">{payload.text}</Box> }
const steps: Step<{ text: string }>[] = [
  { id: 'a', era: 'intro', title: 'First', caption: 'First paragraph.', Scene, payload: { text: 'one' }, groupKey: 'shared' },
  { id: 'b', era: 'intro', title: 'Second', caption: 'Second paragraph.', Scene, payload: { text: 'two' }, groupKey: 'shared' },
  { id: 'c', era: 'end', title: 'Third', caption: 'Third paragraph.', Scene, payload: { text: 'three' }, groupKey: 'shared' },
]
function presentation(initialMode: 'browse' | 'present' = 'browse') { return render(<Presentation title="Example" steps={steps} initialMode={initialMode} />) }
const host = () => document.querySelector('[data-presentation]')!
const key = (key: string, target: Element | Window = window) => fireEvent.keyDown(target, { key })
function resize(width: number, height = 900) { Object.defineProperty(window, 'innerWidth', { value: width, configurable: true }); Object.defineProperty(window, 'innerHeight', { value: height, configurable: true }); fireEvent(window, new Event('resize')) }
describe('scene contracts', () => {
  it('I-8 unstyled primitives have no fallback visual treatments', () => {
    render(<SceneLayer><Box id="plain">box</Box><Label id="label">label</Label><Arrow id="arrow">arrow</Arrow><Frame id="frame">frame</Frame><Emphasis id="emphasis">emphasis</Emphasis><SymbolChip id="chip">chip</SymbolChip></SceneLayer>)
    for (const el of document.querySelectorAll<HTMLElement>('[data-presentation-node]')) for (const property of ['color','background','fontFamily','border','boxShadow','padding','margin','borderRadius']) expect(el.style[property as 'color']).toBe('')
    expect(document.querySelectorAll('style,link[rel="stylesheet"]')).toHaveLength(0)
  })
  it('navigation listeners are removed when the presentation unmounts', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = presentation(); unmount()
    for (const event of ['keydown','touchstart','touchend','touchcancel','resize']) expect(remove.mock.calls.some(call=>call[0]===event)).toBe(true)
  })

  it('I-1 metadata selects the active diagram and narration', () => { presentation(); expect(screen.getByText('one')).toBeTruthy(); expect(screen.getByText('First paragraph.')).toBeTruthy(); key('ArrowRight'); expect(screen.getByText('two')).toBeTruthy(); expect(screen.getByText('Second')).toBeTruthy() })
  it('I-2 numbering derives from insertion removal and reorder', () => {
    const props = { mode: 'browse' as const, go: vi.fn(), next: vi.fn(), prev: vi.fn() }
    const { rerender } = render(<Footer {...props} steps={[steps[2], steps[0]]} index={0} />)
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('01 / end')
    rerender(<Footer {...props} steps={[steps[1], steps[2], steps[0]]} index={1} />)
    expect(document.querySelector('[data-presentation-marker]')?.textContent).toBe('02 / end')
  })
  it('I-4 stable entity identity and geometry update in place', () => {
    const { rerender } = render(<Box id="entity" style={{ left: 10, width: 40 }}>old</Box>)
    const el = screen.getByText('old')
    rerender(<Box id="entity" style={{ left: 20, width: 80 }} data-emphasis="strong">new</Box>)
    expect(screen.getByText('new')).toBe(el); expect(el.style.left).toBe('20px'); expect(el.style.width).toBe('80px'); expect(el.dataset.emphasis).toBe('strong')
  })
  it('I-5 entry waits for continuing layout and has explicit departure animation', () => { expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T); expect(ENTER_T).toBeGreaterThan(0); const { container } = render(<Appear><span>new</span></Appear>); expect(container.querySelector('[data-presentation-appear]')).toBeTruthy() })
  it('I-6 grouped scene preserves instance while group and component changes remount', async () => {
    let mounts = 0
    function Persistent({ payload }: SceneProps<{ text: string }>) { const [token] = useState(() => ++mounts); return <span>{token}:{payload.text}</span> }
    const first = { ...steps[0], Scene: Persistent }
    const { rerender } = render(<Stage step={first} mode="browse" />)
    expect(screen.getByText('1:one')).toBeTruthy()
    rerender(<Stage step={{ ...steps[1], Scene: Persistent }} mode="browse" />)
    expect(screen.getByText('1:two')).toBeTruthy(); expect(mounts).toBe(1)
    rerender(<Stage step={{ ...steps[1], groupKey: 'new', Scene: Persistent }} mode="browse" />)
    expect(screen.getByText('2:two')).toBeTruthy()
    function Other() { useEffect(() => { mounts++ }, []); return <span>other</span> }
    rerender(<Stage step={{ ...steps[1], groupKey: 'new', Scene: Other }} mode="browse" />)
    expect(screen.getByText('other')).toBeTruthy(); expect(mounts).toBe(3)
  })
  it('I-7 continuing wrappers and intentional coordinates survive payload changes', () => {
    function Group({ payload }: SceneProps<number>) { return <SceneLayer><Appear key="same" style={{ position: 'absolute', left: 12, top: 14 }}><Box id="same">{payload}</Box></Appear>{payload > 1 && <Appear key="new" style={{ position: 'absolute', left: 12, top: 14 }}><Box id="new">new</Box></Appear>}</SceneLayer> }
    const { rerender } = render(<Group payload={1} />); const original = document.querySelector('[data-presentation-appear]')
    rerender(<Group payload={2} />); expect(document.querySelector('[data-presentation-appear]')).toBe(original); expect((original as HTMLElement).style.left).toBe('12px'); expect(document.querySelectorAll('[data-presentation-appear]')).toHaveLength(2)
  })
  it('I-9 primitive style hooks forward author geometry and raw motion composes', () => {
    const nodes = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    render(<SceneLayer>{nodes.map((Node, i) => <Node key={i} id={`e${i}`} className="custom" data-author="yes" style={{ left: 45 }}>{i}</Node>)}<motion.div layoutId="raw">raw</motion.div></SceneLayer>)
    expect(document.querySelectorAll('[data-author="yes"]')).toHaveLength(6)
    for (const el of document.querySelectorAll<HTMLElement>('[data-author]')) { expect(el.className).toBe('custom'); expect(el.style.left).toBe('45px'); expect(el.hasAttribute('data-presentation-node')).toBe(true) }
    expect(screen.getByText('raw')).toBeTruthy()
  })
  it('I-10 attribution defaults to the repository and bottom-right slot', () => { presentation(); const a = screen.getByRole('link', { name: 'made by and-scene' }); expect(a.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene'); expect(a.hasAttribute('data-presentation-attribution')).toBe(true); expect(a.parentElement?.style.right).toBe('20px'); expect(a.parentElement?.style.bottom).toBe('12px') })
  it('I-11 header branding is opt-in', () => { const { unmount } = presentation(); expect(document.querySelector('[data-presentation-brand]')?.textContent).toBe(''); unmount(); render(<Presentation steps={steps} title="T" brand={<a href="/">Host</a>} />); expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy() })
  it('I-12 present mode exposes marker title and hides reading controls', () => { presentation('present'); expect(screen.getByText('First')).toBeTruthy(); expect(document.querySelector('[data-presentation-marker]')).toBeTruthy(); for (const name of ['caption', 'toc', 'prev', 'next', 'progress']) expect(document.querySelector(`[data-presentation-${name}]`)).toBeNull() })
  it('I-13 browse chrome and responsive era ToC', () => { resize(1440); presentation(); for (const name of ['caption', 'toc', 'prev', 'next', 'progress']) expect(document.querySelector(`[data-presentation-${name}]`)).toBeTruthy(); expect(document.querySelectorAll('[data-presentation-toc-entry]')).toHaveLength(2); act(() => resize(390)); expect(document.querySelector('[data-presentation-toc]')).toBeNull() })
  it('I-14 mode toggle and P preserve active index', () => { presentation(); key('ArrowRight'); key('p'); expect(host().getAttribute('data-presentation-mode')).toBe('present'); expect(host().getAttribute('data-step-index')).toBe('1'); fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' })); expect(host().getAttribute('data-step-index')).toBe('1'); expect(host().getAttribute('data-presentation-mode')).toBe('browse') })
  it.each(['ArrowRight', ' ', 'PageDown'])('I-15 forward key %s advances exactly once', k => { presentation(); expect(key(k)).toBe(false); expect(host().getAttribute('data-step-index')).toBe('1') })
  it.each(['ArrowLeft', 'PageUp'])('I-15 backward key %s goes back exactly once', k => { presentation(); key('ArrowRight'); key('ArrowRight'); key(k); expect(host().getAttribute('data-step-index')).toBe('1') })
  it('I-16 touch gestures navigate only horizontal swipes', () => {
    presentation()
    function swipe(x: number, y: number) { fireEvent.touchStart(window, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(window, { changedTouches: [{ clientX: x, clientY: y }] }) }
    swipe(20, 105); expect(host().getAttribute('data-step-index')).toBe('1'); swipe(190, 110); expect(host().getAttribute('data-step-index')).toBe('0'); swipe(120, 190); expect(host().getAttribute('data-step-index')).toBe('0'); expect(swipeDirection(20, 1)).toBe(0)
    fireEvent.touchStart(window, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchCancel(window); fireEvent.touchEnd(window, { changedTouches: [{ clientX: 0, clientY: 100 }] }); expect(host().getAttribute('data-step-index')).toBe('0')
  })
  it('I-17 direct progress and era jumps select first era step', () => { resize(1440); presentation(); fireEvent.click(screen.getByRole('button', { name: 'Step 3: Third' })); expect(host().getAttribute('data-step-index')).toBe('2'); fireEvent.click(screen.getByRole('button', { name: 'intro' })); expect(host().getAttribute('data-step-index')).toBe('0') })
  it('I-18 active navigation hooks agree after jumps', () => { render(<Toc steps={steps} index={1} go={vi.fn()} />); expect(screen.getByRole('button', { name: 'intro' }).getAttribute('aria-current')).toBe('step'); cleanup(); presentation(); fireEvent.click(screen.getByRole('button', { name: 'Step 3: Third' })); expect(screen.getByRole('button', { name: 'Step 3: Third' }).getAttribute('data-presentation-active')).toBe('true'); expect(screen.getByRole('button', { name: 'Step 1: First' }).hasAttribute('aria-current')).toBe(false) })
  it.each(['button', 'a', 'input', 'select', 'textarea', 'div'])('I-19 %s focused controls retain keys', tag => {
    presentation(); const el = document.createElement(tag); if (tag === 'div') el.setAttribute('contenteditable', 'true'); document.body.append(el)
    for (const k of [' ', 'ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) expect(key(k, el)).toBe(true)
    expect(host().getAttribute('data-step-index')).toBe('0'); expect(host().getAttribute('data-presentation-mode')).toBe('browse'); el.remove()
  })
  it('I-19 nested interactive targets and modified keys retain behavior', () => { presentation(); const button = document.createElement('button'), span = document.createElement('span'); button.append(span); document.body.append(button); expect(ownsKeys(span)).toBe(true); key('ArrowRight', span); fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true }); expect(host().getAttribute('data-step-index')).toBe('0'); button.remove() })
  it('I-20 both boundaries clamp and buttons disable', () => { presentation(); key('ArrowLeft'); expect(host().getAttribute('data-step-index')).toBe('0'); expect(screen.getByRole('button', { name: 'Previous step' }).hasAttribute('disabled')).toBe(true); for (let i = 0; i < 5; i++) key('ArrowRight'); expect(host().getAttribute('data-step-index')).toBe('2'); expect(screen.getByRole('button', { name: 'Next step' }).hasAttribute('disabled')).toBe(true); expect(clampIndex(-3, 3)).toBe(0); expect(clampIndex(8, 3)).toBe(2) })
  it('I-21 uniform fit uses 880x380 and updates on resize in both modes', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380]); expect(fitScale(440, 380)).toBe(.5); expect(fitScale(880, 190)).toBe(.5)
    for (const mode of ['browse', 'present'] as const) for (const width of [390, 1440]) { const g = stageGeometry(width, 844, mode); const scale = fitScale(g.width, g.height); expect(scale * 880).toBeLessThanOrEqual(g.width); expect(scale * 380).toBeLessThanOrEqual(g.height) }
    function Fit() { const g = useFitScale('browse'); return <output>{g.scale}</output> }
    resize(1440); const { container } = render(<Fit />); const before = container.textContent; act(() => resize(390)); expect(container.textContent).not.toBe(before)
  })
  it('I-22 step changes preserve stage geometry and canvas dimensions', () => { resize(1440); presentation(); const canvas = document.querySelector<HTMLElement>('[data-presentation-canvas]')!; const style = canvas.getAttribute('style'); key('ArrowRight'); expect(canvas.getAttribute('style')).toBe(style); expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); key('p'); expect(canvas.getAttribute('style')).not.toBe(style) })
  it('I-39 every supplied browse step has caption and navigation', () => { presentation(); for (const step of steps) { expect(screen.getByText(step.caption)).toBeTruthy(); expect(document.querySelector('[data-presentation-prev]')).toBeTruthy(); expect(document.querySelector('[data-presentation-next]')).toBeTruthy(); key('ArrowRight') } })
  it('I-47 public count and index hooks follow navigation', () => { presentation(); expect(host().getAttribute('data-step-count')).toBe('3'); expect(host().getAttribute('data-step-index')).toBe('0'); key('ArrowRight'); expect(host().getAttribute('data-step-index')).toBe('1') })
  it('rejects an empty presentation explicitly', () => { expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step') })
})
