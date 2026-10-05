/* This file exports a Step object that references its local scene component. */
/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../../presentation-kit'
import { Box, SceneLayer } from '../../../presentation-kit'
import { entity } from '../entities'

function Scene() {
  return <SceneLayer>
    <Box id={entity.subject} className="scene-subject" label="Replace with the central idea" />
  </SceneLayer>
}

export const step: Step = {
  id: 'REPLACE_SLUG/step-01',
  era: 'REPLACE_SECTION',
  title: 'REPLACE STEP TITLE',
  caption: 'REPLACE WITH THE POINT THIS STEP MAKES.',
  Scene,
  payload: undefined,
}
