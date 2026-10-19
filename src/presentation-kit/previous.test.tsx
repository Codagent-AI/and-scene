import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
import { usePreviousDistinct } from './usePreviousDistinct'

afterEach(cleanup)

type P = { n: number }
const seen: { n: number; previous: number | undefined }[] = []
function Probe({ payload, previous }: SceneProps<P>) {
  seen.push({ n: payload.n, previous: previous?.n })
  return <div data-probe={payload.n} />
}
const steps: Step<P>[] = [0, 1, 2, 3, 4].map((n) => ({
  id: `s${n}`,
  era: n < 3 ? 'a' : 'b',
  title: `t${n}`,
  caption: `c${n}`,
  groupKey: 'g',
  Scene: Probe,
  payload: { n },
}))
const last = () => seen[seen.length - 1]
const goto = (i: number) =>
  act(() => void fireEvent.click(document.querySelectorAll('[data-presentation-progress-item]')[i]))

describe('previously displayed step (newcomer classification)', () => {
  it('passes the previously displayed payload to the scene, also across jumps and backward moves', () => {
    seen.length = 0
    render(
      <StrictMode>
        <Presentation steps={steps} title="deck" />
      </StrictMode>,
    )
    expect(last()).toEqual({ n: 0, previous: undefined })
    goto(3)
    expect(last()).toEqual({ n: 3, previous: 0 })
    goto(1)
    expect(last()).toEqual({ n: 1, previous: 3 })
  })

  it('keeps the previous payload stable when the same step re-renders (resize)', () => {
    seen.length = 0
    render(<Presentation steps={steps} title="deck" />)
    goto(2)
    act(() => void window.dispatchEvent(new Event('resize')))
    expect(last()).toEqual({ n: 2, previous: 0 })
  })

  it('usePreviousDistinct reports the value before the latest change', () => {
    const { result, rerender } = renderHook(({ v }) => usePreviousDistinct(v), { initialProps: { v: 1 } })
    expect(result.current).toBeUndefined()
    rerender({ v: 1 })
    expect(result.current).toBeUndefined()
    rerender({ v: 5 })
    expect(result.current).toBe(1)
    rerender({ v: 5 })
    expect(result.current).toBe(1)
    rerender({ v: 2 })
    expect(result.current).toBe(5)
  })
})
