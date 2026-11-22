import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import {
  Presentation,
  Box,
  Label,
  Arrow,
  Frame,
  Emphasis,
  SymbolChip,
  SceneLayer,
  Appear,
} from '../src/presentation-kit'
import type { Step, SceneProps } from '../src/presentation-kit'
import { Stage } from '../src/presentation-kit/Stage'
import { fitScale } from '../src/presentation-kit/useFitScale'
import { clampStep } from '../src/presentation-kit/usePresentationNav'
import { ENTRY, EXIT } from '../src/presentation-kit/constants'
import {
  DESIGN_W,
  DESIGN_H,
  ENTER_DELAY,
  ENTER_T,
  LAYOUT_T,
  STAGE_LAYOUT,
} from '../src/presentation-kit/constants'

function Scene({ payload }: SceneProps<number>) {
  return (
    <Box entityId="stable" style={{ left: payload * 10 }}>
      {payload}
    </Box>
  )
}
const steps: Step<number>[] = Array.from({ length: 4 }, (_, index) => ({
  id: `id-${index}`,
  era: index < 2 ? 'first era' : 'second era',
  title: `Title ${index}`,
  caption: `Caption ${index}`,
  Scene,
  groupKey: 'same',
  payload: index,
}))
const root = () => document.querySelector('[data-presentation-root]')!
const index = () => Number(root().getAttribute('data-step-index'))
const key = (key: string) => fireEvent.keyDown(window, { key })
const renderTalk = (extra = {}) =>
  render(<Presentation steps={steps} title="Test" {...extra} />)

