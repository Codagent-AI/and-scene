import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'
function Diagram({ payload }: SceneProps<string>) {
  return <SceneLayer><Box id={entities.topic} style={{ position: 'absolute', left: 100, top: 100 }}>{payload}</Box></SceneLayer>
}
export const STEPS: readonly Step<string>[] = [
  { id: 'start', era: 'the idea', title: 'Your first beat', caption: 'Replace this with the captured narration.', Scene: Diagram, payload: 'Your topic', groupKey: 'diagram' },
]
