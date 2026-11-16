import { act, fireEvent, render, screen, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { Presentation, Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer } from '../src/presentation-kit'
import type { Step, SceneProps } from '../src/presentation-kit'
import { Stage } from '../src/presentation-kit/Stage'
import { sceneKey } from '../src/presentation-kit/model'
import { usePresentationNav, swipeDirection } from '../src/presentation-kit/usePresentationNav'
import { fitGeometry, useFitScale } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../src/presentation-kit/constants'
import { resolvePresentation } from '../src/routing'
import { presentations } from '../src/presentations'
import Landing from '../src/Landing'
import Router from '../src/Router'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { sceneState, entity } from '../src/presentations/how-to-make-a-presentation/entities'
import { validateReference, referenceSteps } from './reference-contract'

const Scene = ({ payload }: SceneProps<number>) => <Box entityId="fixture:node">{payload}</Box>
const steps: Step<number>[] = ['a', 'b', 'c'].map((id, i) => ({ id, era: i < 2 ? 'first' : 'second', title: `Title ${id}`, caption: `Caption ${id}`, Scene, payload: i, groupKey: 'group' }))
function resize(width = 1280, height = 800) { Object.defineProperty(window, 'innerWidth', { configurable: true, value: width }); Object.defineProperty(window, 'innerHeight', { configurable: true, value: height }); window.dispatchEvent(new Event('resize')) }

it('I-6 registry routing and landing preserve multiple entries with unknown fallback', async () => {
  const more = [...presentations, { slug: 'another', title: 'Another presentation', load: async () => ({ default: () => <p>Another</p> }) }]
  expect(resolvePresentation('/another/', more)?.title).toBe('Another presentation')
  expect(resolvePresentation('/missing', more)).toBeUndefined()
  const view = render(<Landing entries={more} />)
  expect(screen.getAllByRole('link')).toHaveLength(2)
  expect(screen.getByRole('link', { name: /Another/ }).getAttribute('href')).toBe('/another')
  view.unmount()
  const fallback = render(<Router path="/unknown" />)
  expect(screen.getByRole('navigation', { name: 'Presentations' })).toBeTruthy()
  fallback.unmount()
  render(<Router path="/how-to-make-a-presentation" />)
  expect(await screen.findByRole('main', { name: 'How to Use This Skill to Make a Presentation' })).toBeTruthy()
})
it('I-12 each displayed number follows reorder insert and remove at every position', () => {
  for (const list of [steps, [...steps].reverse(), [steps[2], steps[0]], [{ ...steps[2], id: 'inserted' }, ...steps]]) {
    const view = render(<Presentation steps={list} title="Fixture" />)
    for (const [index, step] of list.entries()) {
      if (index) fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe(String(index))
      expect(view.container.querySelector('[data-step-id]')?.getAttribute('data-step-id')).toBe(step.id)
      expect(view.container.querySelector('[data-presentation-marker]')?.textContent).toBe(`${String(index + 1).padStart(2, '0')} / ${step.era}`)
      expect(screen.getByRole('heading').textContent).toBe(step.title)
      expect(view.container.querySelector('[data-presentation-caption]')?.textContent).toBe(step.caption)
      expect(view.container.querySelector('[data-presentation-entity]')?.textContent).toBe(String(step.payload))
      expect(screen.getByRole('button', { name: `Step ${index + 1}: ${step.title}` }).textContent).toBe(String(index + 1))
    }
    view.unmount()
  }
})
it.each(['group', 'component'] as const)('I-15 %s changes mount a fresh scene and retire the old instance before fixture teardown', async change => {
  const first = { mounts: 0, unmounts: 0 }
  const second = { mounts: 0, unmounts: 0 }
  const Counted = ({ payload }: SceneProps<number>) => { useEffect(() => { first.mounts++; return () => { first.unmounts++ } }, []); return <p data-testid="first">{payload}</p> }
  const Other = ({ payload }: SceneProps<number>) => { useEffect(() => { second.mounts++; return () => { second.unmounts++ } }, []); return <p data-testid="second">{payload}</p> }
  const grouped = steps.map(step => ({ ...step, Scene: Counted }))
  const show = (index: number) => <Stage step={grouped[index]} hostKey={sceneKey(grouped, index)} scale={1} height={380} inset={0} />
  const view = render(show(0))
  const original = screen.getByTestId('first')
  view.rerender(show(1))
  expect(first).toEqual({ mounts: 1, unmounts: 0 })
  expect(screen.getByTestId('first')).toBe(original)
  expect(original.textContent).toBe('1')
  grouped[2] = change === 'group' ? { ...grouped[2], groupKey: 'different' } : { ...grouped[2], Scene: Other }
  view.rerender(show(2))
  // AnimatePresence must retire the old scene on its own, not because the test unmounted the stage.
  await waitFor(() => expect(first.unmounts).toBe(1), { timeout: 2000 })
  expect(original.isConnected).toBe(false)
  const current = screen.getByTestId(change === 'group' ? 'first' : 'second')
  expect(current).not.toBe(original)
  expect(current.textContent).toBe('2')
  expect(first.mounts).toBe(change === 'group' ? 2 : 1)
  expect(second).toEqual({ mounts: change === 'component' ? 1 : 0, unmounts: 0 })
  view.unmount()
})
it('I-14 persisting nodes update while newcomers delay and departures exit', async () => {
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  expect(ENTER_T).toBeGreaterThan(0)
  const Fixture = ({ next }: { next: boolean }) => <AnimatePresence><Box key="shared" entityId="shared" style={{ left: next ? 120 : 20 }}>{next ? 'New label' : 'Old label'}</Box>{next ? <Box key="new" entityId="new">Newcomer</Box> : <Box key="old" entityId="old">Departing</Box>}</AnimatePresence>
  const view = render(<Fixture next={false} />)
  const shared = view.container.querySelector<HTMLElement>('[data-presentation-entity="shared"]')!
  await waitFor(() => expect(Number(shared.style.opacity)).toBeGreaterThan(.95), { timeout: 2000 })
  view.rerender(<Fixture next />)
  expect(view.container.querySelector('[data-presentation-entity="shared"]')).toBe(shared)
  expect(shared.textContent).toBe('New label'); expect(shared.style.left).toBe('120px')
  expect(Number(shared.style.opacity)).toBeGreaterThan(.95)
  const newcomer = view.container.querySelector<HTMLElement>('[data-presentation-entity="new"]')!
  expect(Number(newcomer.style.opacity)).toBe(0)
  expect(view.container.querySelector('[data-presentation-entity="old"]')).toBeTruthy()
  await new Promise(resolve => setTimeout(resolve, 100))
  expect(Number(newcomer.style.opacity)).toBe(0)
  await waitFor(() => expect(view.container.querySelector('[data-presentation-entity="old"]')).toBeNull(), { timeout: 1500 })
  await waitFor(() => expect(Number(newcomer.style.opacity)).toBeGreaterThan(.95), { timeout: 2000 })
})
it('I-16 continuing entities retain DOM and authored stacked positions', () => {
  const Stacked = ({ payload }: SceneProps<number>) => <SceneLayer><Box entityId="one" style={{ position: 'absolute', left: 20, top: 30 }}>{payload}</Box><Box entityId="two" style={{ position: 'absolute', left: 20, top: 30 }}>Stack</Box></SceneLayer>
  const list = steps.map(step => ({ ...step, Scene: Stacked }))
  const view = render(<Presentation steps={list} title="Stacks" />)
  const first = view.container.querySelector('[data-presentation-entity="one"]')
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(view.container.querySelector('[data-presentation-entity="one"]')).toBe(first)
  expect(first?.textContent).toBe('1')
  expect((first as HTMLElement).style.left).toBe('20px')
  expect((view.container.querySelector('[data-presentation-layer]') as HTMLElement).style.position).toBe('absolute')
})
it('I-17 every primitive forwards neutral author hooks and supports raw coordinates', () => {
  const primitives = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
  const view = render(<>{primitives.map((Node, i) => <Node key={i} entityId={`id:${i}`} className="owned" data-custom="value" style={{ left: 37, color: 'red' }}>Entity</Node>)}</>)
  for (const node of view.container.querySelectorAll<HTMLElement>('[data-presentation-node]')) {
    expect(node.className).toBe('owned'); expect(node.dataset.custom).toBe('value'); expect(node.style.left).toBe('37px'); expect(node.style.color).toBe('red'); expect(node.style.border).toBe(''); expect(node.style.font).toBe(''); expect(node.style.background).toBe('')
  }
})
it('I-18 default attribution hook placement destination and opt-in brand', () => {
  const view = render(<Presentation steps={steps} title="Fixture" />)
  const attribution = screen.getByRole('link', { name: 'made by and-scene' })
  expect(attribution.hasAttribute('data-presentation-attribution')).toBe(true)
  expect(attribution.getAttribute('href')).toBe('https://github.com/Codagent-AI/and-scene')
  expect(attribution.parentElement?.style.right).toBe('12px'); expect(attribution.parentElement?.style.bottom).toBe('8px')
  expect(view.container.querySelector('[data-presentation-brand]')).toBeNull()
  view.rerender(<Presentation steps={steps} title="Fixture" brand={<a href="/">Host</a>} />)
  expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
})
it('I-19 present mode focuses marker and title and hides reading controls', () => {
  const view = render(<Presentation steps={steps} title="Fixture" initialMode="present" />)
  expect(screen.getByRole('heading').textContent).toBe('Title a')
  expect(view.container.querySelector('[data-presentation-marker]')).toBeTruthy()
  for (const hook of ['caption', 'toc', 'navigation', 'progress']) expect(view.container.querySelector(`[data-presentation-${hook}]`)).toBeNull()
})
it('I-20 browse mode supplies reading controls and wide-only toc', () => {
  resize()
  const view = render(<Presentation steps={steps} title="Fixture" />)
  expect(screen.getByRole('heading').textContent).toBe('Title a')
  for (const hook of ['caption', 'toc', 'navigation', 'progress']) expect(view.container.querySelector(`[data-presentation-${hook}]`)).toBeTruthy()
  act(() => resize(390, 844))
  expect(view.container.querySelector('[data-presentation-toc]')).toBeNull()
  expect(view.container.querySelector('[data-presentation-caption]')).toBeTruthy()
  resize()
})
it('I-21 initial modes and toggles preserve a middle index', () => {
  const view = render(<Presentation steps={steps} title="Fixture" />)
  fireEvent.keyDown(window, { key: 'ArrowRight' }); fireEvent.keyDown(window, { key: 'p' })
  expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  expect(view.container.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('present')
  fireEvent.click(screen.getByRole('button', { name: 'Switch to browse mode' }))
  expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('1')
  expect(view.container.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('browse')
})
describe('I-22 keyboard inputs and focused-control protection', () => {
  for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp']) it(key, () => {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.jump(1)); act(() => fireEvent.keyDown(window, { key }))
    expect(result.current.index).toBe(['ArrowLeft', 'PageUp'].includes(key) ? 0 : 2)
  })
  function checkControlKeys(target: HTMLElement) {
    const { result } = renderHook(() => usePresentationNav(3))
    act(() => result.current.jump(1))
    target.focus()
    expect(document.activeElement).toBe(target)
    for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp', 'p', 'P']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      act(() => { target.dispatchEvent(event) })
      expect(result.current.index, `${target.tagName} retains ${key}`).toBe(1)
      expect(result.current.mode, `${target.tagName} retains mode key ${key}`).toBe('browse')
      expect(event.defaultPrevented, `${target.tagName} retains default action for ${key}`).toBe(false)
    }
  }
  for (const tag of ['button', 'a', 'input', 'textarea', 'select', 'summary', 'div']) it(`preserves each ${tag} key without preventing its default`, () => {
    const target = document.createElement(tag)
    const container = tag === 'summary' ? document.createElement('details') : document.createElement('div')
    if (tag === 'a') target.setAttribute('href', '#control')
    if (tag === 'div') { target.setAttribute('contenteditable', 'true'); target.tabIndex = 0 }
    container.append(target); document.body.append(container)
    try { checkControlKeys(target) } finally { container.remove() }
  })
  for (const role of ['slider', 'combobox', 'checkbox', 'tab', 'link', 'menuitem', 'spinbutton']) it(`preserves each ARIA ${role} key without preventing its default`, () => {
    const target = document.createElement('div'); target.setAttribute('role', role); target.tabIndex = 0; document.body.append(target)
    try { checkControlKeys(target) } finally { target.remove() }
  })
  it('ignores modified keys and cleans up listener', () => {
    const { result, unmount } = renderHook(() => usePresentationNav(3))
    act(() => fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })); expect(result.current.index).toBe(0)
    unmount(); fireEvent.keyDown(window, { key: 'ArrowRight' }); expect(result.current.index).toBe(0)
  })
})
it('I-23 swipes navigate horizontally and reject vertical short and control gestures', () => {
  const Harness = () => { const nav = usePresentationNav(3); return <div data-testid="touch" onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd}>{nav.index}<button>control</button></div> }
  render(<Harness />)
  const area = screen.getByTestId('touch')
  const swipe = (target: Element, x: number, y: number) => { fireEvent.touchStart(target, { touches: [{ clientX: 100, clientY: 100 }] }); fireEvent.touchEnd(target, { changedTouches: [{ clientX: x, clientY: y }] }) }
  swipe(area, 20, 105); expect(area.textContent).toBe('1control')
  swipe(area, 190, 105); expect(area.textContent).toBe('0control')
  swipe(area, 95, 180); swipe(area, 80, 100); swipe(screen.getByRole('button'), 20, 100)
  expect(area.textContent).toBe('0control')
  expect(swipeDirection(-39, 0)).toBe(0); expect(swipeDirection(-40, 0)).toBe(1)
})
it('I-24 direct jumps expose active semantic state and era first steps', () => {
  resize()
  const view = render(<Presentation steps={steps} title="Fixture" />)
  fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title c' }))
  expect(screen.getByRole('button', { name: 'Step 3: Title c' }).getAttribute('aria-current')).toBe('step')
  expect(screen.getByRole('button', { name: 'second' }).dataset.presentationActive).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'first' }))
  expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  expect(screen.getByRole('button', { name: 'Step 1: Title a' }).dataset.presentationActive).toBe('true')
  expect(screen.getByRole('button', { name: 'second' }).getAttribute('aria-current')).toBeNull()
})
it('I-25 each previous and next operation clamps independently at its boundary', () => {
  const { result, unmount } = renderHook(() => usePresentationNav(3))
  for (let attempt = 0; attempt < 3; attempt++) {
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  }
  act(() => result.current.jump(-7)); expect(result.current.index).toBe(0)
  act(() => result.current.jump(200)); expect(result.current.index).toBe(2)
  for (let attempt = 0; attempt < 3; attempt++) {
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  }
  unmount()
  const view = render(<Presentation steps={steps} title="Fixture" />)
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('0')
  fireEvent.click(screen.getByRole('button', { name: 'Step 3: Title c' }))
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(view.container.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe('2')
})
it('I-26 fixed canvas uniformly scales on resize and remains stable across steps', () => {
  expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  for (const mode of ['browse', 'present'] as const) for (const [w, h] of [[1440, 900], [390, 844], [800, 500]]) {
    const fit = fitGeometry(w, h, mode)
    expect(fit.scale * 880).toBeLessThanOrEqual(w - fit.inset)
    expect(fit.scale * 380).toBeLessThanOrEqual(fit.height)
  }
  resize(); const view = render(<Presentation steps={steps} title="Fixture" />)
  const canvas = view.container.querySelector<HTMLElement>('[data-presentation-canvas]')!
  expect(canvas.style.width).toBe('880px'); expect(canvas.style.height).toBe('380px')
  const initial = canvas.style.transform
  fireEvent.keyDown(window, { key: 'ArrowRight' }); expect(canvas.style.transform).toBe(initial)
  act(() => resize(390, 844)); expect(canvas.style.transform).not.toBe(initial)
  expect(canvas.style.width).toBe('880px')
  const hook = renderHook(() => useFitScale('present')); expect(hook.result.current.wide).toBe(false)
  act(() => resize()); expect(hook.result.current.wide).toBe(true)
})
it('I-27 sample metadata matches nine normative ordered beats', () => {
  expect(STEPS).toHaveLength(9)
  expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(referenceSteps)
})
it('I-28 sample accumulates stable entities coordinates and normative scene roles', () => {
  const required = [['you','prompt'], ['skill','conversation','question'], ['tray','card-1'], ['card-2','card-3','morph-1','morph-2'], ['ghost','depth'], ['kit'], ['verify','pipeline'], ['modify'], ['reveal']]
  let previous = sceneState(0)
  for (let beat = 1; beat <= 9; beat++) {
    const state = sceneState(beat)
    for (const item of previous) expect(state.find(next => next.id === item.id)).toEqual(item)
    for (const id of required[beat - 1]) expect(state.find(item => item.id === id)).toBeTruthy()
    for (const item of state) { expect(item.x).toBeGreaterThanOrEqual(0); expect(item.x + item.width).toBeLessThanOrEqual(880); expect(item.y + item.height).toBeLessThanOrEqual(380) }
    previous = state
  }
  expect(sceneState(7).find(item => item.id === 'verify')?.y).toBe(sceneState(7).find(item => item.id === 'card-1')?.y)
  expect(sceneState(6).find(item => item.id === 'kit')?.y).toBe(300)
  expect(entity('you')).toBe('how-to:you')
})
it('I-30 sample validator rejects missing malformed and reordered metadata', () => {
  expect(() => validateReference([])).toThrow(/nine/)
  expect(() => validateReference([...referenceSteps].reverse())).toThrow(/order/)
  expect(() => validateReference(referenceSteps.map((step, i) => i ? step : { ...step, caption: 'Wrong' }))).toThrow(/normative/)
  expect(() => validateReference(referenceSteps)).not.toThrow()
})
it('I-32 public hooks report count and active index', () => {
  const view = render(<Presentation steps={steps} title="Fixture" />)
  const root = view.container.querySelector('[data-step-count]')!
  expect(root.getAttribute('data-step-count')).toBe('3'); expect(root.getAttribute('data-step-index')).toBe('0')
  fireEvent.keyDown(window, { key: 'ArrowRight' }); expect(root.getAttribute('data-step-index')).toBe('1')
})
