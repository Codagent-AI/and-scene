import { Appear, Arrow, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { Lightbulb, Layers } from 'lucide-react'
import type { ReactNode } from 'react'
import { ENTITIES, FIRST_STEP, GEOMETRY, LINK, type EntityId } from './entities'

export interface ScenePayload {
  /** 0-based index of the beat being shown. */
  stage: number
}

const RENDER: Record<EntityId, ReactNode> = {
  subject: (
    <Box id="subject" at={GEOMETRY.subject} Icon={Lightbulb}>
      subject
    </Box>
  ),
  detail: (
    <Box id="detail" at={GEOMETRY.detail} Icon={Layers}>
      detail
    </Box>
  ),
  link: <Arrow id="link" {...LINK} />,
}

/**
 * One persistent scene: each step adds entities and keeps the others in place.
 * Keep every entity in its keyed `Appear` so it morphs instead of re-entering.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {ENTITIES.filter((id) => FIRST_STEP[id] <= payload.stage).map((id) => (
        <Appear key={id}>{RENDER[id]}</Appear>
      ))}
    </SceneLayer>
  )
}
