import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'
function Scene({ payload }: SceneProps<{ label: string }>) {
  return <SceneLayer><Box entityId={entities.idea} style={{ position: 'absolute', left: 200, top: 120 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: readonly Step<{ label: string }>[] = [
  { id: 'idea', era: 'the start', title: 'Your first beat', caption: 'Write a paragraph explaining this state.', groupKey: 'idea', Scene, payload: { label: 'Your idea' } },
]
