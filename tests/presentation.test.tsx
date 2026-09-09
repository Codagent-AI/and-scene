import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { AppRouter } from '../src/AppRouter'
import {
  Box,
  Presentation,
  type PresentationRegistration,
  type Step,
} from '../src/presentation-kit'

type Payload = { readonly label: string }

function GroupedScene({ payload }: { payload: Payload }) {
  return <div data-scene-probe>{payload.label}</div>
}

const groupedSteps: readonly Step<Payload>[] = [
  {
    id: 'first',
    era: 'Introduction',
    title: 'First state',
    caption: 'The first state has a typed payload.',
    groupKey: 'diagram',
    Scene: GroupedScene,
    payload: { label: 'one' },
  },
  {
    id: 'second',
    era: 'Build',
    title: 'Second state',
    caption: 'The second state keeps the same scene instance.',
    groupKey: 'diagram',
    Scene: GroupedScene,
    payload: { label: 'two' },
  },
]

function StatefulScene({ payload }: { payload: Payload }) {
  const [selected, setSelected] = useState(false)
  return <button type="button" data-stateful-scene onClick={() => setSelected(true)}>{selected ? 'selected' : payload.label}</button>
}

const separateGroups: readonly Step<Payload>[] = [
  {
    id: 'first-group', era: 'First', title: 'First', caption: 'First group.', groupKey: 'first', Scene: StatefulScene, payload: { label: 'one' },
  },
  {
    id: 'second-group', era: 'Second', title: 'Second', caption: 'Second group.', groupKey: 'second', Scene: StatefulScene, payload: { label: 'two' },
  },
]

let root: Root | undefined
let host: HTMLDivElement | undefined

function render(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root?.render(node))
  return host
}

function press(key: string) {
  act(() => (document.activeElement ?? window).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
}

function modifiedPress(key: string) {
  act(() => (document.activeElement ?? window).dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true })))
}

function swipe(target: HTMLElement, startX: number, endX: number) {
  const touch = (type: string, clientX: number) => {
    const event = new Event(type, { bubbles: true })
    Object.defineProperty(event, 'changedTouches', { value: [{ clientX }] })
    target.dispatchEvent(event)
  }
  act(() => {
    touch('touchstart', startX)
    touch('touchend', endX)
  })
}

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = undefined
  host = undefined
})

describe('Presentation', () => {
  it('accepts typed grouped payloads and updates their shared scene in place', () => {
    const screen = render(<Presentation steps={groupedSteps} title="Typed scene" />)
    const scene = screen.querySelector('[data-scene-probe]')

    expect(scene?.textContent).toBe('one')
    press('ArrowRight')
    expect(screen.querySelector('[data-scene-probe]')).toBe(scene)
    expect(scene?.textContent).toBe('two')
  })

  it('renders browse chrome, semantic active controls, attribution, and mode-preserving navigation', () => {
    const screen = render(<Presentation steps={groupedSteps} title="A title" initialMode="browse" />)

    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-count')).toBe('2')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('0')
    expect(screen.querySelector('[data-presentation-caption]')?.textContent).toContain('first state')
    expect(screen.querySelector('[data-presentation-progress][aria-current="step"]')).not.toBeNull()
    expect(screen.querySelector('[data-presentation-progress][data-active="true"]')).not.toBeNull()
    expect(screen.querySelector('[data-presentation-attribution]')?.getAttribute('href')).toBe(
      'https://github.com/Codagent-AI/and-scene',
    )
    expect(screen.textContent).toContain('made by and-scene')
    expect(screen.querySelector('[data-presentation-brand]')).toBeNull()

    act(() => screen.querySelector<HTMLButtonElement>('[data-presentation-progress]:last-child')?.click())
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1')
    act(() => screen.querySelector<HTMLButtonElement>('[data-presentation-toc-entry]')?.click())
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('0')
    swipe(screen.querySelector<HTMLElement>('[data-presentation-root]')!, 100, 20)
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1')
    press('p')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-mode')).toBe('present')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1')
    expect(screen.querySelector('[data-presentation-caption]')).toBeNull()
    expect(screen.querySelector('[data-presentation-prev]')).toBeNull()
  })

  it('clamps navigation and leaves focused controls to their native keys', () => {
    const screen = render(<Presentation steps={groupedSteps} title="A title" />)

    press('ArrowLeft')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('0')
    press('End')
    press('ArrowRight')
    press('ArrowRight')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1')

    const previous = screen.querySelector<HTMLButtonElement>('[data-presentation-prev]')!
    previous.focus()
    press('ArrowLeft')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1')
  })

  it('keeps rendering a valid step when the step list shrinks', () => {
    const screen = render(<Presentation steps={groupedSteps} title="A title" />)

    press('ArrowRight')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('1')

    act(() => root?.render(<Presentation steps={groupedSteps.slice(0, 1)} title="A title" />))

    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('0')
    expect(screen.querySelector('[data-scene-probe]')?.textContent).toBe('one')
  })

  it('does not handle modified browser shortcuts', () => {
    const screen = render(<Presentation steps={groupedSteps} title="A title" />)

    modifiedPress('p')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-mode')).toBe('browse')
    modifiedPress('ArrowRight')
    expect(screen.querySelector('[data-presentation-root]')?.getAttribute('data-step-index')).toBe('0')
  })

  it('resets local scene state when a new scene group starts', () => {
    const screen = render(<Presentation steps={separateGroups} title="Separate groups" />)

    act(() => screen.querySelector<HTMLButtonElement>('[data-stateful-scene]')?.click())
    expect(screen.querySelector('[data-stateful-scene]')?.textContent).toBe('selected')
    press('ArrowRight')
    expect(screen.querySelector('[data-stateful-scene]')?.textContent).toBe('two')
  })

  it('recalculates the fit scale immediately when presentation mode changes', () => {
    const originalWidth = window.innerWidth
    const originalHeight = window.innerHeight
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2000 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 })
    const screen = render(<Presentation steps={groupedSteps} title="A title" />)

    expect(screen.querySelector('[data-presentation-canvas]')?.getAttribute('style')).toContain('scale(0.7368421052631579)')
    press('p')
    expect(screen.querySelector('[data-presentation-canvas]')?.getAttribute('style')).toContain('scale(1.0526315789473684)')

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight })
  })

  it('exposes unstyled primitive hooks without adding visual defaults', () => {
    const screen = render(<Box layoutId="box" data-testid="box">Plain</Box>)
    const box = screen.querySelector('[data-presentation-box]')!

    expect(box.getAttribute('data-layout-id')).toBe('box')
    expect(box.getAttribute('style')).toBeNull()
    expect(box.className).toContain('presentation-box')
  })
})

describe('AppRouter', () => {
  it('renders the landing page and a registered pathname route', async () => {
    const registry: readonly PresentationRegistration[] = [
      {
        slug: 'example',
        title: 'Example route',
        load: async () => ({ default: () => <p>Registered presentation</p> }),
      },
    ]

    const landing = render(<AppRouter pathname="/" registry={registry} />)
    expect(landing.textContent).toContain('Example route')
    act(() => root?.unmount())

    const route = render(<AppRouter pathname="/example" registry={registry} />)
    await act(async () => {})
    expect(route.textContent).toContain('Registered presentation')
  })
})
