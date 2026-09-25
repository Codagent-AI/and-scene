import type { SceneProps, Step } from '../../../src/presentation-kit'
import { Box, SceneLayer } from '../../../src/presentation-kit'
import './presentation.css'

type Payload = { subject: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer className="example-scene"><Box entityId="subject" className="example-scene__subject">{payload.subject}</Box></SceneLayer>
}

export const step: Step<Payload> = {
  id: 'opening', era: 'Beginning', title: 'Opening idea',
  caption: 'State what this step helps the audience understand.',
  Scene, payload: { subject: 'Your subject' },
}
