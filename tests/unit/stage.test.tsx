// @vitest-environment jsdom
import { useEffect } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Box, Presentation, SceneLayer, sceneKey } from '../../src/presentation-kit/index.ts'
import type { SceneProps, Step } from '../../src/presentation-kit/index.ts'
import { setViewport } from '../helpers/viewport.ts'

// Real `motion` here: these tests cover presence, mounting and retention.
const mounts = { count: 0, unmounts: 0 }

function Counting({ payload }: SceneProps<{ ids: string[]; label: string }>) {
  useEffect(() => {
    mounts.count++
    return () => void mounts.unmounts++
  }, [])
  return (
    <SceneLayer>
      {payload.ids.map((id, i) => (
        <Box key={id} layoutId={id} x={i * 90} y={0} w={80} h={30}>{payload.label}:{id}</Box>
      ))}
    </SceneLayer>
  )
}
function Other({ payload }: SceneProps<{ ids: string[]; label: string }>) {
  return <div data-testid="other">{payload.label}</div>
}

type P = { ids: string[]; label: string }
const step = (id: string, Scene: Step<P>['Scene'], payload: P, groupKey?: string): Step<P> => ({ id, era: 'e', title: id, caption: id, Scene, payload, groupKey })
const next = () => act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
const entities = () => [...document.querySelectorAll('[data-presentation-entity]')].map((e) => e.getAttribute('data-presentation-entity'))

describe('grouped scenes', () => {
  it('keeps one scene instance and updates payload in place across a group', () => {
    setViewport(1200, 800)
    mounts.count = mounts.unmounts = 0
    const steps = [
      step('1', Counting, { ids: ['a'], label: 'one' }, 'g'),
      step('2', Counting, { ids: ['a', 'b'], label: 'two' }, 'g'),
      step('3', Counting, { ids: ['a', 'b', 'c'], label: 'three' }, 'g'),
    ]
    render(<Presentation steps={steps} title="T" />)
    expect(mounts.count).toBe(1)
    next()
    expect(screen.getByText('two:a')).toBeTruthy()
    next()
    expect(screen.getByText('three:c')).toBeTruthy()
    expect(mounts).toEqual({ count: 1, unmounts: 0 })
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
  })

  it('uses one key for a group, and separate keys for other groups, scenes or ungrouped steps', () => {
    const a = { id: '1', groupKey: 'g', Scene: Counting }
    expect(sceneKey(a)).toBe(sceneKey({ id: '2', groupKey: 'g', Scene: Counting }))
    expect(sceneKey(a)).not.toBe(sceneKey({ id: '2', groupKey: 'h', Scene: Counting }))
    expect(sceneKey(a)).not.toBe(sceneKey({ id: '2', groupKey: 'g', Scene: Other }))
    expect(sceneKey({ id: '3', Scene: Counting })).not.toBe(sceneKey({ id: '4', Scene: Counting }))
  })

  it('remounts when the group, scene or ungrouped step changes', async () => {
    setViewport(1200, 800)
    mounts.count = mounts.unmounts = 0
    const steps = [
      step('1', Counting, { ids: ['a'], label: 'one' }, 'g'),
      step('2', Counting, { ids: ['a'], label: 'two' }, 'h'),
      step('3', Other, { ids: [], label: 'three' }, 'h'),
      step('4', Counting, { ids: ['a'], label: 'four' }),
    ]
    render(<Presentation steps={steps} title="T" />)
    next()
    expect(mounts.count).toBe(2)
    next()
    expect(screen.getByTestId('other').textContent).toBe('three')
    next()
    expect(mounts.count).toBe(3)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1), { timeout: 3000 })
  })

  it('keeps a departing entity until its exit finishes, then removes it', async () => {
    setViewport(1200, 800)
    const steps = [
      step('1', Counting, { ids: ['a', 'b'], label: 'x' }, 'g'),
      step('2', Counting, { ids: ['a'], label: 'x' }, 'g'),
    ]
    render(<Presentation steps={steps} title="T" />)
    expect(entities().filter(Boolean)).toEqual(['a', 'b'])
    next()
    // Still present immediately: it is exiting, not unmounted.
    expect(entities()).toContain('b')
    await waitFor(() => expect(entities()).toEqual(['a']), { timeout: 3000 })
  })

  it('keeps the continuing entity element mounted across the update', () => {
    setViewport(1200, 800)
    const steps = [
      step('1', Counting, { ids: ['a'], label: 'x' }, 'g'),
      step('2', Counting, { ids: ['a', 'b'], label: 'y' }, 'g'),
    ]
    render(<Presentation steps={steps} title="T" />)
    const el = document.querySelector('[data-presentation-entity="a"]')
    next()
    expect(document.querySelector('[data-presentation-entity="a"]')).toBe(el)
    expect(el?.textContent).toBe('y:a')
  })
})
