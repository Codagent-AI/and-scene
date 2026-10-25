import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'
interface Payload { label: string; x: number }
function Scene({ payload }: SceneProps<Payload>) {
 return <SceneLayer><Box layoutId={entities.idea} style={{ position: 'absolute', left: payload.x, top: 100 }}>{payload.label}</Box></SceneLayer>
}
export const STEPS: Step<Payload>[] = [
 { id: 'start', era: 'idea', title: 'An idea', caption: 'Write the opening explanation.', groupKey: 'idea', Scene, payload: { label: 'Idea', x: 100 } },
 { id: 'grow', era: 'idea', title: 'An idea grows', caption: 'Explain what changes while the idea persists.', groupKey: 'idea', Scene, payload: { label: 'Developed idea', x: 400 } },
]
