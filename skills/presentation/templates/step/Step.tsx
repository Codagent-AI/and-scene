/* eslint-disable react-refresh/only-export-components */
import type { Step, SceneProps } from '../../../presentation-kit/types'

type Payload = { message: string }

function Scene({ payload }: SceneProps<Payload>) {
  return <div>{payload.message}</div>
}

export const step: Step<Payload> = {
  id: 'step-id',
  era: 'Section',
  title: 'Step title',
  caption: 'Explain the point of this step.',
  Scene,
  payload: { message: 'Describe what is visible in the scene.' },
}
