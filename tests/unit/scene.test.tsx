import { StrictMode, useEffect, useRef } from 'react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Box, Presentation, SceneLayer, type SceneProps, type Step } from '../../src/presentation-kit'
import { sceneKey } from '../../src/presentation-kit/sceneKey'
import { setViewport } from '../support/fixtures'

interface P {
  n: number
  ids: string[]
}

const mounts = { A: 0, B: 0 }

function makeScene(tag: 'A' | 'B') {
  return function Scene({ payload }: SceneProps<P>) {
    const alive = useRef(0)
    useEffect(() => {
      mounts[tag] += 1
      alive.current += 1
    }, [])
    return (
      <SceneLayer>
        <span key="marker" data-testid={`scene-${tag}`} data-n={payload.n} />
        {payload.ids.map((id, i) => (
          <Box key={id} id={`t:${id}`} at={{ x: 10 * (i + payload.n), y: 5, w: 40, h: 20 }} data-testid={`e-${id}`}>
            {id}
          </Box>
        ))}
      </SceneLayer>
    )
  }
}
const SceneA = makeScene('A')
const SceneB = makeScene('B')

const step = (id: string, n: number, ids: string[], opts: Partial<Step<P>> = {}): Step<P> => ({
  id,
  era: 'e',
  title: id,
  caption: id,
  Scene: SceneA,
  groupKey: 'g',
  payload: { n, ids },
  ...opts,
})

const next = (c: HTMLElement) => fireEvent.click(c.querySelector('[data-presentation-next]')!)
const node = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-testid="${id}"]`)

function mount(steps: Step<P>[]) {
  setViewport(1440, 900)
  const view = render(
    <StrictMode>
      <Presentation steps={steps} title="T" />
    </StrictMode>,
  )
  mounts.A = mounts.B = 0
  return view
}

describe('scene instance persistence', () => {
  it('same group and same Scene: instance and entity DOM persist while payload updates', () => {
    const { container } = mount([step('1', 1, ['a', 'b']), step('2', 2, ['a', 'b'])])
    const marker = node(container, 'scene-A')!
    const a = node(container, 'e-a')!
    const left = a.style.left
    const before = { ...mounts }
    next(container)
    expect(mounts).toEqual(before)
    expect(node(container, 'scene-A')).toBe(marker)
    expect(marker.dataset.n).toBe('2')
    expect(node(container, 'e-a')).toBe(a)
    expect(a.style.left).not.toBe(left)
  })

  it('same Scene under a different group key creates a new instance', () => {
    const { container } = mount([step('1', 1, ['a']), step('2', 2, ['a'], { groupKey: 'other' })])
    const marker = node(container, 'scene-A')!
    next(container)
    // the outgoing instance lingers while exiting; a distinct incoming instance is mounted beside it
    const markers = [...container.querySelectorAll('[data-testid="scene-A"]')]
    expect(markers).toHaveLength(2)
    expect(markers).toContain(marker)
    expect(mounts.A).toBeGreaterThanOrEqual(1)
  })

  it('same group key with a different Scene component creates a new instance', () => {
    const { container } = mount([step('1', 1, ['a']), step('2', 2, ['a'], { Scene: SceneB })])
    next(container)
    expect(node(container, 'scene-B')).not.toBeNull()
    expect(mounts.B).toBeGreaterThanOrEqual(1)
  })

  it('across scenes the outgoing and incoming entity share an id and keep their own geometry', () => {
    const { container } = mount([step('1', 1, ['a']), step('2', 5, ['a'], { groupKey: 'other' })])
    const outgoing = node(container, 'e-a')!
    const oldLeft = outgoing.style.left
    next(container)
    const both = [...container.querySelectorAll<HTMLElement>('[data-testid="e-a"]')]
    expect(both).toHaveLength(2)
    expect(new Set(both.map((e) => e.dataset.presentationId))).toEqual(new Set(['t:a']))
    const incoming = both.find((e) => e !== outgoing)!
    expect(outgoing.style.left).toBe(oldLeft)
    expect(incoming.style.left).not.toBe(oldLeft)
  })

  it('ungrouped steps never share an instance, even with the same Scene', () => {
    const a = step('1', 1, ['a'], { groupKey: undefined })
    const b = step('2', 2, ['a'], { groupKey: undefined })
    expect(sceneKey(a)).not.toBe(sceneKey(b))
    expect(sceneKey(step('1', 1, [])) ).toBe(sceneKey(step('2', 2, [])))
  })
})

describe('entity transitions in a grouped scene', () => {
  it('a continuing entity keeps its DOM node and changes geometry, with no entry fade', () => {
    const { container } = mount([step('1', 1, ['a']), step('2', 2, ['a']), step('3', 3, ['a'])])
    const a = node(container, 'e-a')!
    const lefts = [a.style.left]
    next(container)
    lefts.push(a.style.left)
    next(container)
    lefts.push(a.style.left)
    expect(node(container, 'e-a')).toBe(a)
    expect(new Set(lefts).size).toBe(3)
    expect(a.closest('[data-presentation-appear]')).toBeNull()
    fireEvent.click(container.querySelector('[data-presentation-prev]')!)
    expect(node(container, 'e-a')).toBe(a)
    expect(a.style.left).toBe(lefts[1])
  })

  it('a departing entity stays through its exit animation and then unmounts', async () => {
    const { container } = mount([step('1', 1, ['a', 'b']), step('2', 2, ['a'])])
    expect(node(container, 'e-b')).not.toBeNull()
    next(container)
    expect(node(container, 'e-a')).not.toBeNull()
    await waitFor(() => expect(node(container, 'e-b')).toBeNull(), { timeout: 3000 })
  })

  it('an outgoing scene exits after a cross-scene navigation', async () => {
    const { container } = mount([step('1', 1, ['a']), step('2', 2, ['a'], { Scene: SceneB })])
    const outgoing = node(container, 'scene-A')!
    next(container)
    expect(node(container, 'scene-B')).not.toBeNull()
    expect(outgoing.isConnected).toBe(true)
    await waitFor(() => expect(outgoing.isConnected).toBe(false), { timeout: 3000 })
  })
})

describe('strict mode', () => {
  it('registers navigation once even with double-invoked effects', () => {
    const { container } = mount([step('1', 1, ['a']), step('2', 2, ['a']), step('3', 3, ['a'])])
    act(() => {
      fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    })
    expect(container.querySelector<HTMLElement>('[data-step-index]')!.dataset.stepIndex).toBe('1')
  })

  it('keeps StrictMode on in the application entry', async () => {
    const src = await import('node:fs').then((fs) => fs.readFileSync('src/main.tsx', 'utf8'))
    expect(src).toMatch(/<StrictMode>/)
  })
})
