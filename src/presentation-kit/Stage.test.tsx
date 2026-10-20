import { act, render, waitFor } from '@testing-library/react'
import { StrictMode, useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { computeFit } from './geometry.ts'
import { Appear } from './nodes/Appear.tsx'
import { SceneLayer } from './nodes/SceneLayer.tsx'
import { Presentation } from './Presentation.tsx'
import { sceneKey } from './sceneKey.ts'
import { Stage } from './Stage.tsx'
import type { SceneProps, Step } from './types.ts'

const counts = { mount: 0, unmount: 0 }

function CountingScene({ payload }: SceneProps<{ n: number }>) {
  useEffect(() => {
    counts.mount++
    return () => {
      counts.unmount++
    }
  }, [])
  return <div data-testid="payload">{payload.n}</div>
}
const OtherScene = (p: SceneProps<{ n: number }>) => <CountingScene {...p} />

const step = (id: string, n: number, over: Partial<Step<{ n: number }>> = {}): Step<{ n: number }> => ({
  id,
  era: 'e',
  title: id,
  caption: id,
  groupKey: 'g',
  Scene: CountingScene,
  payload: { n },
  ...over,
})

const setViewport = (w: number, h: number) =>
  act(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: w })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: h })
    window.dispatchEvent(new Event('resize'))
  })

describe('scene identity', () => {
  it('keys by group and by Scene component independently', () => {
    expect(sceneKey(step('a', 0))).toBe(sceneKey(step('b', 1)))
    expect(sceneKey(step('a', 0))).not.toBe(sceneKey(step('b', 1, { groupKey: 'other' })))
    expect(sceneKey(step('a', 0))).not.toBe(sceneKey(step('b', 1, { Scene: OtherScene })))
    expect(sceneKey(step('a', 0, { groupKey: undefined }))).not.toBe(sceneKey(step('b', 0, { groupKey: undefined })))
  })
})

describe('grouped scenes', () => {
  const reset = () => {
    counts.mount = 0
    counts.unmount = 0
  }
  const view = (s: Step<{ n: number }>, strict = false) => {
    const ui = <Stage step={s} mode="browse" />
    return strict ? <StrictMode>{ui}</StrictMode> : ui
  }

  it('updates the same instance with the new payload when group and Scene match', () => {
    reset()
    const { rerender, getByTestId } = render(view(step('a', 1)))
    const el = getByTestId('payload')
    expect(counts).toEqual({ mount: 1, unmount: 0 })
    rerender(view(step('b', 2)))
    expect(getByTestId('payload')).toBe(el)
    expect(el.textContent).toBe('2')
    expect(counts).toEqual({ mount: 1, unmount: 0 })
  })

  it('does not remount across navigations under StrictMode (beyond its lifecycle replay)', () => {
    reset()
    const { rerender } = render(view(step('a', 1), true))
    const baseline = { ...counts }
    rerender(view(step('b', 2), true))
    rerender(view(step('c', 3), true))
    expect(counts).toEqual(baseline)
  })

  it('remounts when the group changes', () => {
    reset()
    const { rerender } = render(view(step('a', 1)))
    rerender(view(step('b', 2, { groupKey: 'other' })))
    expect(counts.mount).toBe(2)
  })

  it('remounts when only the Scene component changes', () => {
    reset()
    const { rerender } = render(view(step('a', 1)))
    rerender(view(step('b', 2, { Scene: OtherScene })))
    expect(counts.mount).toBe(2)
  })

  it('cross-fades a replaced scene through the presence host', async () => {
    reset()
    const { rerender, container } = render(view(step('a', 1)))
    rerender(view(step('b', 2, { groupKey: 'other' })))
    expect(container.querySelectorAll('[data-presentation-scene]').length).toBe(2)
    await waitFor(() => expect(container.querySelectorAll('[data-presentation-scene]').length).toBe(1))
  })
})

