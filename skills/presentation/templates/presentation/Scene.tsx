import { Appear, Box, SceneLayer, type SceneProps } from '../../presentation-kit'
import { E } from './entities'
import type { DeckPayload } from './types'

/**
 * One continuously evolving scene. Every step renders this component (shared
 * `groupKey`); only `payload.stage` changes. Entities appear at their
 * introduction beat and keep the same `id` (layoutId) so they morph, not redraw.
 * Canvas is 880 x 380.
 */
export function DeckScene({ payload }: SceneProps<DeckPayload>) {
  const n = payload.stage
  return (
    <SceneLayer className="__SLUG__-scene" data-stage={n}>
      <Box id={E.subject} x={40} y={40} w={240} h={80} className="__SLUG__-subject">
        <span>Subject</span>
      </Box>
      {n >= 2 ? (
        <Appear key="detail-layer">
          <Box id={E.detail} x={340} y={40} w={240} h={80} className="__SLUG__-detail">
            <span>Detail</span>
          </Box>
        </Appear>
      ) : null}
    </SceneLayer>
  )
}
