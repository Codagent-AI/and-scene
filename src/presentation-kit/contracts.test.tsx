import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { Step } from './types'
let mounts = 0
function Scene({ payload }: { payload: { text: string } }) { useEffect(() => { mounts += 1 }, []); return <div>{payload.text}</div> }
const steps: Step<{ text: string }>[] = [
 { id: 'one', section: 'Start', title: 'One', caption: 'First caption', Scene, payload: { text: 'first' }, groupKey: 'same' },
 { id: 'two', section: 'Next', title: 'Two', caption: 'Second caption', Scene, payload: { text: 'second' }, groupKey: 'same' },
]
describe('Presentation contract', () => {
 it('accepts a typed step array and exposes navigation, mode, active state, attribution hooks', () => {
  mounts = 0
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
  fireEvent.click(document.querySelector('[data-presentation-mode-toggle]')!)
  expect(document.querySelector('[data-presentation-mode="present"]')).toBeTruthy()
  expect(document.querySelector('[data-presentation-caption]')).toBeNull()
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
})