describe('scene kit contracts', () => {
  test('I-12 active metadata, diagram and order-derived numbering after insert/remove/reorder', () => {
    const { rerender } = renderTalk()
    expect(screen.getByRole('heading').textContent).toBe('Title 0')
    expect(screen.getByText('Caption 0')).toBeTruthy()
    expect(root().getAttribute('data-step-id')).toBe('id-0')
    const changed = [steps[3], { ...steps[1], id: 'inserted' }, steps[0]]
    rerender(<Presentation steps={changed} title="Changed" />)
    expect(screen.getByRole('heading').textContent).toBe('Title 3')
    expect(screen.getByLabelText('Step 1: Title 3').textContent).toBe('1')
    key('ArrowRight')
    expect(root().getAttribute('data-step-id')).toBe('inserted')
    expect(
      document.querySelector('[data-presentation-entity]')?.textContent,
    ).toBe('1')
    expect(
      document.querySelector('[data-presentation-marker]')?.textContent,
    ).toContain('02')
  })
  test('I-14 identity persists, new arrivals follow layout duration, departures have exit animation', () => {
    renderTalk()
    const entity = document.querySelector('[data-presentation-entity="stable"]')
    key('ArrowRight')
    expect(document.querySelector('[data-presentation-entity="stable"]')).toBe(
      entity,
    )
    expect(entity?.textContent).toBe('1')
    expect(ENTRY.transition.delay).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(ENTER_DELAY).toBe(LAYOUT_T)
    expect(ENTRY.transition.duration).toBe(ENTER_T)
    expect(EXIT.opacity).toBe(0)
    expect(EXIT.transition.duration).toBeGreaterThan(0)
  })
  test('I-14 departing entities stay mounted for exit and newcomers retain their wrapper', async () => {
    const { rerender, container } = render(
      <AnimatePresence>
        <Appear key="a">
          <Box entityId="a">A</Box>
        </Appear>
      </AnimatePresence>,
    )
    const wrapper = container.querySelector('[data-presentation-appear]')
    rerender(
      <AnimatePresence>
        <Appear key="a">
          <Box entityId="a">Updated A</Box>
        </Appear>
      </AnimatePresence>,
    )
    expect(container.querySelector('[data-presentation-appear]')).toBe(wrapper)
    rerender(<AnimatePresence>{null}</AnimatePresence>)
    expect(
      container.querySelector('[data-presentation-entity="a"]'),
    ).toBeTruthy()
    await waitFor(
      () =>
        expect(
          container.querySelector('[data-presentation-entity="a"]'),
        ).toBeNull(),
      { timeout: 2000 },
    )
  })
  test('I-15 same group and Scene update without remount, changed groups/components remount', async () => {
    const mounted = vi.fn(),
      unmounted = vi.fn()
    function Persistent({ payload }: SceneProps<number>) {
      useEffect(() => {
        mounted()
        return () => {
          unmounted()
        }
      }, [])
      return <span>{payload}</span>
    }
    function Different({ payload }: SceneProps<number>) {
      return <b>{payload}</b>
    }
    const first = { ...steps[0], Scene: Persistent }
    const { rerender } = render(<Stage step={first} />)
    const span = screen.getByText('0')
    rerender(<Stage step={{ ...first, id: 'other', payload: 1 }} />)
    expect(screen.getByText('1')).toBe(span)
    expect(mounted).toHaveBeenCalledTimes(1)
    expect(unmounted).toHaveBeenCalledTimes(0)
    rerender(<Stage step={{ ...first, Scene: Different, payload: 2 }} />)
    expect(unmounted).toHaveBeenCalledTimes(1)
    rerender(<Stage step={{ ...first, groupKey: 'another', payload: 3 }} />)
    await waitFor(() => expect(mounted).toHaveBeenCalledTimes(2))
  })
  test('I-16 primitives forward hooks, coordinates, identity, custom motion content and no visual defaults', () => {
    const primitives = [Box, Label, Arrow, Frame, Emphasis, SymbolChip]
    render(
      <SceneLayer>
        {primitives.map((Node, i) => (
          <Node
            key={i}
            entityId={`n${i}`}
            className="custom"
            data-custom="yes"
            style={{ position: 'absolute', left: i * 5, zIndex: 2 }}
          >
            node
          </Node>
        ))}
      </SceneLayer>,
    )
    document
      .querySelectorAll('[data-presentation-entity]')
      .forEach((element, i) => {
        expect(element.getAttribute('data-presentation-entity')).toBe(`n${i}`)
        expect(element.className).toBe('custom')
        expect(element.getAttribute('data-custom')).toBe('yes')
        expect((element as HTMLElement).style.left).toBe(`${i * 5}px`)
        expect((element as HTMLElement).style.zIndex).toBe('2')
        for (const property of [
          'color',
          'fontFamily',
          'background',
          'border',
          'boxShadow',
        ])
          expect(
            (element as HTMLElement).style.getPropertyValue(property),
          ).toBe('')
      })
    expect(
      (document.querySelector('[data-presentation-layer]') as HTMLElement).style
        .position,
    ).toBe('absolute')
  })
  test('I-17 attribution text, GitHub destination, stable hook, bottom-right slot and opt-in brand', () => {
    const { rerender } = renderTalk()
    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link.getAttribute('href')).toBe(
      'https://github.com/Codagent-AI/and-scene',
    )
    expect(link.hasAttribute('data-presentation-attribution')).toBe(true)
    const slot = link.parentElement!
    expect(slot.style.right).toBe('16px')
    expect(slot.style.bottom).toBe('12px')
    expect(
      document.querySelector('[data-presentation-brand]')?.childNodes.length,
    ).toBe(0)
    rerender(
      <Presentation
        steps={steps}
        title="Test"
        brand={<a href="/">Host</a>}
        attribution={<span>Custom</span>}
      />,
    )
    expect(screen.getByRole('link', { name: 'Host' })).toBeTruthy()
    expect(screen.queryByText('made by and-scene')).toBeNull()
    expect(screen.getByText('Custom')).toBeTruthy()
  })
  test('I-18 mode chrome visibility and responsive ToC', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1400,
      configurable: true,
    })
    renderTalk()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    expect(screen.getByText('Caption 0')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeTruthy()
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 390,
        configurable: true,
      })
      window.dispatchEvent(new Event('resize'))
    })
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    fireEvent.click(screen.getByLabelText('Switch to present mode'))
    expect(screen.queryByText('Caption 0')).toBeNull()
    expect(screen.queryByLabelText('Previous step')).toBeNull()
    expect(screen.queryByLabelText('Next step')).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.getByRole('heading').style.whiteSpace).toBe('nowrap')
    expect(document.querySelector('[data-presentation-marker]')).toBeTruthy()
  })
  test('I-19 initial mode and toggles preserve current step', () => {
    renderTalk({ initialMode: 'present' })
    expect(root().getAttribute('data-presentation-mode')).toBe('present')
    key('ArrowRight')
    key('ArrowRight')
    key('p')
    expect(index()).toBe(2)
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
    fireEvent.click(screen.getByLabelText('Switch to present mode'))
    expect(index()).toBe(2)
    key('P')
    expect(root().getAttribute('data-presentation-mode')).toBe('browse')
  })
  test('I-20 all shortcuts advance exactly once and interactive controls retain keys', () => {
    renderTalk()
    for (const forward of ['ArrowRight', ' ', 'PageDown']) {
      key(forward)
      expect(index()).toBe(1)
      key('ArrowLeft')
      expect(index()).toBe(0)
    }
    key('ArrowRight')
    key('PageUp')
    expect(index()).toBe(0)
    const control = screen.getByLabelText('Next step')
    fireEvent.keyDown(control, { key: ' ' })
    expect(index()).toBe(0)
    fireEvent.click(control)
    expect(index()).toBe(1)
    for (const tag of ['input', 'textarea', 'select', 'a', 'summary']) {
      const element = document.createElement(tag)
      document.body.append(element)
      fireEvent.keyDown(element, { key: 'ArrowRight' })
      expect(index()).toBe(1)
      element.remove()
    }
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    document.body.append(editable)
    fireEvent.keyDown(editable, { key: 'PageDown' })
    expect(index()).toBe(1)
    editable.remove()
    fireEvent.keyDown(window, { key: 'ArrowRight', ctrlKey: true })
    expect(index()).toBe(1)
  })
  test('I-21 horizontal swipes, vertical/short filtering and focused touch controls', () => {
    renderTalk()
    const swipe = (x: number, y = 0, target: Element = root()) => {
      fireEvent.touchStart(target, {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      fireEvent.touchEnd(target, {
        changedTouches: [{ clientX: 100 + x, clientY: 100 + y }],
      })
    }
    swipe(-80)
    expect(index()).toBe(1)
    swipe(80)
    expect(index()).toBe(0)
    swipe(-30)
    swipe(-80, 120)
    expect(index()).toBe(0)
    swipe(-80, 0, screen.getByLabelText('Next step'))
    expect(index()).toBe(0)
  })
  test('I-22 previous/next, direct progress and first-step-of-era jumps', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1400,
      configurable: true,
    })
    renderTalk()
    fireEvent.click(screen.getByLabelText('Next step'))
    expect(index()).toBe(1)
    fireEvent.click(screen.getByLabelText('Previous step'))
    expect(index()).toBe(0)
    fireEvent.click(screen.getByLabelText('Step 4: Title 3'))
    expect(index()).toBe(3)
    fireEvent.click(screen.getByText('second era', { selector: 'button' }))
    expect(index()).toBe(2)
    fireEvent.click(screen.getByText('first era', { selector: 'button' }))
    expect(index()).toBe(0)
  })
  test('I-23 current semantics and active hooks agree after navigation and toggles', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1400,
      configurable: true,
    })
    renderTalk()
    fireEvent.click(screen.getByLabelText('Step 3: Title 2'))
    const active = document.querySelectorAll(
      '[data-presentation-active="true"]',
    )
    expect(active.length).toBe(2)
    active.forEach((element) =>
      expect(element.getAttribute('aria-current')).toBe('step'),
    )
    expect(
      screen
        .getByText('second era', { selector: 'button' })
        .getAttribute('aria-current'),
    ).toBe('step')
    key('p')
    key('p')
    expect(
      screen
        .getByLabelText('Step 3: Title 2')
        .getAttribute('data-presentation-active'),
    ).toBe('true')
    key('ArrowLeft')
    expect(
      screen.getByLabelText('Step 2: Title 1').getAttribute('aria-current'),
    ).toBe('step')
  })
  test('I-24 boundaries clamp, single-step controls disabled and empty presentation rejected', () => {
    const { rerender } = renderTalk()
    key('ArrowLeft')
    key('PageUp')
    expect(index()).toBe(0)
    expect(
      (screen.getByLabelText('Previous step') as HTMLButtonElement).disabled,
    ).toBe(true)
    for (let i = 0; i < 8; i++) key('ArrowRight')
    expect(index()).toBe(3)
    expect(
      (screen.getByLabelText('Next step') as HTMLButtonElement).disabled,
    ).toBe(true)
    rerender(<Presentation steps={[steps[0]]} title="One" />)
    key('ArrowRight')
    key('ArrowLeft')
    expect(index()).toBe(0)
    expect(clampStep(-3, 1)).toBe(0)
    expect(clampStep(99, 1)).toBe(0)
    expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow(
      'at least one step',
    )
  })
  test('I-25 fit scaling preserves fixed canvas at wide/narrow/short sizes and mode geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(fitScale(1760, 760)).toBe(1)
    expect(fitScale(440, 380)).toBe(0.5)
    expect(fitScale(880, 190)).toBe(0.5)
    expect(fitScale(0, 0)).toBe(0)
    for (const geometry of Object.values(STAGE_LAYOUT))
      expect(
        fitScale(390, 700 - geometry.header - geometry.footer),
      ).toBeCloseTo(390 / 880)
    let callback: ResizeObserverCallback | undefined
    class Observer {
      constructor(cb: ResizeObserverCallback) {
        callback = cb
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', Observer)
    renderTalk()
    act(() =>
      callback?.(
        [{ contentRect: { width: 440, height: 380 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    )
    const canvas = document.querySelector(
      '[data-presentation-canvas]',
    ) as HTMLElement
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    expect(canvas.style.transform).toContain('scale(0.5)')
    key('ArrowRight')
    expect(canvas.style.transform).toContain('scale(0.5)')
    key('p')
    expect(canvas.style.transform).toContain('scale(0.5)')
    act(() =>
      callback?.(
        [{ contentRect: { width: 880, height: 190 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    )
    expect(canvas.style.transform).toContain('scale(0.5)')
    vi.unstubAllGlobals()
  })
})
