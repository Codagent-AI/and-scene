// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { Presentation } from '../src/presentation-kit/Presentation'
import { fitScale } from '../src/presentation-kit/constants'
import type { Step, SceneProps } from '../src/presentation-kit/types'

afterEach(cleanup)
const mounted = vi.fn()
function Scene({ payload }: SceneProps<{ label: string }>) {
  useEffect(() => { mounted() }, [])
  return <div>{payload.label}</div>
}
const steps: Step<{ label: string }>[] = ['one', 'two', 'three'].map((label) => ({
  id: label, era: label === 'three' ? 'end' : 'start', title: label,
  caption: `caption ${label}`, Scene, groupKey: 'shared', payload: { label },
}))
function setup() {
  mounted.mockClear()
  return render(<Presentation steps={steps} title="Example" />)
}
function key(value: string) { fireEvent.keyDown(window, { key: value }) }
function index() { return document.querySelector('[data-step-index]')?.getAttribute('data-step-index') }

test('fit scales uniformly within both available dimensions, including narrow screens', () => {
  expect(fitScale(440, 380)).toBe(.5)
  expect(fitScale(880, 190)).toBe(.5)
  expect(fitScale(220, 100)).toBe(.25)
})
test('grouped payload updates persist the scene and navigation clamps', () => {
  setup()
  key('ArrowLeft'); expect(index()).toBe('0')
  key('ArrowRight'); expect(index()).toBe('1')
  expect(screen.getByText('caption two')).toBeTruthy()
  expect(mounted).toHaveBeenCalledTimes(1)
  key('PageDown'); key(' '); expect(index()).toBe('2')
  key('PageUp'); expect(index()).toBe('1')
})
test('mode preserves position and controls keep their keys', () => {
  setup(); key('ArrowRight'); key('p')
  expect(index()).toBe('1')
  expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('present')
  expect(screen.queryByText('caption two')).toBeNull()
  key('p')
  const next = screen.getByRole('button', { name: 'Next step' })
  next.focus(); fireEvent.keyDown(next, { key: 'ArrowRight' })
  expect(index()).toBe('1')
})
test('direct jumps expose semantic state and touch swipes advance once', () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'Step 3: three' }))
  expect(index()).toBe('2')
  expect(screen.getByRole('button', { name: 'Step 3: three' }).getAttribute('aria-current')).toBe('step')
  const root = document.querySelector('[data-presentation-root]')!
  fireEvent.touchStart(root, { touches: [{ clientX: 10, clientY: 20 }] })
  fireEvent.touchEnd(root, { changedTouches: [{ clientX: 110, clientY: 22 }] })
  expect(index()).toBe('1')
  expect(screen.getByRole('link', { name: 'made by and-scene' })).toBeTruthy()
})
test('ungrouped scenes remount', async () => {
  const ungrouped = steps.map(step => ({ ...step, groupKey: undefined }))
  render(<Presentation steps={ungrouped} title="Example" />)
  mounted.mockClear()
  key('ArrowRight')
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 600)) })
  expect(mounted).toHaveBeenCalledTimes(1)
})
test('empty step lists fail with an actionable error', () => {
  expect(() => render(<Presentation steps={[]} title="Empty" />)).toThrow('at least one step')
})
test('contenteditable and input fields keep navigation keys', () => {
  setup()
  for (const element of [document.createElement('input'), document.createElement('div')]) {
    element.setAttribute('contenteditable', 'true')
    document.body.append(element)
    fireEvent.keyDown(element, { key: 'PageDown' })
    expect(index()).toBe('0')
    element.remove()
  }
})
test('ToC is wide-only and jumps to the first step of an era', () => {
  Object.defineProperty(window, 'innerWidth', { writable: true, value: 1400 })
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'end' }))
  expect(index()).toBe('2')
  fireEvent.click(screen.getByRole('button', { name: 'start' }))
  expect(index()).toBe('0')
  act(() => { window.innerWidth = 400; window.dispatchEvent(new Event('resize')) })
  expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
})

test('native disclosures keep Space and clicking Present transfers focus to the scene', () => {
  render(<Presentation steps={steps} title="Example" brand={<details><summary>Details</summary>Brand details</details>} />)
  const summary = screen.getByText('Details')
  summary.focus()
  const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
  summary.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  expect(index()).toBe('0')
  const toggle = screen.getByRole('button', { name: 'Toggle presentation mode' })
  toggle.focus()
  fireEvent.click(toggle)
  expect(document.activeElement).toBe(document.querySelector('[data-presentation-root]'))
  fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
  expect(index()).toBe('1')
})
