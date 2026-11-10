import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'
function Scene({ payload }: SceneProps<{ label: string; x: number }>) {
  return (
    <SceneLayer>
      <Box
        entityId={entities.subject}
        style={{ position: 'absolute', left: payload.x, top: 150 }}
      >
        {payload.label}
      </Box>
    </SceneLayer>
  )
}
export const STEPS: Step<{ label: string; x: number }>[] = [
  {
    id: 'beginning',
    era: 'the idea',
    title: 'An idea takes shape',
    caption: 'Describe this beat and what the viewer should understand.',
    groupKey: 'your-slug:scene',
    Scene,
    payload: { label: 'Idea', x: 120 },
  },
  {
    id: 'change',
    era: 'the idea',
    title: 'The idea evolves',
    caption: 'Describe the change and preserve the continuing entity.',
    groupKey: 'your-slug:scene',
    Scene,
    payload: { label: 'Developed idea', x: 440 },
  },
]
