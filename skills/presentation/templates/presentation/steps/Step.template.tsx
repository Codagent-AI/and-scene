/**
 * TEMPLATE — copy per step (or per group of steps sharing a Scene), rename,
 * and fill in the payload shape and diagram. Steps that share a `groupKey`
 * must share the same `Scene` component so the instance persists across
 * navigation and only `payload` changes.
 */
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { SceneLayer, Box } from '../../../presentation-kit/nodes'
import { entities } from '../entities'

export interface ExampleStepPayload {
  // TODO: the diagram state this step (or step group) renders.
  headline: string
}

export function ExampleScene({ payload }: SceneProps<ExampleStepPayload>) {
  return (
    <SceneLayer className="example-scene">
      <Box layoutId={entities.exampleEntity ?? 'example-entity'} className="example-box">
        {payload.headline}
      </Box>
    </SceneLayer>
  )
}

export const exampleStep: Step<ExampleStepPayload> = {
  id: 'example-step',
  section: 'TODO: era/section label for the table of contents',
  title: 'TODO: one-line presenter title',
  caption: 'TODO: multi-line reading caption shown in browse mode.',
  Scene: ExampleScene,
  payload: { headline: 'TODO' },
  // groupKey: 'shared-group-name', // only if this step persists entities with neighbors
}
