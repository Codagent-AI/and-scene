import { act, cleanup, render, waitFor } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../Presentation.tsx'
import { sceneKey } from '../sceneKey.ts'
import { Appear, Box, SceneLayer } from '../nodes/index.ts'
import type { SceneProps, Step } from '../types.ts'
import { key, setViewport } from './helpers.ts'

beforeEach(() => setViewport(1280, 800))
afterEach(cleanup)

interface Payload {
  items: string[]
}

let mounts = 0
let lastPayload: Payload | null = null

function CountingScene({ payload }: SceneProps<Payload>) {
  useEffect(() => {
    mounts += 1
  }, [])
  useEffect(() => {
    lastPayload = payload
  }, [payload])
  return (
    <SceneLayer>
      {payload.items.map((id) => (
        <Appear key={id} data-appear={id}>
          <Box id={id} label={id} data-box={id} />
        </Appear>
      ))}
    </SceneLayer>
  )
}

function OtherScene(props: SceneProps<Payload>) {
  return <CountingScene {...props} />
}

function step(id: string, items: string[], over: Partial<Step<Payload>> = {}): Step<Payload> {
  return { id, era: 'e', title: id, caption: id, Scene: CountingScene, groupKey: 'g', payload: { items }, ...over }
}

const mount = (steps: Step<Payload>[], wrap?: (children: ReactNode) => ReactNode) => {
  mounts = 0
  const tree = <Presentation steps={steps} title="T" initialMode="browse" />
  return render(wrap ? wrap(tree) : tree)
}
const box = (id: string) => document.querySelector(`[data-box="${id}"]`)

describe('grouped scenes', () => {
  it('updates one Scene instance in place with the new typed payload', () => {
    mount([step('a', ['x']), step('b', ['x', 'y'])])
    expect(mounts).toBe(1)
    expect(lastPayload?.items).toEqual(['x'])
    key('ArrowRight')
    expect(mounts).toBe(1)
    expect(lastPayload?.items).toEqual(['x', 'y'])
  })

  it('keeps a continuing entity as the same DOM node and adds only the newcomer wrapper', () => {
    mount([step('a', ['x']), step('b', ['x', 'y'])])
    const before = box('x')
    const wrapperBefore = document.querySelector('[data-appear="x"]')
    key('ArrowRight')
    expect(box('x')).toBe(before)
    expect(document.querySelector('[data-appear="x"]')).toBe(wrapperBefore)
    expect(document.querySelectorAll('[data-presentation-appear]')).toHaveLength(2)
    expect(box('y')).not.toBeNull()
  })

  it('stays mounted once under StrictMode (one deliberate effect cycle)', () => {
    mount([step('a', ['x']), step('b', ['x'])], (tree) => <StrictMode>{tree}</StrictMode>)
    const after = mounts
    key('ArrowRight')
    expect(mounts).toBe(after)
  })

  it('replaces the scene when the group key changes, even with the same Scene', async () => {
    mount([step('a', ['x']), step('b', ['x'], { groupKey: 'other' })])
    key('ArrowRight')
    expect(mounts).toBe(2)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1))
  })

  it('replaces the scene when the Scene component changes, even with the same group key', async () => {
    mount([step('a', ['x']), step('b', ['x'], { Scene: OtherScene })])
    key('ArrowRight')
    expect(mounts).toBe(2)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1))
  })

  it('keys scenes by both Scene identity and group identity', () => {
    const a = { id: '1', Scene: CountingScene, groupKey: 'g' }
    expect(sceneKey(a)).toBe(sceneKey({ ...a, id: '2' }))
    expect(sceneKey(a)).not.toBe(sceneKey({ ...a, groupKey: 'h' }))
    expect(sceneKey(a)).not.toBe(sceneKey({ ...a, Scene: OtherScene }))
    expect(sceneKey({ ...a, groupKey: undefined })).not.toBe(sceneKey({ ...a, groupKey: undefined, id: '2' }))
  })
})

describe('continuing entities keep their entry', () => {
  it('leaves a settled entity fully visible while a newcomer fades in', async () => {
    mount([step('a', ['x']), step('b', ['x', 'y'])])
    const wrapper = document.querySelector('[data-appear="x"]') as HTMLElement
    await waitFor(() => expect(wrapper.style.opacity).toBe('1'), { timeout: 3000 })
    key('ArrowRight')
    const entering = document.querySelector('[data-appear="y"]') as HTMLElement
    expect(wrapper.style.opacity).toBe('1')
    expect(entering.style.opacity).toBe('0')
    await waitFor(() => expect(entering.style.opacity).toBe('1'), { timeout: 3000 })
    expect(wrapper.style.opacity).toBe('1')
  })
})

describe('departing entities', () => {
  it('keeps a removed entity mounted while it exits, then removes it', async () => {
    mount([step('a', ['x', 'y']), step('b', ['x'])])
    expect(box('y')).not.toBeNull()
    key('ArrowRight')
    expect(box('y')).not.toBeNull()
    await waitFor(() => expect(box('y')).toBeNull(), { timeout: 3000 })
    expect(box('x')).not.toBeNull()
  })

  it('cross-fades a replaced scene: the old one stays until its exit finishes', async () => {
    mount([step('a', ['x']), step('b', ['z'], { groupKey: 'other' })])
    key('ArrowRight')
    await act(async () => {})
    expect(box('z')).not.toBeNull()
    await waitFor(() => expect(box('x')).toBeNull(), { timeout: 3000 })
  })
})
