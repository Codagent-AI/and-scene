import { SceneLayer, type SceneProps, type Step } from '../../../presentation-kit'

type Payload = { message: string }

function StarterScene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><div className="starter-message">{payload.message}</div></SceneLayer>
}

export const steps: Step<Payload>[] = [
  { id: 'welcome', era: 'Start', title: 'Start with an idea', caption: 'Replace this starter beat with the opening of your story.', Scene: StarterScene, payload: { message: 'One scene. Many states.' } },
]
