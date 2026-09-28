import { Box, SceneLayer } from '../../../presentation-kit'
import type { Step } from '../../../presentation-kit'
import { ENTITIES } from '../entities'

/**
 * One navigable beat. Copy this file into `steps/`, rename it
 * `NN-{{step-slug}}.tsx`, and customize the metadata and Scene below.
 *
 * Steps that are successive states of the same evolving diagram should share
 * a `groupKey` (and this same Scene component) with adjacent steps so the
 * scene instance persists and only `payload` changes — see the grouped-scene
 * guidance in SKILL.md before splitting one idea into several Scenes.
 */
function Scene() {
  return (
    <SceneLayer className="{{slug}}-scene" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box layoutId={ENTITIES.{{ENTITY_KEY}}}>{{ENTITY_LABEL}}</Box>
    </SceneLayer>
  )
}

export const {{stepVarName}}: Step<undefined> = {
  id: '{{step-slug}}',
  era: '{{Era label}}',
  title: '{{Present-mode one-liner}}',
  caption: '{{Browse-mode paragraph}}',
  Scene,
  payload: undefined,
}
