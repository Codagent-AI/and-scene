import { AnimatePresence } from 'motion/react'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { Appear } from './nodes/Appear'
import { Box } from './nodes/Box'
import type { SceneProps, Step } from './types'

let instances = 0

interface Payload {
  label: string
  extra?: boolean
}

function CountingScene({ payload }: SceneProps<Payload>) {
  const [instance] = useState(() => ++instances)
  const [clicks, setClicks] = useState(0)
  return (
    <div data-testid="scene" data-instance={instance}>
      <button type="button" data-testid="local" onClick={() => setClicks(clicks + 1)}>
        {clicks}
      </button>
      <span data-testid="label">{payload.label}</span>
      <AnimatePresence initial={false}>
        <Appear key="keep" data-keep>
          <Box id="keep" data-testid="keep">kept</Box>
        </Appear>
        {payload.extra ? (
          <Appear key="extra" data-extra>
            <Box id="extra">extra</Box>
          </Appear>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function OtherScene(props: SceneProps<Payload>) {
  return <CountingScene {...props} />
}

function step(id: string, partial: Partial<Step<Payload>> & { payload: Payload }): Step<Payload> {
  return { id, era: 'e', title: id, caption: id, Scene: CountingScene, ...partial }
}

const q = (s: string) => document.querySelector(s) as HTMLElement | null
const next = () => act(() => void fireEvent.keyDown(document.body, { key: 'ArrowRight' }))

function mount(steps: Step<Payload>[]) {
  instances = 0
  return render(<Presentation steps={steps} title="t" />)
}

describe('grouped scenes', () => {
  it('update in place: one mount, same DOM and local state, new payload', () => {
    mount([
      step('a', { groupKey: 'g', payload: { label: 'one' } }),
      step('b', { groupKey: 'g', payload: { label: 'two' } }),
      step('c', { groupKey: 'g', payload: { label: 'three' } }),
    ])
    const scene = q('[data-testid=scene]')
    act(() => void fireEvent.click(q('[data-testid=local]')!))
    next()
    next()
    expect(instances).toBe(1)
    expect(q('[data-testid=scene]')).toBe(scene)
    expect(q('[data-testid=local]')!.textContent).toBe('1')
    expect(q('[data-testid=label]')!.textContent).toBe('three')
  })

  it('remount when only the group key changes', () => {
    mount([
      step('a', { groupKey: 'g1', payload: { label: 'one' } }),
      step('b', { groupKey: 'g2', payload: { label: 'two' } }),
    ])
    next()
    expect(instances).toBe(2)
  })

  it('remount when only the Scene component changes', () => {
    mount([
      step('a', { groupKey: 'g', payload: { label: 'one' } }),
      step('b', { groupKey: 'g', Scene: OtherScene, payload: { label: 'two' } }),
    ])
    next()
    expect(instances).toBe(2)
  })

  it('remount ungrouped steps, since each step id is its own key', () => {
    mount([step('a', { payload: { label: 'one' } }), step('b', { payload: { label: 'two' } })])
    next()
    expect(instances).toBe(2)
  })

  it('keep a continuing entity mounted and un-faded while newcomers start invisible', () => {
    mount([
      step('a', { groupKey: 'g', payload: { label: 'one' } }),
      step('b', { groupKey: 'g', payload: { label: 'two', extra: true } }),
    ])
    const keep = q('[data-testid=keep]')
    const keepWrapper = q('[data-keep]')!
    expect(q('[data-extra]')).toBeNull()
    next()
    expect(q('[data-testid=keep]')).toBe(keep)
    expect(q('[data-keep]')).toBe(keepWrapper)
    expect(keepWrapper.style.opacity).not.toBe('0')
    expect(q('[data-extra]')!.style.opacity).toBe('0')
  })
})

describe('departing entities', () => {
  it('stay mounted while they exit, then are removed (grouped payload change)', async () => {
    mount([
      step('a', { groupKey: 'g', payload: { label: 'one', extra: true } }),
      step('b', { groupKey: 'g', payload: { label: 'two' } }),
    ])
    expect(q('[data-extra]')).not.toBeNull()
    next()
    expect(q('[data-extra]')).not.toBeNull() // still exiting
    expect(q('[data-keep]')).not.toBeNull()
    await waitFor(() => expect(q('[data-extra]')).toBeNull(), { timeout: 3000 })
    expect(q('[data-keep]')).not.toBeNull()
  })

  it('keep a replaced scene layer until its exit completes', async () => {
    mount([
      step('a', { payload: { label: 'one' } }),
      step('b', { payload: { label: 'two' } }),
    ])
    next()
    expect(document.querySelectorAll('[data-presentation-layer]')).toHaveLength(2)
    await waitFor(() => expect(document.querySelectorAll('[data-presentation-layer]')).toHaveLength(1), { timeout: 3000 })
    expect(q('[data-testid=label]')!.textContent).toBe('two')
  })
})
