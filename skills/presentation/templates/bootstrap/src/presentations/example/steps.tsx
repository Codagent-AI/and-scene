/* This file exports data that references a local scene component. */
/* eslint-disable react-refresh/only-export-components */
import type { Step } from '../../presentation-kit'
import { Box, SceneLayer } from '../../presentation-kit'
import { entity } from './entities'

function Introduction() {
  return <SceneLayer><Box id={entity.idea} className="example-idea" label="One scene, evolving over time" /></SceneLayer>
}

export const steps: readonly Step[] = [{
  id: 'example/introduction', era: 'START', title: 'A first scene',
  caption: 'A presentation can be a single scene that changes as the story advances.',
  Scene: Introduction, payload: undefined,
}]
