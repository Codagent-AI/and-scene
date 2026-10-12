import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { Step } from './types'
let mounts = 0
function Scene({ payload }: { payload: { text: string } }) { useEffect(() => { mounts += 1 }, []); return <div>{payload.text}</div> }
const steps: Step<{ text: string }>[] = [
 { id: 'one', section: 'Start', title: 'One', caption: 'First caption', Scene, payload: { text: 'first' }, groupKey: 'same' },
 { id: 'two', section: 'Next', title: 'Two', caption: 'Second caption', Scene, payload: { text: 'second' }, groupKey: 'same' },
]
describe('Presentation contract', () => {
 beforeEach(() => { mounts = 0 })
 it('accepts a typed step array and exposes navigation, mode, active state, attribution hooks', () => {
  render(<Presentation steps={steps} title="Sample" initialMode="browse" />)
  expect(screen.getByText('first')).toBeTruthy()
  expect(document.querySelector('[data-step-count="2"][data-step-index="0"]')).toBeTruthy()
  expect(document.querySelector('[data-presentation-attribution]')?.getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
  expect(document.querySelector('[data-presentation-attribution]')?.textContent).toBe('made by and-scene')
  expect(document.querySelector('[data-presentation-toc-entry][aria-current="step"][data-active="true"]')).toBeTruthy()
  expect(document.querySelector('[data-presentation-progress-indicator][aria-current="step"][data-active="true"]')).toBeTruthy()
  fireEvent.click(document.querySelector('[data-presentation-next]')!)
  expect(screen.getByText('second')).toBeTruthy()
  expect(mounts).toBe(1)
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  expect(document.querySelector('[data-presentation-toc-entry][aria-current="step"][data-active="true"]')?.textContent).toBe('Next')
  expect(document.querySelector('[data-presentation-progress-indicator][aria-current="step"][data-active="true"]')?.getAttribute('data-presentation-step-index')).toBe('1')
  fireEvent.click(document.querySelector('[data-presentation-mode-toggle]')!)
  expect(document.querySelector('[data-presentation-mode="present"]')).toBeTruthy()
  expect(document.querySelector('[data-presentation-caption]')).toBeNull()
 })
 it('shows the active step title and caption in browse mode and tracks navigation', () => {
  const { container, unmount } = render(<Presentation steps={steps} title="Sample" initialMode="browse" />)
  expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe('One')
  expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('First caption')
  fireEvent.click(container.querySelector('[data-presentation-next]')!)
  expect(container.querySelector('[data-presentation-step-title]')?.textContent).toBe('Two')
  fireEvent.click(container.querySelector('[data-presentation-mode-toggle]')!)
  expect(container.querySelector('[data-presentation-step-title]')).toBeNull()
  expect(container.querySelector('[data-presentation-title]')?.textContent).toBe('Two')
  unmount()
 })
 it('jumps to the first step of a section and handles keyboard boundaries', () => {
  render(<Presentation steps={steps} title="Sample" initialMode="browse" />)
  fireEvent.click(document.querySelector('[data-presentation-progress-indicator][data-presentation-step-index="1"]')!)
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  fireEvent.click(document.querySelector('[data-presentation-toc-entry]')!)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  fireEvent.keyDown(document.querySelector('[data-presentation-next]')!, { key: 'ArrowLeft' })
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
 })
 it('does not assign default branding in the header', () => {
  render(<Presentation steps={steps} title="Sample" />)
  expect(document.querySelector('[data-presentation-header] a')).toBeNull()
 })
 it('supports every keyboard alias and preserves position when P toggles modes', () => {
  render(<Presentation steps={steps} title="Sample" initialMode="present" />)
  for (const key of [' ', 'PageDown']) fireEvent.keyDown(window, { key })
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  for (const key of ['PageUp']) fireEvent.keyDown(window, { key })
  expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  fireEvent.keyDown(window, { key: 'p' })
  expect(document.querySelector('[data-presentation-mode="browse"]')).toBeTruthy()
  fireEvent.keyDown(window, { key: 'P' })
  expect(document.querySelector('[data-presentation-mode="present"]')).toBeTruthy()
  expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
 })
 it('swipes left to advance and right to go back', () => {
  render(<Presentation steps={steps} title="Sample" />)
  const stage = document.querySelector('[data-presentation-stage]')!
  fireEvent.touchStart(stage, { touches: [{ clientX: 180 }] })
  fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 100 }] })
  expect(document.querySelector('[data-step-index="1"]')).toBeTruthy()
  fireEvent.touchStart(stage, { touches: [{ clientX: 100 }] })
  fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 180 }] })
  expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
 })
 it('does not hijack navigation keys from controls or editable elements', () => {
  render(<Presentation steps={steps} title="Sample" initialMode="browse" />)
  const next = document.querySelector<HTMLButtonElement>('[data-presentation-next]')!
  next.focus()
  fireEvent.keyDown(next, { key: 'ArrowRight' })
  expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  const editable = document.createElement('input')
  document.body.append(editable)
  editable.focus()
  fireEvent.keyDown(editable, { key: 'PageDown' })
  expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
  editable.remove()
 })
 it('renders an empty stage when there are no steps', () => {
  render(<Presentation steps={[]} title="Empty" />)
  expect(document.querySelector('[data-presentation-stage]')).toBeTruthy()
  expect(document.querySelector('[data-step-count="0"][data-step-index="0"]')).toBeTruthy()
 })
 it('leaves modified browser shortcuts untouched', () => {
  render(<Presentation steps={steps} title="Sample" initialMode="browse" />)
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey'] as const) {
   fireEvent.keyDown(window, { key: 'p', [modifier]: true })
   fireEvent.keyDown(window, { key: ' ', [modifier]: true })
   fireEvent.keyDown(window, { key: 'PageDown', [modifier]: true })
   fireEvent.keyDown(window, { key: 'PageUp', [modifier]: true })
  }
  expect(document.querySelector('[data-presentation-mode="browse"]')).toBeTruthy()
  expect(document.querySelector('[data-step-index="0"]')).toBeTruthy()
 })
})
