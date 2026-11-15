import { Box, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'
interface Payload { label: string }
export function Diagram({ payload }: SceneProps<Payload>) { return <SceneLayer><Box entityId={entities.idea} style={{ position: 'absolute', left: 100, top: 100 }}>{payload.label}</Box></SceneLayer> }
export const STEPS: Step<Payload>[] = [{ id: 'opening', era: 'start', title: 'Your title', caption: 'Your browse caption.', groupKey: 'idea', Scene: Diagram, payload: { label: 'Your idea' } }]
