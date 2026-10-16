import { Appear, Arrow, Box, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit/index.ts'
import { E, G } from './entities.ts'

export interface ScenePayload {
  /** 1-based beat; the scene shows every entity introduced at or before it. */
  beat: number
}

/**
 * One evolving scene: a single persistent instance whose entities accumulate per beat.
 * Newcomers are wrapped in <Appear>; entities that persist keep their `id` (layoutId) so they morph.
 */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      <Appear key="idea">
        <Box id={E.idea} at={G.idea}>the idea</Box>
      </Appear>
      {payload.beat >= 2 && (
        <Appear key="link">
          <Arrow id={E.link} {...G.link} />
          <Box id={E.result} at={G.result}>what it becomes</Box>
        </Appear>
      )}
      {payload.beat >= 3 && (
        <Appear key="note">
          <SymbolChip id={E.note} at={G.note}>and you can see it</SymbolChip>
        </Appear>
      )}
    </SceneLayer>
  )
}
