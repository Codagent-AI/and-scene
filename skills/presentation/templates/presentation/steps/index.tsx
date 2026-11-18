import { Label, SceneLayer } from '../../../presentation-kit'
import type { Step, SceneProps } from '../../../presentation-kit'
import { entities } from '../entities'
function Scene({ payload }: SceneProps<{ label: string }>) { return <SceneLayer><Label id={entities.idea}>{payload.label}</Label></SceneLayer> }
export const steps: readonly Step<{ label: string }>[] = [{ id: 'start', era: 'begin', title: 'An idea', caption: 'Explain this beat in a paragraph.', Scene, groupKey: 'story', payload: { label: 'An idea' } }]
