import { useEffect, useRef } from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { defineStep, Presentation, type AnyStep, type SceneProps } from '../../src/presentation-kit'

const mounts: string[] = []

function Counter({ payload, step }: SceneProps<{ label: string }>) {
  const first = useRef(step.id)
  useEffect(() => {
    mounts.push(first.current)
  }, [])
  return <div data-testid="counter">{payload.label}</div>
}
const Other = ({ payload }: SceneProps<{ label: string }>) => <div data-testid="other">{payload.label}</div>

const step = (id: string, Scene: typeof Counter, groupKey: string | undefined, label: string): AnyStep =>
  defineStep({ id, era: 'e', title: id, caption: id, Scene, groupKey, payload: { label } })

const next = () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-presentation-next]')!
  act(() => btn.click())
}

describe('persistent grouped scenes', () => {
  it('keeps one scene instance and DOM node across grouped steps, updating the payload', () => {
    mounts.length = 0
    const steps = [step('a', Counter, 'g', 'one'), step('b', Counter, 'g', 'two'), step('c', Counter, 'g', 'three')]
    const { getByTestId } = render(<Presentation steps={steps} title="t" />)
    const node = getByTestId('counter')
    expect(node.textContent).toBe('one')
    next()
    expect(getByTestId('counter')).toBe(node)
    expect(node.textContent).toBe('two')
    next()
    expect(getByTestId('counter')).toBe(node)
    expect(node.textContent).toBe('three')
    expect(mounts).toEqual(['a'])
  })

  it('remounts when the group differs', () => {
    mounts.length = 0
    const steps = [step('a', Counter, 'g', 'one'), step('b', Counter, 'h', 'two')]
    const { getAllByTestId } = render(<Presentation steps={steps} title="t" />)
    const first = getAllByTestId('counter')[0]
    next()
    expect(mounts).toEqual(['a', 'b'])
    expect(getAllByTestId('counter').at(-1)).not.toBe(first)
  })

  it('replaces the instance when the Scene differs even within one group', () => {
    mounts.length = 0
    const steps = [step('a', Counter, 'g', 'one'), step('b', Other as typeof Counter, 'g', 'two')]
    const { getAllByTestId } = render(<Presentation steps={steps} title="t" />)
    next()
    expect(getAllByTestId('other')).toHaveLength(1)
  })

  it('does not group steps without a groupKey', () => {
    mounts.length = 0
    const steps = [step('a', Counter, undefined, 'one'), step('b', Counter, undefined, 'two')]
    render(<Presentation steps={steps} title="t" />)
    next()
    expect(mounts).toEqual(['a', 'b'])
  })
})
