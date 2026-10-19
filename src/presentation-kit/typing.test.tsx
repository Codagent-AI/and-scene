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

// Boundary fixtures at <Presentation>: the steps prop must agree on one payload type across all steps.
const NumberScene: ComponentType<SceneProps<number>> = ({ payload }) => <span>{payload}</span>
const StringScene: ComponentType<SceneProps<string>> = ({ payload }) => <span>{payload}</span>

// (a) A mixed array: a number-payload step and a string-payload step cannot share one Presentation steps prop.
const mixedSteps = [
  { ...meta, id: 'mix-n', Scene: NumberScene, payload: 1 },
  { ...meta, id: 'mix-s', Scene: StringScene, payload: 'two' },
]
// @ts-expect-error steps with incompatible payload types in one array must not reach <Presentation>
export const mixedHost = <Presentation steps={mixedSteps} title="mixed" />

// (b) A string payload paired with a Scene that expects a number, passed straight to <Presentation>.
const stringPayloadNumberScene = [{ ...meta, id: 'str-num', Scene: NumberScene, payload: 'not a number' }]
// @ts-expect-error a Step<string> whose Scene expects a number payload must not type-check against Presentation
export const mismatchedHost = <Presentation steps={stringPayloadNumberScene} title="mismatch" />

// (c) Positive: a heterogeneous union payload, one Scene per discriminant, shared by every step.
type Diagram = { kind: 'bar'; value: number } | { kind: 'note'; text: string }
const UnionScene: ComponentType<SceneProps<Diagram>> = ({ payload }) => (
  <span>{payload.kind === 'bar' ? payload.value : payload.text}</span>
)
const unionSteps: Step<Diagram>[] = [
  { ...meta, id: 'union-bar', Scene: UnionScene, payload: { kind: 'bar', value: 3 } },
  { ...meta, id: 'union-note', Scene: UnionScene, payload: { kind: 'note', text: 'hello' } },
]
export const unionHost = <Presentation steps={unionSteps} title="union" initialMode="browse" />

describe('typed payload boundary (L-3)', () => {
  it('renders a heterogeneous union payload through Presentation', () => {
    const { getByRole, getByText, unmount } = render(unionHost)
    expect(getByRole('heading', { level: 1 }).textContent).toBe('Typed')
    // The first step's 'bar' variant renders its numeric value through the shared union-typed Scene.
    expect(getByText('3').textContent).toBe('3')
    unmount()
  })

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
    expect([mixedHost, mismatchedHost, unionHost].every((el) => el !== undefined)).toBe(true)
  })
})
