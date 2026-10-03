/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit/types'
import { SceneLayer, type SceneProps } from '../../../presentation-kit'

type Payload = { message: string }

function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><div>{payload.message}</div></SceneLayer>
}

export const steps: Step<Payload>[] = [
  { id: 'introduction', era: 'Introduction', title: 'First step', caption: 'Describe the first idea.', Scene, payload: { message: 'Begin with one clear idea.' } },
]
