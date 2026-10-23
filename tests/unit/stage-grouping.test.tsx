// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation, type SceneProps } from '../../src/presentation-kit'
import { key, makeSteps, type P } from './helpers/fixtures'

let mounts = 0
let unmounts = 0
beforeEach(() => {
  mounts = 0
  unmounts = 0
})

const probe = (name: string) =>
  function Probe({ payload }: SceneProps<P>) {
    useEffect(() => {
      mounts++
      return () => void unmounts++
    }, [])
    return <div data-testid="probe" data-scene={name}>payload {payload.n}</div>
  }
const SceneA = probe('A')
const SceneB = probe('B')

const live = () => document.querySelectorAll('[data-testid="probe"]')
const next = () => act(() => void key('ArrowRight'))
const prev = () => act(() => void key('ArrowLeft'))

function mount(steps: ReturnType<typeof makeSteps>) {
  render(
    <StrictMode>
      <Presentation steps={steps} title="deck" />
    </StrictMode>,
  )
  return { baseline: mounts, node: live()[0] }
}

describe('grouped scenes', () => {
  it('update the existing instance forward and backward instead of remounting', () => {
    const { baseline, node } = mount(makeSteps(['a', 'a', 'a'], SceneA, 'g'))
    next()
    next()
    expect(live()).toHaveLength(1)
    expect(live()[0]).toBe(node)
    expect(node.textContent).toBe('payload 2')
    prev()
    expect(node.textContent).toBe('payload 1')
    expect(mounts).toBe(baseline)
    expect(live()[0]).toBe(node)
  })

  it('remount for ungrouped steps', () => {
    const { baseline } = mount(makeSteps(['a', 'a'], SceneA))
    next()
    expect(mounts).toBeGreaterThan(baseline)
  })

  it('remount when the group key changes', () => {
    const [one, two] = makeSteps(['a', 'a'], SceneA)
    const { baseline } = mount([{ ...one, groupKey: 'g1' }, { ...two, groupKey: 'g2' }])
    next()
    expect(mounts).toBeGreaterThan(baseline)
  })

  it('remount when the scene component changes under the same group key', () => {
    const [one, two] = makeSteps(['a', 'a'], SceneA, 'g')
    const { baseline } = mount([one, { ...two, Scene: SceneB }])
    next()
    expect(mounts).toBeGreaterThan(baseline)
  })
})
