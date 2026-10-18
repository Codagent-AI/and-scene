// @vitest-environment jsdom
import { useEffect, useState } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Appear, Box, Presentation, SceneLayer, type SceneProps } from '../../src/presentation-kit'
import { makeSteps, setViewport, type BeatPayload } from './fixtures'

afterEach(cleanup)
beforeEach(() => setViewport(1440))
const key = (k: string) => act(() => void fireEvent.keyDown(window, { key: k }))
const scenes = (c: HTMLElement) => c.querySelectorAll('[data-presentation-scene]')

function Counting({ payload }: SceneProps<BeatPayload>) {
  const [local] = useState(() => Math.random())
  useEffect(() => {
    log.push(`mount:${local}`)
    return () => void log.push(`unmount:${local}`)
  }, [local])
  return <div data-testid="counting" data-local={local}>{payload.beat}</div>
}
let log: string[] = []
beforeEach(() => void (log = []))
const mounts = () => log.filter((l) => l.startsWith('mount')).length

describe('persistent grouped scenes', () => {
  it('updates the existing instance when adjacent steps share group and Scene', () => {
    const { container } = render(<Presentation steps={makeSteps(['a', 'a', 'b'], Counting, 'g')} title="T" />)
    const first = screen.getByTestId('counting')
    const local = first.getAttribute('data-local')
    key('ArrowRight')
    key('ArrowRight')
    expect(mounts()).toBe(1)
    expect(scenes(container)).toHaveLength(1)
    expect(screen.getByTestId('counting')).toBe(first)
    expect(first.getAttribute('data-local')).toBe(local)
    expect(first.textContent).toBe('2')
  })

  it('remounts when the group changes', () => {
    const steps = makeSteps(['a', 'a', 'a'], Counting, 'g')
    steps[1] = { ...steps[1], groupKey: 'other' }
    render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    expect(mounts()).toBe(2)
  })

  it('remounts when the Scene component changes even though the group key is shared', async () => {
    function Other({ payload }: SceneProps<BeatPayload>) {
      return <div data-testid="other">{payload.beat}</div>
    }
    const steps = makeSteps(['a', 'a'], Counting, 'g')
    steps[1] = { ...steps[1], Scene: Other }
    render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    expect(screen.getAllByTestId('other')).toHaveLength(1)
    expect(screen.queryAllByTestId('counting')).toHaveLength(1) // outgoing scene still exiting
    await waitFor(() => expect(screen.queryAllByTestId('counting')).toHaveLength(0), { timeout: 3000 })
  })

  it('cross-fades ungrouped scenes: the outgoing scene stays through its exit, then is removed', async () => {
    const { container } = render(<Presentation steps={makeSteps(['a', 'a'], Counting)} title="T" />)
    key('ArrowRight')
    expect(scenes(container)).toHaveLength(2)
    await waitFor(() => expect(scenes(container)).toHaveLength(1), { timeout: 3000 })
    expect(screen.getByTestId('counting').textContent).toBe('1')
  })
})

function Entities({ payload }: SceneProps<{ step: number }>) {
  const { step } = payload
  return (
    <SceneLayer>
      <Box key="stay" layoutId="stay" x={step === 0 ? 10 : 300} y={20} width={50} height={40} data-testid="stay">
        stay
      </Box>
      {step === 0 && (
        <Appear key="leave">
          <Box layoutId="leave" x={100} y={100} data-testid="leave">
            leave
          </Box>
        </Appear>
      )}
      {step === 1 && (
        <Appear key="arrive">
          <Box layoutId="arrive" x={200} y={100} data-testid="arrive">
            arrive
          </Box>
        </Appear>
      )}
    </SceneLayer>
  )
}

describe('entity transitions in a grouped scene', () => {
  const steps = [0, 1].map((step) => ({
    id: `e${step}`,
    era: 'x',
    title: 't',
    caption: 'c',
    Scene: Entities,
    groupKey: 'g',
    payload: { step },
  }))

  it('keeps a persisting entity as the same element with updated target geometry', () => {
    render(<Presentation steps={steps} title="T" />)
    const stay = screen.getByTestId('stay')
    expect(stay.getAttribute('data-presentation-id')).toBe('stay')
    expect(stay.style.left).toBe('10px')
    key('ArrowRight')
    expect(screen.getByTestId('stay')).toBe(stay)
    expect(stay.style.left).toBe('300px')
    expect(stay.closest('[data-presentation-appear]')).toBeNull()
  })

  it('exits a departing entity through its exit animation and holds newcomers until others settle', async () => {
    render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    expect(screen.getByTestId('leave')).toBeTruthy() // still mounted while it animates out
    const arrive = screen.getByTestId('arrive')
    const wrapper = arrive.closest('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.opacity).toBe('0')
    await new Promise((r) => setTimeout(r, 300))
    expect(Number(wrapper.style.opacity)).toBeLessThan(0.5) // delayed past the morph window
    await waitFor(() => expect(screen.queryByTestId('leave')).toBeNull(), { timeout: 3000 })
    await waitFor(() => expect(wrapper.style.opacity).toBe('1'), { timeout: 4000 })
  })
})

describe('newcomers across a group boundary', () => {
  function Arriving({ payload }: SceneProps<{ step: number }>) {
    return (
      <SceneLayer>
        <Box key="base" layoutId="base" x={10} y={10} />
        {payload.step === 1 && (
          <Appear key="late">
            <Box layoutId="late" x={50} y={50} data-testid="late" />
          </Appear>
        )}
      </SceneLayer>
    )
  }
  function Plain({ payload }: SceneProps<{ step: number }>) {
    return <Arriving payload={payload} step={undefined as never} index={0} count={0} mode="browse" />
  }
  const steps = [0, 1].map((step) => ({ id: `u${step}`, era: 'x', title: 't', caption: 'c', Scene: step === 0 ? Arriving : Plain, payload: { step } }))

  it('holds a newcomer in an incoming ungrouped scene until the morph window has passed', async () => {
    render(<Presentation steps={steps} title="T" />)
    key('ArrowRight')
    const wrapper = screen.getByTestId('late').closest('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.opacity).toBe('0')
    await new Promise((r) => setTimeout(r, 450)) // past the 0.35s scene cross-fade, before the 0.7s delay
    expect(Number(wrapper.style.opacity)).toBeLessThan(0.3)
    await waitFor(() => expect(wrapper.style.opacity).toBe('1'), { timeout: 4000 })
  })

  it('shows entities present at first mount immediately', () => {
    const { container } = render(<Presentation steps={[{ ...steps[1], payload: { step: 1 } }]} title="T" />)
    const wrapper = container.querySelector('[data-presentation-appear]') as HTMLElement
    expect(wrapper.style.opacity).not.toBe('0')
  })
})
