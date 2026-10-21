import { AnimatePresence } from 'motion/react'
import { Appear, Box } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { AT, ID, INTRODUCED_AT } from './entities'
import type { EntityId } from './entities'

export interface ScenePayload {
  /** Zero-based step index; entities introduced at or before it are shown. */
  stage: number
}

const LABELS: Record<EntityId, string> = {
  first: 'First entity',
  second: 'Second entity',
}

/** One persistent scene: later steps only change `payload.stage`. */
export function MainScene({ payload }: SceneProps<ScenePayload>) {
  const shown = (Object.keys(ID) as EntityId[]).filter((id) => INTRODUCED_AT[id] <= payload.stage)
  return (
    <AnimatePresence initial={false}>
      {shown.map((id) => (
        <Appear key={id}>
          <Box id={ID[id]} at={AT[id]}>
            {LABELS[id]}
          </Box>
        </Appear>
      ))}
    </AnimatePresence>
  )
}
