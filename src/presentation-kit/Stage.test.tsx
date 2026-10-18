import { useEffect, type ComponentType } from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeSteps, type TestPayload } from '../test-utils/steps'
import { Presentation } from './Presentation'
import { sceneKey } from './sceneKey'
import type { SceneProps } from './types'

function counting(log: { mounts: number; unmounts: number }): ComponentType<SceneProps<TestPayload>> {
  return function Counting({ payload }) {
    useEffect(() => {
      log.mounts++
      return () => {
        log.unmounts++
      }
    }, [])
    return <p data-testid="scene">{payload.label}</p>
  }
}

const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const scenes = (c: HTMLElement) => c.querySelectorAll('[data-presentation-scene]')

describe('Stage scene persistence', () => {
  it('updates one mounted instance across steps sharing group and Scene', () => {
    const log = { mounts: 0, unmounts: 0 }
    const Scene = counting(log)
    const steps = makeSteps([{ id: 'a', groupKey: 'g' }, { id: 'b', groupKey: 'g' }], Scene)
    const { container, getByTestId } = render(<Presentation steps={steps} title="t" />)
    const node = getByTestId('scene')
    const base = log.mounts
    next()
    expect(getByTestId('scene')).toBe(node)
    expect(node.textContent).toBe('b')
    expect(log.mounts).toBe(base)
    expect(scenes(container)).toHaveLength(1)
  })

  it('cross-fades distinct scenes for ungrouped steps and different groups', async () => {
    const log = { mounts: 0, unmounts: 0 }
    const Scene = counting(log)
    const steps = makeSteps([{ id: 'a' }, { id: 'b' }, { id: 'c', groupKey: 'g' }, { id: 'd', groupKey: 'h' }], Scene)
    const { container } = render(<Presentation steps={steps} title="t" />)
    for (let i = 0; i < 3; i++) {
      const before = log.mounts
      act(() => next())
      expect(log.mounts).toBe(before + 1)
      await waitFor(() => expect(scenes(container)).toHaveLength(1))
    }
  })

  it('does not share an instance when the Scene component differs inside one group', () => {
    const A = counting({ mounts: 0, unmounts: 0 })
    const B = counting({ mounts: 0, unmounts: 0 })
    const [a] = makeSteps([{ id: 'a', groupKey: 'g' }], A)
    const [b] = makeSteps([{ id: 'b', groupKey: 'g' }], B)
    expect(sceneKey(a)).not.toBe(sceneKey(b))
    const [a2] = makeSteps([{ id: 'a2', groupKey: 'g' }], A)
    expect(sceneKey(a)).toBe(sceneKey(a2))
  })

  it('removes the departing scene after its exit animation completes', async () => {
    const steps = makeSteps([{ id: 'a' }, { id: 'b' }])
    const { container } = render(<Presentation steps={steps} title="t" />)
    next()
    await waitFor(() => expect(scenes(container)).toHaveLength(1))
    expect(container.querySelector('[data-testid="scene"]')!.textContent).toBe('b')
  })

  it('renders the scene inside a fixed 880 × 380 canvas with one uniform scale transform', () => {
    const { container } = render(<Presentation steps={makeSteps([{ id: 'a' }])} title="t" />)
    const canvas = container.querySelector('[data-presentation-canvas]') as HTMLElement
    expect(canvas.style.width).toBe('880px')
    expect(canvas.style.height).toBe('380px')
    expect(canvas.style.transform).toMatch(/^translate\([^)]*\) scale\([\d.]+\)$/)
  })
})
