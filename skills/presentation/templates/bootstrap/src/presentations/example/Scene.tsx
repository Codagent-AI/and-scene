import { AnimatePresence } from 'motion/react'
import { Appear, Box, SceneLayer, useSeenBeat, type SceneProps } from '../../presentation-kit'
import { ENTITIES } from './entities'

export interface Payload {
  /** 1-based beat this step shows. */
  beat: number
}

/**
 * One persistent scene for the whole presentation. Entities born after the beat last
 * shown (including ones skipped by a direct jump) are newcomers (`Appear`); entities
 * already on screen render the same way every beat, so they keep their place and morph if their coordinates change.
 */
export function Scene({ payload: { beat } }: SceneProps<Payload>) {
  const seen = useSeenBeat(beat)
  return (
    <SceneLayer>
      <AnimatePresence>
        {ENTITIES.filter((e) => e.beat <= beat).map(({ id, beat: born, text, icon, ...box }) => (
          <Appear key={id} active={born > seen}>
            <Box id={id} icon={icon} className={`entity-${id}`} {...box}>
              {text}
            </Box>
          </Appear>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}
