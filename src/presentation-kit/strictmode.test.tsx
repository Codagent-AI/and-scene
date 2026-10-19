import { StrictMode, useEffect } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

let mounts = 0

function Counted({ payload }: SceneProps<string>) {
  useEffect(() => {
    mounts += 1
  }, [])
  return <div data-testid="scene">{payload}</div>
}

const ERAS = ['Setup', 'Setup', 'Build', 'Build', 'Build', 'Ship']

const steps: Step<string>[] = ERAS.map((era, i) => ({
  id: `s${i}`,
  era,
  title: `Title ${i}`,
  caption: `Caption ${i}`,
  groupKey: 'g',
  Scene: Counted,
  payload: `payload-${i}`,
}))

function setViewport(width: number, height = 900) {
  window.innerWidth = width
  window.innerHeight = height
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

function indexAttr(): string | null {
  return document.querySelector('[data-presentation-root]')?.getAttribute('data-step-index') ?? null
}

/** Net listeners added minus removed on window for an event type. */
interface CallSpy {
  mock: { calls: unknown[][] }
}

function netListeners(add: CallSpy, remove: CallSpy, type: string): number {
  const added = add.mock.calls.filter((c) => c[0] === type).length
  const removed = remove.mock.calls.filter((c) => c[0] === type).length
  return added - removed
}

beforeEach(() => {
  mounts = 0
  setViewport(1280)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('C-6: StrictMode tolerance of effect replay', () => {
  it('C-6: under StrictMode, grouped navigation and mode toggles neither remount the scene nor double-handle events', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const keyNetBefore = netListeners(add, remove, 'keydown')
    const touchNetBefore = netListeners(add, remove, 'touchstart')

    const { unmount } = render(
      <StrictMode>
        <Presentation steps={steps} title="Deck" initialMode="present" />
      </StrictMode>,
    )

    // StrictMode's initial effect replay mounts the scene twice; that is the baseline, not a navigation remount.
    const baseline = mounts
    const node = document.querySelector('[data-testid="scene"]')
    expect(node?.textContent).toBe('payload-0')

    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(indexAttr()).toBe('1')
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(indexAttr()).toBe('2')
    fireEvent.keyDown(document.body, { key: ' ' })
    expect(indexAttr()).toBe('3')
    fireEvent.keyDown(document.body, { key: 'PageUp' })
    expect(indexAttr()).toBe('2')
    expect(document.querySelector('[data-testid="scene"]')?.textContent).toBe('payload-2')

    fireEvent.keyDown(document.body, { key: 'p' })
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('browse')
    expect(indexAttr()).toBe('2')
    fireEvent.click(document.querySelector('[data-presentation-mode-toggle]') as HTMLButtonElement)
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
    expect(indexAttr()).toBe('2')

    expect(mounts).toBe(baseline)
    expect(document.querySelector('[data-testid="scene"]')).toBe(node)

    // Listener cleanup: after unmount, the keydown and touch listeners this tree added are removed.
    expect(netListeners(add, remove, 'keydown')).toBeGreaterThan(keyNetBefore)
    unmount()
    expect(netListeners(add, remove, 'keydown')).toBe(keyNetBefore)
    expect(netListeners(add, remove, 'touchstart')).toBe(touchNetBefore)
  })
})
