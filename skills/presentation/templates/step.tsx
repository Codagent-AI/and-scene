import type { SceneProps, Step } from '../../../src/presentation-kit/types'
import { Box } from '../../../src/presentation-kit/nodes/Box'
import { SceneLayer } from '../../../src/presentation-kit/nodes/SceneLayer'

export interface ExamplePayload {
  label: string
}

export function ExampleScene({ payload }: SceneProps<ExamplePayload>) {
  return (
    <SceneLayer>
      <Box layoutId="replace-with-presentation-entity" className="example-entity">
        {payload.label}
      </Box>
    </SceneLayer>
  )
}

export const exampleStep: Step<ExamplePayload> = {
  id: 'replace-with-stable-step-id',
  era: 'replace-with-era',
  title: 'Replace with a presenter title',
  caption: 'Replace with the browse caption for this scene state.',
  groupKey: 'replace-with-scene-group',
  Scene: ExampleScene,
  payload: { label: 'Replace with scene content' },
}
