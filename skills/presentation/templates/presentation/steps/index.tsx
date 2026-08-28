import { Box, Label, SceneLayer } from '../../../presentation-kit'
import type { SceneProps, Step } from '../../../presentation-kit'
import { entities } from '../entities'

export type ScenePayload = { label: string }

function Scene({ payload }: SceneProps<ScenePayload>) {
  return <SceneLayer className="{{SLUG}}-scene"><Box className="{{SLUG}}-primary" layoutId={entities.primary}><Label layoutId={entities.label}>{payload.label}</Label></Box></SceneLayer>
}

export const STEPS: readonly Step<ScenePayload>[] = [
  { id: 'first-step', era: 'opening', title: '{{STEP_TITLE}}', caption: '{{STEP_CAPTION}}', Scene, payload: { label: '{{STEP_VISUAL}}' }, groupKey: '{{SLUG}}' },
]
