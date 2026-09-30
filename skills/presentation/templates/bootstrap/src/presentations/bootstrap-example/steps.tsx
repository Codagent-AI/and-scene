import { Box, SceneLayer } from '../../presentation-kit'
import type { SceneProps, Step } from '../../presentation-kit'
import { entities } from './entities'

type Payload = { message: string }

function ExampleScene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box layoutId={entities.message} className="bootstrap-example-message">{payload.message}</Box></SceneLayer>
}

export const STEPS: readonly Step<Payload>[] = [
  {
    id: 'welcome',
    era: 'example',
    title: 'A presentation starts as a scene',
    caption: 'Replace this bootstrap example with the presentation you want to make.',
    groupKey: 'bootstrap-example',
    Scene: ExampleScene,
    payload: { message: 'Your evolving scene goes here.' },
  },
]
