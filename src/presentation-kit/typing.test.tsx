import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { Presentation, Stage, type SceneProps, type Step, type StepMeta } from './index'

// Compile-time fixtures: `npx tsc -b` type-checks this file. Every `@ts-expect-error`
// line must be an error; if the kit stops rejecting one, the build fails.

afterEach(cleanup)

interface DiagramPayload {
  active: 'a' | 'b'
  count: number
}

const TypedScene: ComponentType<SceneProps<DiagramPayload>> = ({ payload, stepIndex }) => (
  <span data-testid="typed">{`${payload.active}${payload.count}@${stepIndex}`}</span>
)

const meta: StepMeta = { id: 'typed-1', era: 'typed', title: 'Typed', caption: 'Typed payload fixture' }

// Valid typed-payload fixtures through Step, Stage and Presentation.
const typedSteps: Step<DiagramPayload>[] = [
  { ...meta, groupKey: 'typed', Scene: TypedScene, payload: { active: 'a', count: 1 } },
  { ...meta, id: 'typed-2', groupKey: 'typed', Scene: TypedScene, payload: { active: 'b', count: 2 } },
]

const ungrouped: Step<undefined> = {
  ...meta,
  id: 'ungrouped',
  Scene: () => null,
  payload: undefined,
}

export function TypedHost() {
  return (
    <div>
      <Presentation steps={typedSteps} title="typed deck" initialMode="browse" />
      <Stage step={typedSteps[0]} index={0} mode="present" />
    </div>
  )
}

// Negative fixtures: each omitted required field must fail to type-check.
// @ts-expect-error missing id
const noId: Step<undefined> = { era: 'e', title: 't', caption: 'c', Scene: () => null, payload: undefined }
// @ts-expect-error missing era
const noEra: Step<undefined> = { id: 'x', title: 't', caption: 'c', Scene: () => null, payload: undefined }
// @ts-expect-error missing title
const noTitle: Step<undefined> = { id: 'x', era: 'e', caption: 'c', Scene: () => null, payload: undefined }
// @ts-expect-error missing caption
const noCaption: Step<undefined> = { id: 'x', era: 'e', title: 't', Scene: () => null, payload: undefined }
// @ts-expect-error missing Scene
const noScene: Step<undefined> = { id: 'x', era: 'e', title: 't', caption: 'c', payload: undefined }
// @ts-expect-error missing payload
const noPayload: Step<undefined> = { id: 'x', era: 'e', title: 't', caption: 'c', Scene: () => null }
// @ts-expect-error a payload of the wrong shape must not reach the scene
const wrongPayload: Step<DiagramPayload> = { ...meta, Scene: TypedScene, payload: { active: 'c', count: 1 } }
// @ts-expect-error a count of the wrong type must not reach the scene
const wrongCount: Step<DiagramPayload> = { ...meta, Scene: TypedScene, payload: { active: 'a', count: 'two' } }

// A scene that expects a different payload shape must not be accepted for a Step.
const OtherScene: ComponentType<SceneProps<{ label: string }>> = ({ payload }) => <span>{payload.label}</span>
// @ts-expect-error an incompatible scene payload must not type-check against Step<DiagramPayload>
const incompatibleScene: Step<DiagramPayload> = { ...meta, Scene: OtherScene, payload: { active: 'a', count: 1 } }

describe('typed payload boundary (L-3)', () => {
  it('renders a typed-payload presentation and stage without casts', () => {
    const { getByRole, getAllByTestId, container, unmount } = render(<TypedHost />)
    expect(getByRole('heading', { level: 1 }).textContent).toBe('Typed')
    expect(getAllByTestId('typed').map((n) => n.textContent)).toContain('a1@0')
    expect(container.querySelector('[data-presentation-title-text]')?.getAttribute('data-presentation-title-text')).toBe(
      'typed deck',
    )
    unmount()
  })

  it('keeps optional groupKey and the Step payload typed as the fixtures declare', () => {
    expect(ungrouped.groupKey).toBeUndefined()
    expect(typedSteps.map((s) => s.payload.count)).toEqual([1, 2])
    // Negative fixtures are compile-time only; they are referenced so the build keeps them.
    expect([noId, noEra, noTitle, noCaption, noScene, noPayload, wrongPayload, wrongCount, incompatibleScene]).toHaveLength(9)
  })
})