describe('entity presence', () => {
  function Entities({ payload }: SceneProps<{ ids: string[] }>) {
    return (
      <SceneLayer>
        {payload.ids.map((id) => (
          <Appear key={id} data-entity={id}>
            {id}
          </Appear>
        ))}
      </SceneLayer>
    )
  }
  const entityStep = (ids: string[]): Step<{ ids: string[] }> => ({
    id: 's',
    era: 'e',
    title: 't',
    caption: 'c',
    groupKey: 'g',
    Scene: Entities,
    payload: { ids },
  })

  it('animates a removed entity out inside a persistent group instead of dropping it', async () => {
    const { rerender, container } = render(<Stage step={entityStep(['a', 'b'])} mode="browse" />)
    const sceneEl = container.querySelector('[data-presentation-scene]')
    rerender(<Stage step={entityStep(['a'])} mode="browse" />)
    expect(container.querySelector('[data-presentation-scene]')).toBe(sceneEl)
    // Still in the DOM while its exit animation runs, then gone.
    expect(container.querySelector('[data-entity="b"]')).not.toBeNull()
    await waitFor(() => expect(container.querySelector('[data-entity="b"]')).toBeNull(), { timeout: 3000 })
    expect(container.querySelector('[data-entity="a"]')).not.toBeNull()
  })
})

describe('fit scaling', () => {
  it('keeps the design canvas size and scale constant across steps within a mode', () => {
    setViewport(1440, 900)
    const { rerender, container } = render(<Stage step={step('a', 1)} mode="browse" />)
    const canvas = () => container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    const fit = container.querySelector<HTMLElement>('[data-presentation-fit]')!
    const before = [canvas().style.width, canvas().style.height, fit.getAttribute('data-presentation-scale')]
    rerender(<Stage step={step('b', 99, { groupKey: 'other' })} mode="browse" />)
    expect([canvas().style.width, canvas().style.height, fit.getAttribute('data-presentation-scale')]).toEqual(before)
    expect(canvas().style.width).toBe(`${DESIGN_W}px`)
    expect(canvas().style.height).toBe(`${DESIGN_H}px`)
  })

  it('scales uniformly on resize while the internal canvas stays 880 x 380', () => {
    setViewport(1440, 900)
    const { container } = render(<Stage step={step('a', 1)} mode="browse" />)
    const fit = container.querySelector<HTMLElement>('[data-presentation-fit]')!
    const canvas = container.querySelector<HTMLElement>('[data-presentation-canvas]')!
    const scaleOf = () => Number(fit.getAttribute('data-presentation-scale'))
    expect(scaleOf()).toBeCloseTo(computeFit(1440, 900, 'browse').scale)
    setViewport(660, 900)
    expect(scaleOf()).toBeCloseTo(0.75)
    expect(fit.style.width).toBe(`${DESIGN_W * 0.75}px`)
    expect(fit.style.height).toBe(`${DESIGN_H * 0.75}px`)
    expect(canvas.style.width).toBe(`${DESIGN_W}px`)
    expect(canvas.style.height).toBe(`${DESIGN_H}px`)
  })

  it('refits on a mode switch without remounting the scene', () => {
    setViewport(1440, 900)
    counts.mount = 0
    const { rerender, container } = render(<Stage step={step('a', 1)} mode="browse" />)
    const sceneEl = container.querySelector('[data-presentation-scene]')
    const fit = container.querySelector<HTMLElement>('[data-presentation-fit]')!
    const browseScale = fit.getAttribute('data-presentation-scale')
    rerender(<Stage step={step('a', 1)} mode="present" />)
    expect(container.querySelector('[data-presentation-scene]')).toBe(sceneEl)
    expect(counts.mount).toBe(1)
    expect(fit.getAttribute('data-presentation-scale')).not.toBe(browseScale)
    expect(fit.getAttribute('data-presentation-scale')).toBe(String(computeFit(1440, 900, 'present').scale))
  })

  it('is wired through a layout group and the presence host in Presentation', () => {
    const { container } = render(
      <Presentation steps={[step('a', 1), step('b', 2)]} title="t" />,
    )
    expect(container.querySelector('[data-presentation-stage] [data-presentation-canvas] [data-presentation-scene]')).not.toBeNull()
  })
})
