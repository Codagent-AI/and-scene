// @vitest-environment jsdom
import { useEffect, type ComponentType } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { Presentation, Box, SceneLayer, type SceneProps, type Step } from '../../src/presentation-kit'
import { mounts, stubMatchMedia } from './fixtures'

beforeEach(() => {
  mounts.count = 0
  stubMatchMedia(true)
})

/** A scene that draws the given entity ids. */
function sceneOf(entities: string[]): ComponentType<SceneProps<string>> {
  return function FixtureScene() {
    return (
      <SceneLayer>
        {entities.map((id) => (
          <Box key={id} id={id} geometry={{ x: 10, y: 10, w: 80, h: 40 }}>
            {id}
          </Box>
        ))}
      </SceneLayer>
    )
  }
}

/** A scene that counts its own mounts, so tests can detect remounts. */
function countedSceneOf(entities: string[]): ComponentType<SceneProps<string>> {
  const Inner = sceneOf(entities)
  return function CountedScene(props: SceneProps<string>) {
    useEffect(() => {
      mounts.count += 1
    }, [])
    return <Inner {...props} />
  }
}

function step(id: string, Scene: ComponentType<SceneProps<string>>, groupKey?: string): Step<string> {
  return { id, era: 'e', title: id, caption: id, Scene, payload: id, groupKey }
}

function nextButton(container: HTMLElement) {
  return container.querySelector('[data-presentation-next]') as HTMLElement
}

describe('persisting and departing entities', () => {
  it('a continuing entity is rendered in both steps, with the outgoing and incoming copies mounted together', () => {
    const steps = [step('a', sceneOf(['shared'])), step('b', sceneOf(['shared', 'new']))]
    const { container } = render(<Presentation title="t" steps={steps} />)
    fireEvent.click(nextButton(container))
    // AnimatePresence keeps the outgoing scene mounted while the incoming one mounts.
    expect(container.querySelectorAll('[data-presentation-id="shared"]')).toHaveLength(2)
    expect(container.querySelector('[data-presentation-id="new"]')).not.toBeNull()
  })

  it('a departing entity stays mounted through its exit, then is removed', async () => {
    const steps = [step('a', sceneOf(['departing', 'stays'])), step('b', sceneOf(['stays']))]
    const { container } = render(<Presentation title="t" steps={steps} />)
    act(() => {
      fireEvent.click(nextButton(container))
    })
    expect(container.querySelector('[data-presentation-id="departing"]')).not.toBeNull()
    await waitFor(() => expect(container.querySelector('[data-presentation-id="departing"]')).toBeNull(), {
      timeout: 4000,
    })
    expect(container.querySelector('[data-presentation-id="stays"]')).not.toBeNull()
  })
})

describe('grouped scene persistence', () => {
  it('same groupKey and same Scene: one instance and one root node across navigation, no remount', () => {
    const Scene = countedSceneOf(['x'])
    const steps = [step('a', Scene, 'g'), step('b', Scene, 'g'), step('c', Scene, 'g')]
    const { container } = render(<Presentation title="t" steps={steps} />)
    const root = container.querySelector('[data-presentation-scene]')
    const before = mounts.count
    fireEvent.click(nextButton(container))
    fireEvent.click(nextButton(container))
    expect(container.querySelector('[data-presentation-scene]')).toBe(root)
    expect(mounts.count).toBe(before)
  })

  it('same groupKey but a different Scene remounts', () => {
    const steps = [step('a', countedSceneOf(['x']), 'g'), step('b', countedSceneOf(['x']), 'g')]
    const { container } = render(<Presentation title="t" steps={steps} />)
    const before = mounts.count
    fireEvent.click(nextButton(container))
    expect(mounts.count).toBe(before + 1)
  })

  it('a different groupKey with the same Scene remounts', () => {
    const Scene = countedSceneOf(['x'])
    const steps = [step('a', Scene, 'g1'), step('b', Scene, 'g2')]
    const { container } = render(<Presentation title="t" steps={steps} />)
    const before = mounts.count
    fireEvent.click(nextButton(container))
    expect(mounts.count).toBe(before + 1)
  })
})
