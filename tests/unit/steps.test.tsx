import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Presentation, clampIndex, eraSections, formatStepNumber, validateSteps,
  type SceneProps, type Step,
} from '../../src/presentation-kit'
import { sceneKey } from '../../src/presentation-kit/steps'
import { makeSteps } from './helpers'

describe('scene step model', () => {
  it('validates that every step carries id, era, title and caption', () => {
    expect(validateSteps(makeSteps(['a', 'b']))).toEqual([])
    const broken = [{ id: 'x', era: '', title: 't', caption: ' ' }]
    expect(validateSteps(broken)).toEqual([
      'step 1 has an empty era',
      'step 1 has an empty caption',
    ])
  })

  it('reports duplicate step ids', () => {
    const steps = makeSteps(['a', 'a'])
    steps[1].id = steps[0].id
    expect(validateSteps(steps)).toContain('duplicate step id "s1"')
  })

  it('delivers step metadata and diagram state to the rendered scene', () => {
    type P = { label: string }
    const seen: Array<SceneProps<P>> = []
    const Scene = (props: SceneProps<P>) => {
      seen.push(props)
      return <div data-testid="diagram">{props.payload.label}</div>
    }
    const steps: Step<P>[] = [
      { id: 'one', era: 'e1', title: 'T1', caption: 'C1', Scene, payload: { label: 'first' } },
      { id: 'two', era: 'e1', title: 'T2', caption: 'C2', Scene, payload: { label: 'second' } },
    ]
    render(<Presentation steps={steps} title="deck" />)
    expect(screen.getByTestId('diagram').textContent).toBe('first')
    expect(seen.at(-1)).toMatchObject({
      index: 0,
      payload: { label: 'first' },
      step: { id: 'one', era: 'e1', title: 'T1', caption: 'C1' },
    })
  })
})

describe('order-derived numbering', () => {
  it('numbers steps from position', () => {
    expect([0, 1, 8, 9].map(formatStepNumber)).toEqual(['01', '02', '09', '10'])
  })

  it('groups consecutive steps of an era into sections with first indices', () => {
    const sections = eraSections(makeSteps(['a', 'a', 'b', 'b', 'b', 'a']))
    expect(sections.map((s) => [s.era, s.firstIndex, s.indices])).toEqual([
      ['a', 0, [0, 1]],
      ['b', 2, [2, 3, 4]],
      ['a', 5, [5]],
    ])
  })

  it('clamps indices into range', () => {
    expect([clampIndex(-3, 4), clampIndex(2, 4), clampIndex(9, 4), clampIndex(1, 0)]).toEqual([0, 2, 3, 0])
    expect(clampIndex(Number.NaN, 4)).toBe(0)
  })
})

describe('scene keys', () => {
  const Scene = () => null
  const Other = () => null
  const step = (id: string, groupKey: string | undefined, S: typeof Scene) =>
    ({ id, groupKey, Scene: S }) as const

  it('shares a key only for the same group and scene component', () => {
    expect(sceneKey(step('a', 'g', Scene))).toBe(sceneKey(step('b', 'g', Scene)))
    expect(sceneKey(step('a', 'g', Scene))).not.toBe(sceneKey(step('b', 'h', Scene)))
    expect(sceneKey(step('a', 'g', Scene))).not.toBe(sceneKey(step('b', 'g', Other)))
  })

  it('gives ungrouped steps a key of their own', () => {
    expect(sceneKey(step('a', undefined, Scene))).not.toBe(sceneKey(step('b', undefined, Scene)))
  })
})
