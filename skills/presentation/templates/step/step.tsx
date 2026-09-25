import type { SceneProps, Step } from '../../presentation-kit'
import { Appear, Box, SceneLayer } from '../../presentation-kit'

type Payload = { /* Add strongly typed state for this step or grouped scene. */ }
function Scene({ step, index, total }: SceneProps<Payload>) {
  return <SceneLayer>{/* Compose kit nodes; preserve entityId for continuing entities. */}<Appear><Box entityId="new-entity">{step.title} ({index + 1}/{total})</Box></Appear></SceneLayer>
}

export const step: Step<Payload> = {
  id: 'unique-step-id', era: 'Era', title: 'Step title', caption: 'Explain the point of this step.',
  Scene, payload: {},
}
