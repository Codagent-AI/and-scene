/* eslint-disable react-refresh/only-export-components */
import type { SceneProps, Step } from '../../../presentation-kit/types'
import { Box } from '../../../presentation-kit/nodes/Box'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer'
import { ENTITY } from '../entities'

interface Payload { label: string }
function Scene({ payload }: SceneProps<Payload>) {
  return <SceneLayer><Box id={ENTITY.idea}>{payload.label}</Box></SceneLayer>
}

export const STEP: Step<Payload> = {
  id: 'introduction', era: 'Start', title: 'An evolving scene',
  caption: 'Replace this starter step with the first beat of your presentation.',
  payload: { label: 'Your idea' }, Scene, groupKey: 'starter',
}
