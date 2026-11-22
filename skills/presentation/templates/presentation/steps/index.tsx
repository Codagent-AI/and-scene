import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { entities } from '../entities'
function Scene({ payload }: SceneProps<{ label: string }>) {
 return <SceneLayer><Box id={entities.idea} className="idea" style={{ position: 'absolute', left: 300, top: 140 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: Step<{ label: string }>[] = [
 { id: 'opening', era: 'the idea', title: 'An idea takes shape', caption: 'Replace with the story you want to tell.', groupKey: 'idea', Scene, payload: { label: 'An idea' } },
]
