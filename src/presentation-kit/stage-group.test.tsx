import { StrictMode, useEffect, useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { sceneKey } from './scene-key'
import { Box } from './nodes/Box'
import type { SceneProps, Step } from './types'

afterEach(() => cleanup())
beforeEach(() => {
  events.length = 0
})

// Each mounted scene instance logs mount/unmount against a token fixed for its lifetime.
const events: string[] = []
let tokenSeq = 0

function useTracking(): { token: number; clicks: number; bump: () => void } {
  const [token] = useState(() => ++tokenSeq)
  const [clicks, setClicks] = useState(0)
  useEffect(() => {
    events.push(`mount:${token}`)
    return () => {
      events.push(`unmount:${token}`)
    }
  }, [token])
  return { token, clicks, bump: () => setClicks((c) => c + 1) }
}

/** Carries a continuing layout node (`shared`), used where the scene must persist. */
function Tracked({ payload, step }: SceneProps<string>) {
  const { token, clicks, bump } = useTracking()
  return (
    <div data-testid="tracked" data-token={token}>
      <span data-testid="payload">{payload}</span>
      <button type="button" onClick={bump}>
        bump
      </button>
      <span data-testid="clicks">{clicks}</span>
      <Box id="shared" x={10} y={10} w={50} h={50} label={step.title} />
    </div>
  )
}

/**
 * Same tracking without a layout node. In jsdom a shared-layout node inside an exiting scene never
 * finishes its exit (no layout engine), so exit-completion assertions use this scene.
 */
function Lite({ payload }: SceneProps<string>) {
  const { token, clicks, bump } = useTracking()
  return (
    <div data-testid="tracked" data-token={token}>
      <span data-testid="payload">{payload}</span>
      <button type="button" onClick={bump}>
        bump
      </button>
      <span data-testid="clicks">{clicks}</span>
    </div>
  )
}

/** A different component identity rendering the same content: a different Scene for grouping. */
function OtherScene(props: SceneProps<string>) {
  return <Lite {...props} />
}

const grouped = (id: string, payload: string, Scene: Step<string>['Scene'] = Lite, groupKey = 'board'): Step<string> => ({
  id,
  era: 'Only',
  title: id.toUpperCase(),
  caption: `${id} caption.`,
  groupKey,
  Scene,
  payload,
})

const ungrouped = (id: string, payload: string): Step<string> => ({
  id,
  era: 'Only',
  title: id.toUpperCase(),
  caption: `${id} caption.`,
  Scene: Lite,
  payload,
})

function renderDeck(steps: Step<string>[]) {
  return render(
    <StrictMode>
      <Presentation steps={steps} title="Deck" />
    </StrictMode>,
  )
}

function sceneElement(): HTMLElement {
  return document.querySelector('[data-presentation-scene]') as HTMLElement
}

function trackedToken(): string | null {
  return screen.getByTestId('tracked').getAttribute('data-token')
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
}

function prev() {
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
}

describe('sceneKey', () => {
  it('keys grouped steps by group and Scene, and ungrouped steps by step id', () => {
    expect(sceneKey(grouped('a', 'x'))).toBe(sceneKey(grouped('b', 'y')))
    expect(sceneKey(grouped('a', 'x', Tracked))).not.toBe(sceneKey(grouped('a', 'x', OtherScene)))
    expect(sceneKey(grouped('a', 'x', Tracked, 'one'))).not.toBe(sceneKey(grouped('a', 'x', Tracked, 'two')))
    expect(sceneKey(ungrouped('a', 'x'))).toBe('step:a')
    expect(sceneKey(ungrouped('a', 'x'))).not.toBe(sceneKey(ungrouped('b', 'x')))
  })
})

describe('Grouped steps update in place', () => {
  it('keeps one scene instance, its local state, and continuing nodes when group and Scene match', async () => {
    renderDeck([grouped('s1', 'one', Tracked), grouped('s2', 'two', Tracked), grouped('s3', 'three', Tracked)])
    // StrictMode's initial effect cycle: mount, unmount, mount for the same instance.
    const token = trackedToken()
    expect(events.filter((e) => e === `mount:${token}`)).toHaveLength(2)
    expect(events.filter((e) => e === `unmount:${token}`)).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'bump' }))
    const scene = sceneElement()
    const shared = document.querySelector('[data-presentation-id="shared"]')
    const before = events.length

    next()
    expect(screen.getByTestId('payload').textContent).toBe('two')
    next()
    prev()
    expect(screen.getByTestId('payload').textContent).toBe('two')

    expect(events.slice(before)).toEqual([])
    expect(trackedToken()).toBe(token)
    expect(sceneElement()).toBe(scene)
    expect(screen.getByTestId('clicks').textContent).toBe('1')
    expect(document.querySelector('[data-presentation-id="shared"]')).toBe(shared)
  }, 20_000) // cold StrictMode + motion layout mount takes seconds under parallel load

  it('mounts a new instance when the group key changes, and unmounts the old one', async () => {
    renderDeck([grouped('s1', 'one', Lite, 'first'), grouped('s2', 'two', Lite, 'second')])
    const oldToken = trackedToken()
    fireEvent.click(screen.getByRole('button', { name: 'bump' }))

    next()
    await waitFor(() => expect(events).toContain(`unmount:${oldToken}`))
    await waitFor(() => expect(screen.queryAllByTestId('tracked')).toHaveLength(1))
    expect(screen.getByTestId('payload').textContent).toBe('two')
    expect(trackedToken()).not.toBe(oldToken)
    expect(screen.getByTestId('clicks').textContent).toBe('0')
  })

  it('switches scenes through the presence host when the Scene component changes within a group', async () => {
    renderDeck([grouped('s1', 'one', Lite), grouped('s2', 'two', OtherScene)])
    const oldToken = trackedToken()
    const oldScene = sceneElement()

    next()
    await waitFor(() => expect(oldScene.isConnected).toBe(false))
    expect(events).toContain(`unmount:${oldToken}`)
    expect(trackedToken()).not.toBe(oldToken)
  })

  it('swaps scenes through the presence host for ungrouped steps', async () => {
    renderDeck([ungrouped('u1', 'one'), ungrouped('u2', 'two')])
    const oldToken = trackedToken()
    const oldScene = sceneElement()

    next()
    await waitFor(() => expect(oldScene.isConnected).toBe(false))
    expect(events).toContain(`unmount:${oldToken}`)
    expect(screen.getByTestId('payload').textContent).toBe('two')
    expect(trackedToken()).not.toBe(oldToken)
  })
})
