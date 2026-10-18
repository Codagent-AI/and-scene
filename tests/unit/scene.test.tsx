import { StrictMode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import { Appear, Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../src/presentation-kit'
import { CountingScene, makeDeck, mounts, resetMounts } from '../support/deck'

const key = (k: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })))
const scenes = () => document.querySelectorAll('[data-presentation-scene]')

beforeEach(resetMounts)

describe('grouped scenes', () => {
  it('keeps one scene instance across steps sharing group and Scene, forward and back', () => {
    render(<Presentation steps={makeDeck()} title="Deck" />)
    const first = scenes()[0]
    expect(mounts.scene).toBe(1)
    key('ArrowRight')
    key('ArrowRight')
    expect(scenes()[0]).toBe(first)
    expect(screen.getByTestId('scene-payload').textContent).toBe('payload c')
    key('ArrowLeft')
    expect(scenes()[0]).toBe(first)
    expect(screen.getByTestId('scene-payload').textContent).toBe('payload b')
    expect(mounts).toEqual({ scene: 1, unmounts: 0 })
  })

  it('swaps instances when the group, the Scene, or grouping differs', async () => {
    render(<Presentation steps={makeDeck()} title="Deck" />)
    const first = scenes()[0]
    key('ArrowRight')
    key('ArrowRight')
    key('ArrowRight') // d: different Scene, ungrouped
    await waitFor(() => expect(mounts.unmounts).toBe(1))
    await waitFor(() => expect(scenes()).toHaveLength(1))
    expect(scenes()[0]).not.toBe(first)
    expect(screen.getByTestId('scene-payload').textContent).toBe('payload d')
    key('ArrowRight') // e: new group
    await waitFor(() => expect(screen.getByTestId('scene-payload').textContent).toBe('payload e'))
    const e = scenes()[0]
    key('ArrowRight') // f: same group and Scene as e
    expect(scenes()[0]).toBe(e)
  })

  it('treats a different Scene under the same groupKey as a new instance', async () => {
    function Alt({ payload }: SceneProps<{ label: string }>) {
      return <p data-testid="scene-payload">{payload.label}</p>
    }
    const steps: Step<{ label: string }>[] = [
      { id: 'x', era: 'e', title: 't', caption: 'c', Scene: CountingScene, groupKey: 'same', payload: { label: 'x' } },
      { id: 'y', era: 'e', title: 't', caption: 'c', Scene: Alt, groupKey: 'same', payload: { label: 'y' } },
    ]
    render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    await waitFor(() => expect(mounts.unmounts).toBe(1))
  })

  it('mounts once under StrictMode apart from the dev double invocation', () => {
    render(
      <StrictMode>
        <Presentation steps={makeDeck()} title="Deck" />
      </StrictMode>,
    )
    const afterMount = mounts.scene
    expect(afterMount).toBe(2) // StrictMode mounts, unmounts, remounts once
    key('ArrowRight')
    key('ArrowRight')
    expect(mounts.scene).toBe(afterMount)
  })
})

describe('entities inside a persistent scene', () => {
  function Scene({ payload }: SceneProps<{ ids: string[] }>) {
    return (
      <SceneLayer>
        {payload.ids.map((id) => (
          <Appear key={id}>
            <Box id={id} x={10} y={10} width={20} height={20} label={id} />
          </Appear>
        ))}
      </SceneLayer>
    )
  }
  const steps: Step<{ ids: string[] }>[] = [
    { id: '1', era: 'e', title: 't1', caption: 'c', Scene, groupKey: 'g', payload: { ids: ['a', 'b'] } },
    { id: '2', era: 'e', title: 't2', caption: 'c', Scene, groupKey: 'g', payload: { ids: ['a', 'b', 'c'] } },
    { id: '3', era: 'e', title: 't3', caption: 'c', Scene, groupKey: 'g', payload: { ids: ['a', 'c'] } },
  ]
  const entity = (id: string) => document.querySelector(`[data-presentation-entity="${id}"]`)

  it('keeps continuing entities mounted, adds newcomers, and removes departing ones after exit', async () => {
    render(<Presentation steps={steps} title="T" />)
    const a = entity('a')
    const b = entity('b')
    expect(entity('c')).toBeNull()
    key('ArrowRight')
    expect(entity('a')).toBe(a)
    expect(entity('b')).toBe(b)
    expect(entity('c')).not.toBeNull()
    key('ArrowRight')
    expect(entity('a')).toBe(a)
    await waitFor(() => expect(entity('b')).toBeNull())
    expect(entity('c')).not.toBeNull()
    key('ArrowLeft')
    expect(entity('a')).toBe(a)
    expect(entity('b')).not.toBeNull()
  })
})
