import { Check, Route, Sparkles, User, type LucideIcon } from 'lucide-react'
import { Arrow, Box, Emphasis, Frame, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { entitiesThrough, type EntityDef } from './entities'

export interface StoryPayload {
  /** 1-based step; the visible entities are cumulative up to it. */
  stage: number
}

const ICONS: Record<string, LucideIcon> = { you: User, skill: Sparkles, route: Route }

function Entity({ def }: { def: EntityDef }) {
  const geometry = 'x' in def ? { x: def.x, y: def.y, w: def.w, h: def.h } : {}
  switch (def.kind) {
    case 'node':
      return (
        <Box id={def.id} {...geometry} Icon={def.icon ? ICONS[def.icon] : undefined} className="hmp-node">
          {def.text}
        </Box>
      )
    case 'card':
      return (
        <Box id={def.id} {...geometry} className="hmp-card">
          <span className="hmp-card-part" data-part="title">title</span>
          <span className="hmp-card-part" data-part="caption">caption</span>
          <span className="hmp-card-part" data-part="visual">visual</span>
        </Box>
      )
    case 'ghost':
      return <Box id={def.id} {...geometry} className="hmp-ghost">{def.text}</Box>
    case 'tray':
      return <Box id={def.id} {...geometry} className="hmp-tray" />
    case 'chip':
      return <SymbolChip id={def.id} {...geometry} className="hmp-chip">{def.text}</SymbolChip>
    case 'arrow':
      return <Arrow id={def.id} from={def.from} to={def.to} bidirectional={def.bidirectional} className="hmp-arrow" />
    case 'check':
      return (
        <SymbolChip id={def.id} {...geometry} Icon={Check} className="hmp-check" data-presentation-allow-overlap="" />
      )
    case 'flag':
      return <Emphasis id={def.id} {...geometry} className="hmp-flag" />
    case 'frame':
      return <Frame id={def.id} {...geometry} className="hmp-frame" />
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
