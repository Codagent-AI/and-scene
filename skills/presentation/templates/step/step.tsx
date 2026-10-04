/* eslint-disable react-refresh/only-export-components */
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { ENTITY } from '../entities'

interface Payload { label: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer className="example-scene"><Box id={ENTITY.subject} className="example-subject">{payload.label}</Box></SceneLayer>
}

export const STEP: Step<Payload> = {
  id: 'introduce-subject',
  era: 'Introduction',
  title: 'Introduce the subject',
  caption: 'Explain what the audience should notice.',
  payload: { label: 'Subject' },
  Scene,
  groupKey: 'example-story',
}
