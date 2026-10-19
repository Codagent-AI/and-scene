import { Arrow, Box, Frame, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { entitiesThrough, type EntityDef } from './entities'

export interface StoryPayload {
  /** 1-based step; the visible entities are cumulative up to it. */
  stage: number
}

function Entity({ def }: { def: EntityDef }) {
  switch (def.kind) {
    case 'node':
      return <Box id={def.id} x={def.x} y={def.y} w={def.w} h={def.h} className="deck-node">{def.text}</Box>
    case 'chip':
      return <SymbolChip id={def.id} x={def.x} y={def.y} w={def.w} h={def.h} className="deck-chip">{def.text}</SymbolChip>
    case 'arrow':
      return <Arrow id={def.id} from={def.from} to={def.to} bidirectional={def.bidirectional} className="deck-arrow" />
    case 'frame':
      return <Frame id={def.id} x={def.x} y={def.y} w={def.w} h={def.h} className="deck-frame" />
  }
}

/** The one scene every step shares; only the payload's stage changes. */
export function StoryScene({ payload }: SceneProps<StoryPayload>) {
  return (
    <SceneLayer>
      {entitiesThrough(payload.stage).map((def) => (
        <Entity key={def.id} def={def} />
      ))}
    </SceneLayer>
  )
}
