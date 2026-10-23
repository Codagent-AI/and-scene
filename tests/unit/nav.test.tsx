// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePresentationNav } from '../../src/presentation-kit/usePresentationNav'
import { SWIPE_MIN_PX } from '../../src/presentation-kit/constants'
import type { Mode } from '../../src/presentation-kit/types'

function Harness({ count, initialMode = 'present' }: { count: number; initialMode?: Mode }) {
  const nav = usePresentationNav(count, initialMode)
  return (
    <div>
      <span data-testid="index">{nav.index}</span>
      <span data-testid="mode">{nav.mode}</span>
      <button type="button" data-testid="button">
        <span data-testid="nested">inside</span>
      </button>
      <a href="#x" data-testid="link">
        link
      </a>
      <input data-testid="input" />
      <select data-testid="select">
        <option>one</option>
      </select>
      <textarea data-testid="textarea" />
      <div data-testid="editable" contentEditable suppressContentEditableWarning>
        text
      </div>
      <div data-testid="role-button" role="button" tabIndex={0}>
        role
      </div>
      <div data-testid="plain">plain</div>
    </div>
  )
}

const index = () => Number(screen.getByTestId('index').textContent)
const mode = () => screen.getByTestId('mode').textContent

function press(target: Element | Window, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

function swipe(dx: number, dy: number) {
  const start = new Event('touchstart', { bubbles: true })
  Object.defineProperty(start, 'touches', { value: [{ clientX: 300, clientY: 300 }] })
  const end = new Event('touchend', { bubbles: true })
  Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 300 + dx, clientY: 300 + dy }] })
  window.dispatchEvent(start)
  window.dispatchEvent(end)
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('keyboard navigation', () => {
  const forward = ['ArrowRight', 'PageDown', ' ']
  const back = ['ArrowLeft', 'PageUp']

  for (const key of forward) {
    it(`moves exactly one step forward for ${JSON.stringify(key)}`, () => {
      render(<Harness count={5} />)
      act(() => {
        press(document.body, 'ArrowRight')
      })
      const before = index()
      act(() => {
        press(document.body, key)
      })
      expect(index()).toBe(before + 1)
    })
  }

  for (const key of back) {
    it(`moves exactly one step back for ${key}`, () => {
      render(<Harness count={5} />)
      act(() => {
        press(document.body, 'ArrowRight')
        press(document.body, 'ArrowRight')
      })
      expect(index()).toBe(2)
      act(() => {
        press(document.body, key)
      })
      expect(index()).toBe(1)
    })
  }

  it('toggles mode with P and keeps the current step', () => {
    render(<Harness count={5} initialMode="browse" />)
    act(() => {
      press(document.body, 'ArrowRight')
      press(document.body, 'ArrowRight')
    })
    act(() => {
      press(document.body, 'p')
    })
    expect(mode()).toBe('present')
    expect(index()).toBe(2)
    act(() => {
      press(document.body, 'P')
    })
    expect(mode()).toBe('browse')
    expect(index()).toBe(2)
  })

  it('prevents default only for keys it handles', () => {
    render(<Harness count={5} />)
    const handled = press(document.body, ' ')
    const unhandled = press(document.body, 'a')
    expect(handled.defaultPrevented).toBe(true)
    expect(unhandled.defaultPrevented).toBe(false)
  })

  it('ignores modifier-key combinations', () => {
    render(<Harness count={5} />)
    act(() => {
      press(document.body, 'ArrowRight', { ctrlKey: true })
      press(document.body, 'ArrowRight', { metaKey: true })
      press(document.body, 'ArrowRight', { altKey: true })
      press(document.body, 'ArrowRight', { shiftKey: true })
      press(document.body, 'p', { ctrlKey: true })
    })
    expect(index()).toBe(0)
    expect(mode()).toBe('present')
  })
})

describe('controls keep their keys', () => {
  const targets = ['button', 'nested', 'link', 'input', 'select', 'textarea', 'editable', 'role-button']
  for (const testId of targets) {
    it(`does not navigate or toggle when the key starts on ${testId}`, () => {
      render(<Harness count={5} initialMode="browse" />)
      const target = screen.getByTestId(testId)
      const probe = press(target, 'ArrowRight')
      press(target, 'PageDown')
      press(target, ' ')
      press(target, 'p')
      expect(index()).toBe(0)
      expect(mode()).toBe('browse')
      expect(probe.defaultPrevented).toBe(false)
    })
  }

  it('still navigates from a non-interactive element', () => {
    render(<Harness count={5} />)
    act(() => {
      press(screen.getByTestId('plain'), 'ArrowRight')
    })
    expect(index()).toBe(1)
  })
})

describe('touch swipe', () => {
  it('advances on a left swipe and goes back on a right swipe', () => {
    render(<Harness count={5} />)
    act(() => swipe(-120, 4))
    expect(index()).toBe(1)
    act(() => swipe(120, -3))
    expect(index()).toBe(0)
  })

  it('ignores short swipes, including one just under the threshold', () => {
    render(<Harness count={5} />)
    act(() => swipe(-(SWIPE_MIN_PX - 1), 0))
    expect(index()).toBe(0)
  })

  it('counts a swipe of exactly the threshold', () => {
    render(<Harness count={5} />)
    act(() => swipe(-SWIPE_MIN_PX, 0))
    expect(index()).toBe(1)
  })

  it('ignores vertical swipes and swipes with equal axis travel', () => {
    render(<Harness count={5} />)
    act(() => swipe(-10, 200))
    act(() => swipe(-80, 80))
    expect(index()).toBe(0)
  })
})

describe('boundaries', () => {
  it('clamps at the first and last steps with no wrap', () => {
    render(<Harness count={3} />)
    act(() => {
      press(document.body, 'ArrowLeft')
      press(document.body, 'PageUp')
    })
    expect(index()).toBe(0)
    act(() => {
      for (let i = 0; i < 6; i += 1) press(document.body, 'ArrowRight')
      swipe(-200, 0)
    })
    expect(index()).toBe(2)
  })
})

describe('StrictMode', () => {
  it('moves one step per key press and removes its key listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(
      <StrictMode>
        <Harness count={5} />
      </StrictMode>,
    )
    act(() => {
      press(document.body, 'ArrowRight')
    })
    expect(index()).toBe(1)
    unmount()
    const keyRemoved = removeSpy.mock.calls.some(([type]) => type === 'keydown')
    expect(keyRemoved).toBe(true)
  })
})
