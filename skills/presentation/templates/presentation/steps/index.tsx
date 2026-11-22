import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'
type Payload = { label: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box id={entities.subject} style={{ position: 'absolute', left: 200, top: 120 }}>{payload.label}</Box></SceneLayer>
}
export const steps: Step<Payload>[] = [
  { id: 'begin', era: 'the idea', title: 'A first beat', caption: 'Explain the diagram in a paragraph.', groupKey: 'story', Scene, payload: { label: 'Your topic' } },
]
