import { Box, type SceneProps, type Step } from '../../presentation-kit'
import { layoutIdFor } from './entities'

// Diagram state for one step. Add a field per changing entity; keep entities that persist.
export interface StepPayload {
  label: string
}

// Replace with the presentation's own scene: compose kit primitives and reuse layoutIdFor.
function Scene({ payload }: SceneProps<StepPayload>) {
  return (
    <Box id={layoutIdFor('subject')} x={40} y={40} width={200} height={60} className="__SLUG__-subject">
      {payload.label}
    </Box>
  )
}

// One object per step. All steps in one scene share a groupKey so the scene persists.
export const STEPS: readonly Step<StepPayload>[] = [
  {
    id: 'first',
    era: 'the start',
    title: 'First step title',
    caption: 'One paragraph of browse caption for the first step.',
    groupKey: '__SLUG__',
    scene: Scene,
    payload: { label: 'first' },
  },
]
