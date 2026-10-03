import type { Step, SceneProps } from '../../../presentation-kit'
import { SceneLayer, Box } from '../../../presentation-kit'
import { entities } from '../entities'

type Payload = { label: string }

function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box entityId={entities.subject} style={{ position: 'absolute', left: 320, top: 140 }}>{payload.label}</Box></SceneLayer>
}

export const STEPS: readonly Step<Payload>[] = [
  { id: 'begin', era: 'Begin', title: 'Replace with a presenter title', caption: 'Replace with the browse caption and explain what this state means.', payload: { label: 'Your idea' }, Scene, groupKey: 'example' },
]
