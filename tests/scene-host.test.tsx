// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../src/presentation-kit/Presentation'
import { sceneHostKey } from '../src/presentation-kit/sceneHostKey'
import type { SceneProps, Step } from '../src/presentation-kit/types'

function SceneA({ payload }: SceneProps<number>) { return <div>scene a {payload}</div> }
function SceneB({ payload }: SceneProps<number>) { return <div>scene b {payload}</div> }
const step = (id: string, Scene: Step<number>['Scene'], groupKey?: string): Step<number> => ({ id, era: 'era', title: id, caption: id, Scene, groupKey, payload: 0 })

describe('persistent grouped scenes', () => {
  const steps = [step('s1', SceneA, 'g'), step('s2', SceneA, 'g'), step('s3', SceneA, 'g'), step('s4', SceneB, 'g'), step('s5', SceneA), step('s6', SceneA)]

  it('keys every step in a grouped run the same, starting from the first step of the run', () => {
    expect([0, 1, 2].map((i) => sceneHostKey(steps, i))).toEqual(['s1', 's1', 's1'])
  })

  it('starts a new host when the scene component changes or a step is ungrouped', () => {
    expect([3, 4, 5].map((i) => sceneHostKey(steps, i))).toEqual(['s4', 's5', 's6'])
  })

  it('keeps the same scene host node across the first grouped transition', () => {
    const { container } = render(<Presentation steps={steps} title="deck" />)
    const host = container.querySelector('[data-presentation-scene]')
    expect(host).not.toBeNull()
    act(() => { fireEvent.keyDown(window, { key: 'ArrowRight' }) })
    expect(container.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
    expect(container.querySelector('[data-presentation-scene]')).toBe(host)
    expect(host?.isConnected).toBe(true)
    act(() => { fireEvent.keyDown(window, { key: 'ArrowRight' }) })
    expect(container.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
    expect(container.querySelector('[data-presentation-scene]')).toBe(host)
  })
})
