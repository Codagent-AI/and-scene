import { act, render, screen, waitFor } from '@testing-library/react'
import { motion } from 'motion/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation'
import { Box } from '../nodes/Box'
import { SceneLayer } from '../nodes/SceneLayer'
import { sceneKey } from '../sceneKey'
import type { SceneProps, Step } from '../types'
import { FixtureScene, OtherScene, makeSteps, mountCount, resetMounts, setViewport, type FixturePayload } from './fixtures'

const press = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
const entity = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement | null

beforeEach(() => {
  setViewport(1440, 900)
  resetMounts()
})

describe('grouped scenes', () => {
  it('keeps one Scene instance across same-group, same-Scene steps and only updates the payload', () => {
    render(<Presentation steps={makeSteps(4)} title="Deck" />)
    const node = screen.getByTestId('scene')
    expect(mountCount()).toBe(1)
    for (let i = 1; i < 4; i++) {
      press('ArrowRight')
      expect(screen.getAllByTestId('scene')).toHaveLength(1)
      expect(screen.getByTestId('scene')).toBe(node)
      expect(node.textContent).toBe(`payload ${i}`)
    }
    expect(mountCount()).toBe(1)
  })

  it('remounts when the group changes and cross-fades through presence', async () => {
    const steps = makeSteps(2)
    steps[1] = { ...steps[1], groupKey: 'other' }
    render(<Presentation steps={steps} title="Deck" />)
    const first = screen.getByTestId('scene')
    press('ArrowRight')
    expect(mountCount()).toBe(2)
    expect(screen.getAllByTestId('scene')).toHaveLength(2)
    expect(first.closest('[data-presentation-scene]')).not.toBe(
      screen.getAllByTestId('scene')[1].closest('[data-presentation-scene]'),
    )
    await waitFor(() => expect(screen.getAllByTestId('scene')).toHaveLength(1))
    expect(screen.getByTestId('scene').textContent).toBe('payload 1')
  })

  it('remounts when the Scene component changes even within one group', () => {
    const steps: Step<FixturePayload>[] = makeSteps(2)
    steps[1] = { ...steps[1], Scene: OtherScene }
    render(<Presentation steps={steps} title="Deck" />)
    press('ArrowRight')
    expect(screen.getByTestId('other-scene')).toBeTruthy()
    expect(sceneKey(steps[0])).not.toBe(sceneKey(steps[1]))
  })

  it('derives equal keys only for the same group and Scene', () => {
    const [a, b] = makeSteps(2)
    expect(sceneKey(a)).toBe(sceneKey(b))
    expect(sceneKey({ ...b, groupKey: undefined })).not.toBe(sceneKey(a))
    expect(sceneKey({ ...a, groupKey: undefined })).not.toBe(sceneKey({ ...b, groupKey: undefined }))
    expect(sceneKey({ ...b, Scene: FixtureScene })).toBe(sceneKey(a))
  })
})

interface EntityPayload {
  n: number
}

function EntityScene({ payload }: SceneProps<EntityPayload>) {
  const n = payload.n
  return (
    <SceneLayer>
      <Box key="keeper" entity="keeper" style={{ left: n * 100, top: 20, width: 80, height: 40 }}>
        keeper {n}
      </Box>
      {n === 1 && (
        <Box key="newcomer" entity="newcomer" appear style={{ left: 300, top: 120, width: 80, height: 40 }}>
          new
        </Box>
      )}
      {n === 0 && (
        <Box key="leaver" entity="leaver" style={{ left: 300, top: 220, width: 80, height: 40 }}>
          leaving
        </Box>
      )}
      <motion.div
        key="raw"
        layoutId="raw"
        data-presentation-entity="raw"
        style={{ position: 'absolute', left: n * 10, top: 300, width: 30, height: 30 }}
      />
    </SceneLayer>
  )
}

const entitySteps = (): Step<EntityPayload>[] =>
  [0, 1, 2].map((n) => ({
    id: `e${n}`,
    era: 'x',
    title: `T${n}`,
    caption: `C${n}`,
    groupKey: 'ents',
    Scene: EntityScene,
    payload: { n },
  }))

describe('entity continuity', () => {
  it('persisting entities keep their DOM node, layoutId hook, and update geometry in place', () => {
    render(<Presentation steps={entitySteps()} title="Deck" />)
    const keeper = entity('keeper')!
    const raw = entity('raw')!
    expect(keeper.style.left).toBe('0px')
    press('ArrowRight')
    expect(entity('keeper')).toBe(keeper)
    expect(entity('raw')).toBe(raw)
    expect(keeper.style.left).toBe('100px')
    expect(raw.style.left).toBe('10px')
    expect(keeper.textContent).toBe('keeper 1')
    press('ArrowRight')
    expect(entity('keeper')).toBe(keeper)
    expect(keeper.style.left).toBe('200px')
  })

  it('a newcomer starts hidden and fades in after the delay; continuing entities are never faded', async () => {
    render(<Presentation steps={entitySteps()} title="Deck" />)
    press('ArrowRight')
    const newcomer = entity('newcomer')!
    expect(newcomer.style.opacity).toBe('0')
    expect(entity('keeper')!.style.opacity).not.toBe('0')
    expect(entity('raw')!.style.opacity).not.toBe('0')
    await waitFor(() => expect(Number(entity('newcomer')!.style.opacity)).toBe(1), { timeout: 3000 })
  })

  it('a departing entity exits with an animation and is then removed', async () => {
    render(<Presentation steps={entitySteps()} title="Deck" />)
    expect(entity('leaver')).not.toBeNull()
    press('ArrowRight')
    expect(entity('leaver')).not.toBeNull()
    await waitFor(() => expect(entity('leaver')).toBeNull(), { timeout: 3000 })
    expect(entity('keeper')).not.toBeNull()
  })
})
