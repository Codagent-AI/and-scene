/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Box, SceneLayer } from '../../../presentation-kit'
import { entity } from '../entities'

interface Payload { topic: string }
function Scene({ payload }: { payload: Payload }) {
  return <SceneLayer><Box id={entity.presenter} className="my-node">{payload.topic}</Box></SceneLayer>
}

export const step: Step<Payload> = {
  id: 'step-one', era: 'Start', title: 'A clear title', caption: 'A concise explanation of this beat.',
  Scene, payload: { topic: 'Your topic' }, groupKey: 'story',
}
