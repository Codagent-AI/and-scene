import { Appear, Box, type SceneProps } from '../../presentation-kit'
import { ENTITY } from './entities'

/** One beat of the talk. Each step advances `stage`; the scene reads it to decide what exists. */
export interface TalkPayload {
  stage: number
}

/**
 * The whole talk is one diagram. Every step renders this same component (one shared
 * layer through `groupKey`), so an entity that exists in consecutive steps is never
 * remounted: it keeps its layout id and morphs in place. Newcomers wrap in Appear so
 * they enter after the persisting entities settle.
 */
export function EvolvingScene({ payload }: SceneProps<TalkPayload>) {
  const { stage } = payload
  return (
    <>
      <Box id={ENTITY.subject} x={40} y={120} width={200} height={120} className="pn-card">
        <span className="pn-card-title">Subject</span>
        <span className="pn-card-caption">Replace with the first thing on screen.</span>
      </Box>
      {stage >= 2 ? (
        <Appear>
          <Box id={ENTITY.note} x={400} y={120} width={200} height={120} className="pn-card">
            <span className="pn-card-title">Note</span>
            <span className="pn-card-caption">A newcomer that enters after the subject settles.</span>
          </Box>
        </Appear>
      ) : null}
    </>
  )
}
