import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit'

function Probe({ count = 5, initialMode }: { count?: number; initialMode?: 'browse' | 'present' }) {
  const nav = usePresentationNav(count, initialMode)
  return (
    <div>
      <output data-testid="index">{nav.index}</output>
      <output data-testid="mode">{nav.mode}</output>
      <button onClick={nav.next}>next</button>
      <input aria-label="field" />
      <a href="#x">link</a>
      <select aria-label="sel"><option>1</option></select>
      <textarea aria-label="ta" />
      <details><summary>sum</summary></details>
      <div contentEditable suppressContentEditableWarning data-testid="ce">edit</div>
      <div role="button" tabIndex={0} data-testid="role-button"><span data-testid="nested">x</span></div>
      <button onClick={() => nav.goTo(99)}>far</button>
    </div>
  )
}

const index = () => Number(screen.getByTestId('index').textContent)
const mode = () => screen.getByTestId('mode').textContent

function press(key: string, init: KeyboardEventInit = {}, target: Element | Window = window) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  act(() => {
    target.dispatchEvent(event)
  })
  return event
}

function swipe(dx: number, dy = 0) {
  act(() => {
    window.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientX: 200, clientY: 200 } as Touch] }))
    window.dispatchEvent(new TouchEvent('touchend', { changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy } as Touch] }))
  })
}

describe.each([
  ['plain', (el: React.ReactElement) => el],
  ['StrictMode', (el: React.ReactElement) => <StrictMode>{el}</StrictMode>],
])('usePresentationNav (%s)', (_name, wrap) => {
  it.each([['ArrowRight'], [' '], ['PageDown']])('%j advances exactly one step and prevents default', (key) => {
    render(wrap(<Probe />))
    const event = press(key)
    expect(index()).toBe(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it.each([['ArrowLeft'], ['PageUp']])('%s goes back exactly one step', (key) => {
    render(wrap(<Probe />))
    press('ArrowRight')
    press('ArrowRight')
    press(key)
    expect(index()).toBe(1)
  })

  it('P toggles the mode and keeps the step', () => {
    render(wrap(<Probe initialMode="present" />))
    press('ArrowRight')
    press('ArrowRight')
    expect(mode()).toBe('present')
    press('p')
    expect(mode()).toBe('browse')
    expect(index()).toBe(2)
    press('P')
    expect(mode()).toBe('present')
    expect(index()).toBe(2)
  })

  it('ignores unrelated keys without preventing default', () => {
    render(wrap(<Probe />))
    const event = press('x')
    expect(index()).toBe(0)
    expect(event.defaultPrevented).toBe(false)
  })

  it('clamps at both ends and never wraps', () => {
    render(wrap(<Probe count={3} />))
    press('ArrowLeft')
    press('PageUp')
    expect(index()).toBe(0)
    for (let i = 0; i < 6; i++) press('ArrowRight')
    expect(index()).toBe(2)
    swipe(-120)
    expect(index()).toBe(2)
    fireEvent.click(screen.getByText('next'))
    expect(index()).toBe(2)
    fireEvent.click(screen.getByText('far'))
    expect(index()).toBe(2)
  })

  it('swipes left to advance and right to go back, once per gesture', () => {
    render(wrap(<Probe />))
    swipe(-80)
    expect(index()).toBe(1)
    swipe(80)
    expect(index()).toBe(0)
  })

  it('does not navigate on short, vertical, or cancelled swipes', () => {
    render(wrap(<Probe />))
    swipe(-49)
    swipe(-60, 80)
    swipe(-60, 60)
    expect(index()).toBe(0)
    act(() => {
      window.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientX: 200, clientY: 200 } as Touch] }))
      window.dispatchEvent(new TouchEvent('touchcancel'))
      window.dispatchEvent(new TouchEvent('touchend', { changedTouches: [{ clientX: 50, clientY: 200 } as Touch] }))
    })
    expect(index()).toBe(0)
    swipe(-50)
    expect(index()).toBe(1)
  })

  it('leaves navigation keys to focused interactive controls', () => {
    render(wrap(<Probe />))
    const targets: Element[] = [
      screen.getByText('next'),
      screen.getByLabelText('field'),
      screen.getByText('link'),
      screen.getByLabelText('sel'),
      screen.getByLabelText('ta'),
      screen.getByText('sum'),
      screen.getByTestId('ce'),
      screen.getByTestId('nested'),
      screen.getByTestId('role-button'),
    ]
    for (const el of targets) {
      for (const key of ['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'p']) {
        const event = press(key, {}, el)
        expect(event.defaultPrevented, `${el.tagName} ${key}`).toBe(false)
      }
    }
    expect(index()).toBe(0)
    expect(mode()).toBe('browse')
  })

  it('also checks the active element, not just the event target', () => {
    render(wrap(<Probe />))
    screen.getByLabelText('field').focus()
    press('ArrowRight')
    press('p')
    expect(index()).toBe(0)
    expect(mode()).toBe('browse')
    ;(document.activeElement as HTMLElement).blur()
    press('ArrowRight')
    expect(index()).toBe(1)
  })

  it('ignores Ctrl, Meta and Alt combinations', () => {
    render(wrap(<Probe />))
    for (const mod of ['ctrlKey', 'metaKey', 'altKey']) {
      const event = press('ArrowRight', { [mod]: true })
      expect(event.defaultPrevented).toBe(false)
    }
    expect(index()).toBe(0)
  })

  it('removes its listeners on unmount', () => {
    const { unmount } = render(wrap(<Probe />))
    unmount()
    press('ArrowRight')
    swipe(-100)
    expect(document.body.textContent).toBe('')
  })
})
