import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { SWIPE_MIN_PX } from './constants'
import { usePresentationNav } from './usePresentationNav'
import type { SceneProps, Step } from './types'

function Scene({ payload }: SceneProps<string>) {
  return <div data-testid="scene">{payload}</div>
}

const steps: Step<string>[] = ['zero', 'one', 'two', 'three', 'four'].map((payload, i) => ({
  id: `s${i}`,
  era: i < 2 ? 'A' : 'B',
  title: `Title ${i}`,
  caption: `Caption ${i}`,
  groupKey: 'g',
  Scene,
  payload,
}))

function NavHarness({ count }: { count: number }) {
  const nav = usePresentationNav(count, 'present')
  return (
    <div>
      <span data-testid="index">{nav.index}</span>
      <span data-testid="mode">{nav.mode}</span>
      <button type="button" data-testid="btn">
        <span data-testid="btn-inner">b</span>
      </button>
      <a href="#x" data-testid="link">
        l
      </a>
      <input data-testid="input" aria-label="input" />
      <select data-testid="select" aria-label="select">
        <option>1</option>
      </select>
      <textarea data-testid="textarea" aria-label="textarea" />
      <details>
        <summary data-testid="summary">s</summary>
      </details>
      <div contentEditable="true" suppressContentEditableWarning data-testid="editable">
        <span data-testid="editable-inner">e</span>
      </div>
      <div role="slider" tabIndex={0} aria-label="slider" data-testid="slider" />
      <div role="button" tabIndex={0} data-testid="aria-button">
        <span data-testid="aria-inner">a</span>
      </div>
      <div role="textbox" tabIndex={0} aria-label="tb" data-testid="textbox" />
    </div>
  )
}

function touchEvent(type: 'touchstart' | 'touchend', x: number, y: number): Event {
  const ev = new Event(type, { bubbles: true })
  Object.defineProperty(ev, 'changedTouches', { value: [{ clientX: x, clientY: y }] })
  return ev
}

function swipe(dx: number, dy = 0) {
  fireEvent(window, touchEvent('touchstart', 200, 200))
  fireEvent(window, touchEvent('touchend', 200 + dx, 200 + dy))
}

function indexAttr(): string | null {
  return document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') ?? null
}

afterEach(() => {
  cleanup()
})

describe('L-13: keyboard navigation keys', () => {
  it.each([
    ['ArrowRight', 1],
    [' ', 1],
    ['PageDown', 1],
    ['ArrowLeft', -1],
    ['PageUp', -1],
  ])('L-13: key %j moves exactly %i step(s)', (key, delta) => {
    const { result } = renderHook(() => usePresentationNav(5, 'present'))
    act(() => result.current.goTo(2))
    fireEvent.keyDown(document.body, { key })
    expect(result.current.index).toBe(2 + delta)
  })

  it('L-13: unrelated keys leave the index unchanged', () => {
    const { result } = renderHook(() => usePresentationNav(5, 'present'))
    act(() => result.current.goTo(2))
    for (const key of ['ArrowUp', 'ArrowDown', 'Enter', 'Home', 'End', 'a', 'Tab', 'Escape']) {
      fireEvent.keyDown(document.body, { key })
    }
    expect(result.current.index).toBe(2)
  })

  it('L-13: the hook installed through Presentation advances exactly once per key', () => {
    render(<Presentation steps={steps} title="Deck" />)
    const idx = () => indexAttr()
    expect(idx()).toBe('0')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(idx()).toBe('1')
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(idx()).toBe('2')
    fireEvent.keyDown(document.body, { key: 'PageDown' })
    expect(idx()).toBe('3')
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(idx()).toBe('2')
    fireEvent.keyDown(document.body, { key: 'PageUp' })
    expect(idx()).toBe('1')
    expect(screen.getByTestId('scene').textContent).toBe('one')
  })
})

describe('L-14: touch swipe navigation', () => {
  function renderAt(index: number) {
    const hook = renderHook(() => usePresentationNav(5, 'present'))
    act(() => hook.result.current.goTo(index))
    return hook.result
  }

  it('L-14: a left swipe advances and a right swipe goes back, one step per gesture', () => {
    const result = renderAt(2)
    swipe(-100)
    expect(result.current.index).toBe(3)
    swipe(100)
    expect(result.current.index).toBe(2)
  })

  it('L-14: a swipe at exactly the threshold navigates in both directions', () => {
    const result = renderAt(2)
    swipe(-SWIPE_MIN_PX)
    expect(result.current.index).toBe(3)
    swipe(SWIPE_MIN_PX)
    expect(result.current.index).toBe(2)
  })

  it('L-14: swipes just below the threshold are ignored', () => {
    const result = renderAt(2)
    swipe(-(SWIPE_MIN_PX - 1))
    swipe(SWIPE_MIN_PX - 1)
    expect(result.current.index).toBe(2)
  })

  it('L-14: taps and predominantly vertical gestures are ignored', () => {
    const result = renderAt(2)
    swipe(0, 0)
    swipe(0, 200)
    swipe(-SWIPE_MIN_PX, SWIPE_MIN_PX)
    swipe(SWIPE_MIN_PX, SWIPE_MIN_PX)
    swipe(-SWIPE_MIN_PX, SWIPE_MIN_PX + 10)
    swipe(-40, -120)
    expect(result.current.index).toBe(2)
  })

  it('L-14: a horizontal gesture whose dx exceeds dy navigates even when both are over the threshold', () => {
    const result = renderAt(2)
    swipe(-(SWIPE_MIN_PX + 10), SWIPE_MIN_PX)
    expect(result.current.index).toBe(3)
  })

  it('L-14: a touchend without a preceding touchstart is ignored', () => {
    const result = renderAt(2)
    fireEvent(window, touchEvent('touchend', 0, 0))
    expect(result.current.index).toBe(2)
  })
})

