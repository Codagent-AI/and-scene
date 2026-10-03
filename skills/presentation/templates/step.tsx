import type { SceneProps, Step } from '../../../presentation-kit/types.ts'
import { Box } from '../../../presentation-kit/nodes/Box.tsx'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer.tsx'

export interface ExamplePayload {
  label: string
}

export function ExampleScene({ payload }: SceneProps<ExamplePayload>) {
  return (
    <SceneLayer>
      <Box id="replace-with-presentation-entity" className="example-entity">
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
