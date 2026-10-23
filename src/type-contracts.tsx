// Compile-time contracts for the kit's public types. `tsc -b` fails if a permissive type
// accepts an invalid step or a mismatched payload: every @ts-expect-error below must fire.
import type { ComponentType, ReactElement } from 'react'
import { Presentation, type SceneProps, type Step } from './presentation-kit'

interface Payload {
  n: number
}

const scene: ComponentType<SceneProps<Payload>> = () => null

export const validStep: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: scene, payload: { n: 1 } }

// @ts-expect-error id is required
export const missingId: Step<Payload> = { era: 'e', title: 't', caption: 'c', Scene: scene, payload: { n: 1 } }
// @ts-expect-error era is required
export const missingEra: Step<Payload> = { id: 'a', title: 't', caption: 'c', Scene: scene, payload: { n: 1 } }
// @ts-expect-error title is required
export const missingTitle: Step<Payload> = { id: 'a', era: 'e', caption: 'c', Scene: scene, payload: { n: 1 } }
// @ts-expect-error caption is required
export const missingCaption: Step<Payload> = { id: 'a', era: 'e', title: 't', Scene: scene, payload: { n: 1 } }
// @ts-expect-error the diagram state (payload) is required
export const missingPayload: Step<Payload> = { id: 'a', era: 'e', title: 't', caption: 'c', Scene: scene }

const wrongPayload: Step<{ s: string }> = {
  id: 'b',
  era: 'e',
  title: 't',
  caption: 'c',
  Scene: () => null,
  payload: { s: 'x' },
}

/** Typed steps pass through <Presentation> without casts; a wrong payload is rejected. */
function boundaries(): ReactElement[] {
  return [
    <Presentation<Payload> key="typed" title="typed" steps={[validStep]} />,
    // @ts-expect-error a step with the wrong payload type is rejected at the boundary
    <Presentation<Payload> key="wrong" title="wrong" steps={[wrongPayload]} />,
  ]
}

export const boundaryCount = boundaries().length