describe('L-17: focused interactive controls keep their keys', () => {
  it.each([
    'btn',
    'btn-inner',
    'link',
    'input',
    'select',
    'textarea',
    'summary',
    'editable',
    'editable-inner',
    'slider',
    'aria-button',
    'aria-inner',
    'textbox',
  ])('L-17: keys on %s neither navigate nor toggle mode, and are not prevented', (testid) => {
    render(<NavHarness count={5} />)
    const el = screen.getByTestId(testid)
    act(() => {
      el.focus()
    })
    for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp']) {
      expect(fireEvent.keyDown(el, { key })).toBe(true)
    }
    expect(fireEvent.keyDown(el, { key: 'p' })).toBe(true)
    expect(screen.getByTestId('index').textContent).toBe('0')
    expect(screen.getByTestId('mode').textContent).toBe('present')
  })

  it('L-17: the same unmodified navigation keys on body navigate and are prevented', () => {
    render(<NavHarness count={5} />)
    expect(fireEvent.keyDown(document.body, { key: 'ArrowRight' })).toBe(false)
    expect(screen.getByTestId('index').textContent).toBe('1')
    expect(fireEvent.keyDown(document.body, { key: 'p' })).toBe(true)
    expect(screen.getByTestId('mode').textContent).toBe('browse')
  })

  it('L-17: navigation keys on a progress control do not advance the deck', () => {
    render(<Presentation steps={steps} title="Deck" initialMode="browse" />)
    const progress = document.querySelector('[data-presentation-progress-index="1"]') as HTMLElement
    fireEvent.click(progress)
    expect(indexAttr()).toBe('1')
    expect(fireEvent.keyDown(progress, { key: 'ArrowRight' })).toBe(true)
    expect(indexAttr()).toBe('1')
  })

  it.each(['ctrlKey', 'metaKey', 'altKey'] as const)(
    'L-17: %s combinations are ignored by the deck',
    (mod) => {
      render(<Presentation steps={steps} title="Deck" />)
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      expect(indexAttr()).toBe('2')
      for (const key of ['ArrowRight', 'PageDown', ' ', 'ArrowLeft', 'PageUp', 'p']) {
        fireEvent.keyDown(document.body, { key, [mod]: true })
      }
      expect(indexAttr()).toBe('2')
      expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
    },
  )
})

describe('L-18: navigation clamps at the boundaries', () => {
  it('L-18: repeated next and prev stay within [0, last] for a multi-step deck', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'present'))
    for (let i = 0; i < 5; i++) act(() => result.current.next())
    expect(result.current.index).toBe(2)
    for (let i = 0; i < 5; i++) act(() => result.current.prev())
    expect(result.current.index).toBe(0)
  })

  it('L-18: boundary clamping also holds for key presses', () => {
    const { result } = renderHook(() => usePresentationNav(3, 'present'))
    for (let i = 0; i < 5; i++) fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(result.current.index).toBe(2)
    for (let i = 0; i < 5; i++) fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(result.current.index).toBe(0)
  })

  it('L-18: a one-step presentation never moves and never wraps', () => {
    const { result } = renderHook(() => usePresentationNav(1, 'present'))
    act(() => result.current.next())
    expect(result.current.index).toBe(0)
    act(() => result.current.prev())
    expect(result.current.index).toBe(0)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(result.current.index).toBe(0)
  })

  it('L-18: a one-step Presentation disables prev and next and exposes step count 1', () => {
    render(<Presentation steps={steps.slice(0, 1)} title="Deck" initialMode="browse" />)
    const prev = document.querySelector('[data-presentation-prev]') as HTMLButtonElement
    const next = document.querySelector('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(indexAttr()).toBe('0')
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-step-count')).toBe('1')
  })

  it('L-18: end prev/next controls cannot wrap or produce an invalid active step', () => {
    render(<Presentation steps={steps.slice(0, 3)} title="Deck" initialMode="browse" />)
    const prev = document.querySelector('[data-presentation-prev]') as HTMLButtonElement
    const next = document.querySelector('[data-presentation-next]') as HTMLButtonElement
    expect(prev.disabled).toBe(true)
    fireEvent.click(prev)
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(indexAttr()).toBe('0')

    fireEvent.keyDown(document.body, { key: 'PageDown' })
    fireEvent.keyDown(document.body, { key: 'PageDown' })
    fireEvent.keyDown(document.body, { key: 'PageDown' })
    expect(indexAttr()).toBe('2')
    expect(next.disabled).toBe(true)
    fireEvent.click(next)
    expect(indexAttr()).toBe('2')
    expect(screen.getByTestId('scene').textContent).toBe('two')
  })
})
