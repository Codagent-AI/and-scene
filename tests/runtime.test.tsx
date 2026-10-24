import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Presentation, Stage, Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear, SceneLayer, validateSteps, fitScale, useFitScale, usePresentationNav, clampIndex, LAYOUT_T, ENTER_T, ENTER_DELAY } from '../src/presentation-kit'
import type { SceneProps, Step } from '../src/presentation-kit'
import { eraEntries } from '../src/presentation-kit/chrome/Toc'
import { findPresentation } from '../src/presentations'
import Landing from '../src/Landing'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { readFileSync } from 'node:fs'
import canonical from '../scripts/reference-outline.json'
const sampleCss = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
function Diagram({ payload }: SceneProps<number>) { return <Box id="entity" style={{ position: 'absolute', left: payload * 10, width: 100 + payload }} data-emphasis={payload > 1 ? 'strong' : 'normal'}>state {payload}</Box> }
const steps: Step<number>[] = [0, 1, 2].map((i) => ({ id: `s${i}`, era: i < 2 ? 'first' : 'second', title: `Title ${i}`, caption: `Caption ${i}`, Scene: Diagram, payload: i, groupKey: 'same' }))
const setup = () => render(<Presentation steps={steps} title="Fixture" />)
const root = () => document.querySelector('[data-presentation]')!
const index = () => Number(root().getAttribute('data-step-index'))
const press = (key: string, target: EventTarget = window) => fireEvent.keyDown(target, { key })

