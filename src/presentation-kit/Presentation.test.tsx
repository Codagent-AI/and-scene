import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { ENTER_DELAY, LAYOUT_T } from './constants'
import type { SceneProps, Step } from './types'
import { Presentation } from './Presentation'

interface DemoPayload {
  label: string
}

let mounts = 0

function DemoScene({ payload }: SceneProps<DemoPayload>) {
  useEffect(() => {
    mounts += 1
  }, [])

  return <div data-demo-scene>{payload.label}</div>
}

function AlternateScene() {
  return <div>alternate scene</div>
}

const steps = [
  {
    id: 'start',
    era: 'beginning',
    title: 'First title',
    caption: 'The first caption.',
    Scene: DemoScene,
    groupKey: 'demo',
    payload: { label: 'first' },
  },
  {
    id: 'next',
    era: 'beginning',
    title: 'Second title',
    caption: 'The second caption.',
    Scene: DemoScene,
    groupKey: 'demo',
    payload: { label: 'second' },
  },
] satisfies readonly Step<DemoPayload>[]

beforeEach(() => {
  mounts = 0
})

test('passes typed grouped payloads through the presentation boundary without remounting', () => {
  render(<Presentation steps={steps} title="Demo" initialMode="browse" />)

  expect(screen.getByText('first')).toBeTruthy()
  expect(mounts).toBe(1)
  fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
  expect(screen.getByText('second')).toBeTruthy()
  expect(mounts).toBe(1)
})

test('cross-fades different scene components even when they reuse a group key', () => {
  const mixedScenes = [
    steps[0],
    { ...steps[1], Scene: AlternateScene },
  ] satisfies readonly Step<DemoPayload>[]

  render(<Presentation steps={mixedScenes} title="Demo" initialMode="browse" />)
  fireEvent.click(screen.getByRole('button', { name: 'Next step' }))

  expect(screen.getByText('first')).toBeTruthy()
  expect(screen.getByText('alternate scene')).toBeTruthy()
})

test('delays newcomers until continuing layout motion has settled', () => {
  expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
})

test('exposes browse chrome, active navigation semantics, and attribution', () => {
  render(<Presentation steps={steps} title="Demo" initialMode="browse" />)

  expect(screen.getByText('The first caption.')).toBeTruthy()
  const firstDot = screen.getByRole('button', { name: 'Go to step 1' })
  expect(firstDot.getAttribute('aria-current')).toBe('step')
  expect(firstDot.hasAttribute('data-presentation-active')).toBe(true)
  const tocEntry = screen.getByRole('button', { name: 'beginning' })
  expect(tocEntry.getAttribute('aria-current')).toBe('step')
  expect(tocEntry.hasAttribute('data-presentation-active')).toBe(true)
  expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe(
    'https://github.com/Codagent-AI/and-scene',
  )
})

test('clamps keyboard navigation, preserves position across modes, and does not hijack focused controls', () => {
  render(<Presentation steps={steps} title="Demo" initialMode="browse" />)

  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('0')
  fireEvent.keyDown(window, { key: 'End' })
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('1')
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('1')

  const next = screen.getByRole('button', { name: 'Next step' })
  next.focus()
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('1')

  next.blur()
  fireEvent.keyDown(window, { key: 'p' })
  expect(screen.queryByText('The second caption.')).toBeNull()
  expect(screen.getByText('Second title')).toBeTruthy()
  expect(screen.getByTestId('presentation-root').getAttribute('data-step-index')).toBe('1')
})

test('moves between steps with horizontal touch swipes', () => {
  render(<Presentation steps={steps} title="Demo" initialMode="browse" />)

  const presentation = screen.getByTestId('presentation-root')
  fireEvent.touchStart(presentation, { touches: [{ clientX: 240 }] })
  fireEvent.touchEnd(presentation, { changedTouches: [{ clientX: 120 }] })

  expect(presentation.getAttribute('data-step-index')).toBe('1')
})

test('shows the table of contents only on wide viewports', () => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 700 })
  render(<Presentation steps={steps} title="Demo" initialMode="browse" />)

  expect(screen.queryByRole('navigation', { name: 'Presentation sections' })).toBeNull()

  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
})
