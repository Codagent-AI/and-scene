// @vitest-environment jsdom
import { useEffect } from 'react'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vitest'
import { Box } from './nodes/Box'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

void React

type Payload = { label: string }

let sceneMounts = 0

function DemoScene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    sceneMounts += 1
  }, [])

  return <Box layoutId="demo-entity">{payload.label}</Box>
}

const steps: readonly Step<Payload>[] = [
  {
    id: 'start',
    era: 'beginning',
    title: 'First step',
    caption: 'The first scene state.',
    groupKey: 'demo',
    Scene: DemoScene,
    payload: { label: 'one' },
  },
  {
    id: 'middle',
    era: 'middle',
    title: 'Second step',
    caption: 'The second scene state.',
    groupKey: 'demo',
    Scene: DemoScene,
    payload: { label: 'two' },
  },
]

afterEach(() => {
  cleanup()
  sceneMounts = 0
})

test('keeps a grouped typed scene mounted while its payload changes', async () => {
  const user = userEvent.setup()
  render(<Presentation steps={steps} title="Typed presentation" />)

  expect(screen.getByText('one')).toBeTruthy()
  expect(sceneMounts).toBe(1)

  await user.click(screen.getByRole('button', { name: 'Next step' }))

  expect(screen.getByText('two')).toBeTruthy()
  expect(sceneMounts).toBe(1)
})

test('clamps the active step when a mounted presentation receives fewer steps', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<Presentation steps={steps} title="Changing steps" />)

  await user.click(screen.getByRole('button', { name: 'Next step' }))
  rerender(<Presentation steps={steps.slice(0, 1)} title="Changing steps" />)

  expect(screen.getByTestId('presentation-chrome').dataset.stepIndex).toBe('0')
  expect(screen.getByText('one')).toBeTruthy()
})

test('exposes active navigation semantics and direct step jumps', async () => {
  const user = userEvent.setup()
  render(<Presentation steps={steps} title="Navigation" />)

  const secondStep = screen.getByRole('button', { name: 'Go to step 2' })
  expect(secondStep.getAttribute('aria-current')).toBeNull()
  await user.click(secondStep)

  expect(secondStep.getAttribute('aria-current')).toBe('step')
  expect(secondStep.hasAttribute('data-presentation-active')).toBe(true)
  expect(screen.getByTestId('presentation-chrome').dataset.stepIndex).toBe('1')
})

test('clamps keyboard navigation at both ends and leaves focused controls alone', () => {
  render(<Presentation steps={steps} title="Navigation" />)
  const chrome = screen.getByTestId('presentation-chrome')

  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(chrome.dataset.stepIndex).toBe('0')

  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(chrome.dataset.stepIndex).toBe('1')

  const next = screen.getByRole('button', { name: 'Next step' })
  next.focus()
  fireEvent.keyDown(next, { key: 'ArrowLeft' })
  expect(chrome.dataset.stepIndex).toBe('1')
})

test('switches modes without losing the active step', async () => {
  const user = userEvent.setup()
  render(<Presentation steps={steps} title="Modes" />)
  await user.click(screen.getByRole('button', { name: 'Next step' }))
  await user.click(screen.getByRole('button', { name: 'Switch to present mode' }))

  expect(screen.getByTestId('presentation-chrome').dataset.stepIndex).toBe('1')
  expect(screen.getByTestId('presentation-chrome').dataset.presentationMode).toBe('present')
  expect(screen.queryByText('The second scene state.')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Previous step' })).toBeNull()
})

test('provides unstyled primitives and a default attribution hook', () => {
  const { container } = render(<Box layoutId="plain">unstyled</Box>)

  const box = container.querySelector('[data-presentation-box]')
  expect(box?.getAttribute('style')).toBeNull()
  expect(box?.className).toContain('presentation-box')
  render(<Presentation steps={steps} title="Attribution" />)
  const attribution = screen.getByRole('link', { name: 'made by and-scene' })
  expect(attribution.getAttribute('href')).toContain('github.com')
  expect(attribution.hasAttribute('data-presentation-attribution')).toBe(true)
})

test('uses the fixed 880 by 380 design canvas', () => {
  render(<Presentation steps={steps} title="Canvas" />)

  const canvas = screen.getByTestId('presentation-canvas')
  expect(canvas.dataset.designWidth).toBe('880')
  expect(canvas.dataset.designHeight).toBe('380')
})

test('gives the chrome wrapper the viewport grid that sizes the stage', () => {
  render(<Presentation steps={steps} title="Layout" />)

  const chrome = screen.getByTestId('presentation-chrome')
  expect(chrome.style.display).toBe('grid')
  expect(chrome.style.gridTemplateRows).toBe('auto auto minmax(0, 1fr) auto')
  expect(chrome.style.minHeight).toBe('100vh')
  expect(screen.getByTestId('presentation-canvas').parentElement?.parentElement?.style.gridRow).toBe('3')
  expect(screen.getByRole('navigation', { name: 'Presentation sections' }).style.gridRow).toBe('2')
  expect(screen.getByRole('contentinfo').style.gridRow).toBe('4')
})

test('accepts the grouped typed payload contract without a cast', () => {
  const typedStep: Step<Payload> = steps[0]
  expect(typedStep.payload.label).toBe('one')
})