describe('runtime contracts', () => {
  it('I-1 metadata and active diagram; rejects empty, incomplete and duplicate steps', () => {
    expect(() => validateSteps(steps)).not.toThrow()
    expect(() => validateSteps([])).toThrow('at least one')
    for (const key of ['id', 'era', 'title', 'caption', 'Scene']) expect(() => validateSteps([{ ...steps[0], [key]: '' }])).toThrow('Incomplete')
    expect(() => validateSteps([steps[0], steps[0]])).toThrow('Duplicate')
    setup(); expect(screen.getByText('state 0')).toBeTruthy(); press('ArrowRight'); expect(screen.getByText('state 1')).toBeTruthy()
  })
  it('I-2 numbering follows reordered shortened arrays', () => {
    const view = render(<Presentation steps={[steps[2], steps[0]]} title="Reordered" />)
    expect(screen.getByText('01 / second')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Step 2: Title 0' })).toBeTruthy()
    view.rerender(<Presentation steps={[steps[1]]} title="Short" />)
    expect(screen.getByText('01 / first')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Step 2:/ })).toBeNull()
  })
  it('I-4 stable layoutId preserves node while position size label and emphasis change', () => {
    const element = Box({ id: 'entity', children: 'old' })
    expect(element.props.layoutId).toBe('entity'); expect(element.props.layout).toBe(true)
    expect(element.props.transition.layout).toEqual(LAYOUT_T)
    setup(); const entity = document.querySelector('[data-entity-id="entity"]')!
    press('ArrowRight')
    expect(document.querySelector('[data-entity-id="entity"]')).toBe(entity)
    expect(entity.textContent).toBe('state 1'); expect(entity.getAttribute('style')).toContain('left: 10px')
    expect(entity.getAttribute('style')).toContain('width: 101px')
    press('ArrowRight'); expect(entity.getAttribute('data-emphasis')).toBe('strong')
  })
  it('I-5 newcomers wait for layout; departures exit without enter delay', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration)
    expect(ENTER_T.delay).toBe(ENTER_DELAY)
    const appear = Appear({ children: 'new' })
    expect(appear.props.initial).toEqual({ opacity: 0, y: 8 })
    expect(appear.props.animate).toEqual({ opacity: 1, y: 0 })
    expect(appear.props.exit).toEqual({ opacity: 0, y: 0, transition: { delay: 0, duration: .18 } })
    expect(appear.props.transition).toEqual(ENTER_T)
  })
  it('I-5 added identities enter once and removed identities retain exit presence until completion', async () => {
    function Entities({ show }: { show: boolean }) {
      return <AnimatePresence><Appear key="continuing"><Box id="continuing">continues</Box></Appear>{show && <Appear key="new"><Box id="new">newcomer</Box></Appear>}</AnimatePresence>
    }
    const view = render(<Entities show={false} />)
    const continuing = document.querySelector('[data-entity-id="continuing"]')!
    view.rerender(<Entities show />)
    expect(document.querySelector('[data-entity-id="new"]')).toBeTruthy()
    expect(document.querySelector('[data-entity-id="continuing"]')).toBe(continuing)
    view.rerender(<Entities show={false} />)
    expect(document.querySelector('[data-entity-id="new"]')).toBeTruthy()
    await waitFor(() => expect(document.querySelector('[data-entity-id="new"]')).toBeNull(), { timeout: 1500 })
    expect(document.querySelector('[data-entity-id="continuing"]')).toBe(continuing)
  })
  it('I-6 grouped payload updates retain mount and local state; distinct scene remounts', () => {
    const mounted = vi.fn(), unmounted = vi.fn()
    function Group({ payload }: SceneProps<number>) {
      const [sentinel] = useState(() => Math.random())
      useEffect(() => { mounted(); return unmounted }, [])
      return <div data-testid="group" data-sentinel={sentinel}>{payload}</div>
    }
    const grouped = steps.map(s => ({ ...s, Scene: Group }))
    const view = render(<Stage step={grouped[0]} mode="browse" />)
    const node = screen.getByTestId('group'); const sentinel = node.getAttribute('data-sentinel')
    view.rerender(<Stage step={grouped[1]} mode="browse" />)
    expect(screen.getByTestId('group')).toBe(node); expect(node.textContent).toBe('1'); expect(node.getAttribute('data-sentinel')).toBe(sentinel)
    expect(mounted).toHaveBeenCalledTimes(1); expect(unmounted).not.toHaveBeenCalled()
    view.rerender(<Stage step={{ ...grouped[2], Scene: Diagram }} mode="browse" />)
    expect(unmounted).toHaveBeenCalledTimes(1)
  })
  it('I-7 grouped authored stacking coordinates remain independent layers', () => {
    function Stacked({ payload }: SceneProps<number>) {
      return <><SceneLayer data-testid="back" style={{ zIndex: 3 }}><Box id="back-box" style={{ position: 'absolute', left: 10 + payload * 20, top: 20, width: 120, height: 80 }}>back</Box></SceneLayer><SceneLayer data-testid="front" style={{ zIndex: 7 }}><Box id="front-box" style={{ position: 'absolute', left: 60 + payload * 20, top: 40, width: 100, height: 90 }}>front</Box></SceneLayer></>
    }
    const grouped = steps.map(step => ({ ...step, Scene: Stacked }))
    const view = render(<Stage step={grouped[0]} mode="browse" />)
    const back = screen.getByTestId('back'), front = screen.getByTestId('front')
    const boxes = ['back-box', 'front-box'].map(id => document.querySelector(`[data-entity-id="${id}"]`) as HTMLElement)
    for (const [i, step] of grouped.entries()) {
      view.rerender(<Stage step={step} mode="browse" />)
      expect(screen.getByTestId('back')).toBe(back); expect(screen.getByTestId('front')).toBe(front)
      expect(back.style.zIndex).toBe('3'); expect(front.style.zIndex).toBe('7')
      for (const layer of [back, front]) { expect(layer.style.position).toBe('absolute'); expect(layer.style.inset).toBe('0px') }
      const current = ['back-box', 'front-box'].map(id => document.querySelector(`[data-entity-id="${id}"]`) as HTMLElement)
      expect(current).toEqual(boxes)
      expect(current[0].style.left).toBe(`${10 + i * 20}px`); expect(current[1].style.left).toBe(`${60 + i * 20}px`)
      // Explicit overlapping rectangles, preserved through every grouped update.
      const left = Math.max(...current.map(box => parseFloat(box.style.left)))
      const right = Math.min(...current.map(box => parseFloat(box.style.left) + parseFloat(box.style.width)))
      const top = Math.max(...current.map(box => parseFloat(box.style.top)))
      const bottom = Math.min(...current.map(box => parseFloat(box.style.top) + parseFloat(box.style.height)))
      expect(right - left).toBe(70); expect(bottom - top).toBe(60)
    }
  })
  it('I-8 style-neutral primitive hooks forward authored class style and data', () => {
    for (const Primitive of [Box, Label, Arrow, Frame, Emphasis, SymbolChip]) {
      const element = Primitive({ id: 'shared', className: 'authored', style: { left: 17, color: 'red' }, 'aria-label': 'semantic' })
      expect(element.props.className).toBe('authored'); expect(element.props.style).toEqual({ left: 17, color: 'red' })
      expect(element.props['data-entity-id']).toBe('shared'); expect(element.props['data-presentation-node']).toBeTruthy()
      expect(Primitive({ id: 'unstyled' }).props.style).toBeUndefined()
    }
  })
  it('I-9 literal coordinates and raw motion layoutIds are accepted', () => {
    function RawScene() { return <SceneLayer><Box id="literal" className="mine" style={{ position: 'absolute', left: 27, top: 42 }} /><motion.div layoutId="raw" data-testid="raw" style={{ left: 50 }} /></SceneLayer> }
    render(<Stage step={{ ...steps[0], Scene: RawScene }} mode="browse" />)
    expect(document.querySelector('[data-entity-id="literal"]')?.getAttribute('style')).toContain('left: 27px')
    expect(screen.getByTestId('raw').getAttribute('style')).toContain('left: 50px')
  })
  it('I-10 attribution default destination hook geometry and opt-in brand', () => {
    const view = setup()
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    expect(link.parentElement?.style.right).toBe('24px'); expect(link.parentElement?.style.bottom).toBe('12px')
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
    view.rerender(<Presentation steps={steps} title="Fixture" brand={<a href="/">Host</a>} attribution={false} />)
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy(); expect(screen.queryByText('made by and-scene')).toBeNull()
  })
  it('I-11 mode-specific chrome and configurable initial mode', () => {
    const view = render(<Presentation steps={steps} title="Fixture" initialMode="present" />)
    expect(screen.getByText('Title 0')).toBeTruthy(); expect(screen.queryByText('Caption 0')).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull(); expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
    expect(screen.getByText('Caption 0')).toBeTruthy(); expect(screen.getByRole('navigation', { name: 'Steps' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    view.unmount()
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    setup(); expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
  })
  it('I-12 mode toggles preserve middle index and scene payload', () => {
    setup(); press('ArrowRight'); press('p'); expect(index()).toBe(1); expect(root().getAttribute('data-presentation-mode')).toBe('present')
    press('P'); expect(index()).toBe(1); expect(screen.getByText('state 1')).toBeTruthy()
  })
  it('I-13 each keyboard binding changes state once; modifiers are ignored', () => {
    const { result } = renderHook(() => usePresentationNav(10))
    for (const key of ['ArrowRight', ' ', 'PageDown']) { const before = result.current.index; act(() => press(key)); expect(result.current.index).toBe(before + 1) }
    for (const key of ['ArrowLeft', 'PageUp']) { const before = result.current.index; act(() => press(key)); expect(result.current.index).toBe(before - 1) }
    act(() => press('P')); expect(result.current.mode).toBe('present')
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })); expect(result.current.index).toBe(1)
  })
  it('I-14 horizontal swipes navigate; vertical short and multi-touch gestures do not', () => {
    setup()
    const swipe = (x: number, y: number) => { fireEvent.touchStart(root(), { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: x, clientY: y }] }) }
    swipe(10, 105); expect(index()).toBe(1)
    swipe(190, 105); expect(index()).toBe(0)
    swipe(95, 100); swipe(90, 250); expect(index()).toBe(0)
    fireEvent.touchStart(root(), { touches: [{ clientX: 100, clientY: 100 }, { clientX: 0, clientY: 0 }] }); fireEvent.touchEnd(root(), { changedTouches: [{ clientX: 0, clientY: 100 }] }); expect(index()).toBe(0)
  })
  it('I-15 progress jumps and repeated-era ToC selects first step', () => {
    setup(); fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title 2' })); expect(index()).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: 'first' })); expect(index()).toBe(0)
    expect(eraEntries(steps)).toEqual([{ era: 'first', index: 0 }, { era: 'second', index: 2 }])
  })
  it('I-16 progress and ToC semantic current hooks track every navigation', () => {
    setup()
    const check = (i: number) => {
      const active = document.querySelectorAll('[data-presentation-active="true"]')
      expect(active).toHaveLength(2); for (const control of active) expect(control.getAttribute('aria-current')).toBe('step')
      expect(screen.getByRole('button', { name: `Step ${i + 1}: Title ${i}` }).getAttribute('data-presentation-active')).toBe('true')
    }
    check(0); press('ArrowRight'); check(1); press('ArrowLeft'); check(0)
    fireEvent.click(screen.getByRole('button', { name: 'second' })); check(2)
  })
  it('I-17 focused controls keep navigation keys', () => {
    setup()
    const controls = ['button', 'a', 'input', 'textarea', 'select', 'div']
    for (const tag of controls) {
      const control = document.createElement(tag)
      if (tag === 'div') control.setAttribute('contenteditable', 'true')
      document.body.append(control)
      for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p']) press(key, control)
      expect(index()).toBe(0); expect(root().getAttribute('data-presentation-mode')).toBe('browse'); control.remove()
    }
  })
  it('I-18 both boundaries clamp and invalid destinations are safe', () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.prev()); expect(result.current.index).toBe(0)
    act(() => result.current.jump(100)); expect(result.current.index).toBe(2)
    act(() => result.current.next()); expect(result.current.index).toBe(2)
    act(() => result.current.jump(-20)); expect(result.current.index).toBe(0)
    expect(clampIndex(NaN, 3)).toBe(0)
  })
  it('I-19 uniform fit dimensions resize mode geometry and listener cleanup', () => {
    expect(fitScale(1440, 900, 'browse')).toBe(1)
    expect(fitScale(488, 900, 'browse')).toBe(.5)
    expect(fitScale(1440, 510, 'browse')).toBe(.5)
    expect(fitScale(10, 10, 'browse')).toBe(0)
    expect(fitScale(1440, 510, 'present')).toBeGreaterThan(.5)
    const remove = vi.spyOn(window, 'removeEventListener')
    const view = renderHook(() => useFitScale('browse'))
    act(() => { Object.defineProperty(window, 'innerWidth', { value: 488, configurable: true }); fireEvent(window, new Event('resize')) })
    expect(view.result.current).toBe(.5); view.unmount(); expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    setup(); const canvas = document.querySelector('[data-presentation-canvas]') as HTMLElement
    expect((document.querySelector('[data-presentation-stage]') as HTMLElement).style.gridTemplateColumns).toBe('minmax(0, 1fr)'); expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px'); expect(canvas.style.transform).toBe('scale(0.5)')
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
  })
  it('I-26 registry routes multiple entries and landing enumerates sample', () => {
    const load = async () => ({ default: () => null })
    const entries = [{ slug: 'one', title: 'One', load }, { slug: 'two', title: 'Two', load }]
    expect(findPresentation('/one', entries)?.title).toBe('One'); expect(findPresentation('/two/', entries)?.title).toBe('Two')
    expect(findPresentation('/missing', entries)).toBeUndefined(); expect(findPresentation('/', entries)).toBeUndefined()
    render(<Landing />); expect(screen.getByRole('link', { name: /How to Use This Skill/ }).getAttribute('href')).toBe('/how-to-make-a-presentation')
  })
  it('I-40 public count and index hooks enumerate active step state', () => {
    setup(); expect(root().getAttribute('data-step-count')).toBe('3'); expect(index()).toBe(0)
    press('ArrowRight'); expect(index()).toBe(1); expect(root().getAttribute('data-step-count')).toBe('3')
    press('ArrowRight'); expect(index()).toBe(2)
  })
  it('I-31 sample captions and next previous controls cover every step', () => {
    render(<Presentation steps={STEPS} title="Sample" />)
    for (let i = 0; i < STEPS.length; i++) { expect(screen.getByText(STEPS[i].caption)).toBeTruthy(); if (i < STEPS.length - 1) fireEvent.click(screen.getByRole('button', { name: 'Next step' })) }
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' })); expect(index()).toBe(7)
  })
  it('I-33 reference metadata matches every canonical id era title and caption', () => {
    expect(STEPS.map(({ id, era, title, caption }) => ({ id, era, title, caption }))).toEqual(canonical)
    expect(findPresentation('/how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
  })
  // Independent narrative expectations: do not import production entity tables
  // or their visibility selector, so deleting an entity cannot delete its oracle.
  const additions = [
    ['you', 'prompt'], ['skill', 'conversation', 'question'], ['tray', 'card1'],
    ['link1', 'card2', 'link2', 'card3'], ['ghost', 'depth'], ['socket'],
    ['pipeline', 'verify'], ['modify'], ['reveal'],
  ]
  for (const [row, beats] of [[34, [1, 2]], [35, [3, 4]], [36, [5, 6]], [37, [7, 8]], [38, [9]]] as const) {
    it(`I-${row} sample scene intents and stable accumulating coordinates`, () => {
      for (const beat of beats) {
        const step = STEPS[beat - 1]
        const view = render(<><style>{sampleCss}</style><step.Scene payload={step.payload} /></>)
        const expected = additions.slice(0, beat).flat().map(key => `how-to-make-a-presentation:${key}`)
        expect([...document.querySelectorAll('[data-entity-id]')].map(node => node.getAttribute('data-entity-id')).sort()).toEqual([...expected].sort())
        const node = (key: string) => document.querySelector(`[data-entity-id="how-to-make-a-presentation:${key}"]`) as HTMLElement
        const rect = (key: string) => {
          const style = node(key).style
          const left = parseFloat(style.left), top = parseFloat(style.top)
          return { left, top, right: left + parseFloat(style.width), bottom: top + parseFloat(style.height) }
        }
        const inside = (child: string, parent: string) => {
          const a = rect(child), b = rect(parent)
          expect(a.left).toBeGreaterThanOrEqual(b.left); expect(a.right).toBeLessThanOrEqual(b.right)
          expect(a.top).toBeGreaterThanOrEqual(b.top); expect(a.bottom).toBeLessThanOrEqual(b.bottom)
        }
        expect(node('you').textContent).toBe('you')
        expect(node('prompt').textContent).toContain('a topic worth explaining')
        if (beat >= 2) {
          expect(node('skill').textContent).toBe('the skill')
          expect(node('conversation').textContent).toMatch(/←.*→/)
          expect(rect('conversation').left).toBeGreaterThan(rect('you').right)
          expect(rect('conversation').right).toBeLessThan(rect('skill').left)
          expect(rect('question').bottom).toBeLessThan(rect('conversation').top)
          expect(node('question').textContent).toBe('one question at a time')
        }
        if (beat >= 3) {
          inside('card1', 'tray')
          expect(rect('tray').top).toBeGreaterThan(rect('prompt').bottom)
          expect(node('card1').textContent).toContain('title · caption · visual')
          expect(node('card1').textContent).not.toContain('morph')
        }
        if (beat >= 4) {
          for (const card of ['card2', 'card3']) { inside(card, 'tray'); expect(node(card).textContent).toContain('title · caption · visual'); expect(node(card).textContent).not.toContain('morph') }
          for (const [link, before, after] of [['link1', 'card1', 'card2'], ['link2', 'card2', 'card3']]) {
            expect(node(link).textContent).toContain('morph')
            expect(rect(link).left).toBeGreaterThan(rect(before).right)
            expect(rect(link).right).toBeLessThan(rect(after).left)
          }
        }
        if (beat >= 5) {
          expect(getComputedStyle(node('ghost')).borderTopStyle).toBe('dashed')
          expect(node('depth').textContent).toBe('partial ↔ full')
          const depth = rect('depth'), you = rect('you')
          expect((depth.left + depth.right) / 2).toBeGreaterThan(you.left)
          expect((depth.left + depth.right) / 2).toBeLessThan(you.right)
          expect(you.top - depth.bottom).toBeGreaterThanOrEqual(0)
          expect(you.top - depth.bottom).toBeLessThanOrEqual(24)
        }
        if (beat >= 6) {
          expect(node('socket').textContent).toMatch(/scene-kit.*shapes.*motion/)
          expect(rect('socket').top).toBe(rect('tray').bottom)
          expect(rect('socket').left).toBeGreaterThan(rect('tray').left)
          expect(rect('socket').right).toBeLessThan(rect('tray').right)
          for (const side of ['Top', 'Left', 'Right']) expect(getComputedStyle(node('tray')).getPropertyValue(`border-${side.toLowerCase()}-style`)).not.toBe('solid')
        }
        if (beat >= 7) { expect(node('verify').getAttribute('data-check-status')).toBe('pass'); expect(node('verify').textContent).toMatch(/build ✓.*render ✓/s); expect(rect('verify').top).toBe(rect('card1').top) }
        if (beat >= 8) expect(node('card2').querySelector('[data-edited="true"]')).toBeTruthy()
        if (beat >= 9) for (const key of additions.slice(0, 8).flat()) inside(key, 'reveal')
        view.unmount()
      }
    })
  }
  it('I-38 continuing sample DOM identities and coordinates stay invariant; invariant detects moved entities', () => {
    const view = render(<Stage step={STEPS[0]} mode="browse" />)
    const seen = new Map<string, { node: Element; style: string }>()
    function invariant() {
      for (const node of document.querySelectorAll('[data-entity-id]')) {
        const id = node.getAttribute('data-entity-id')!
        const before = seen.get(id)
        const style = ['left', 'top', 'width', 'height'].map(k => (node as HTMLElement).style.getPropertyValue(k)).join(',')
        if (before) { expect(node).toBe(before.node); expect(style).toBe(before.style) }
        seen.set(id, { node, style })
      }
      expect(document.querySelectorAll('[data-entity-id]').length).toBeGreaterThanOrEqual(seen.size)
    }
    for (const step of STEPS) { view.rerender(<Stage step={step} mode="browse" />); invariant() }
    const node = document.querySelector('[data-entity-id]') as HTMLElement
    node.style.left = '999px'; expect(invariant).toThrow()
  })
})
