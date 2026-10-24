import { Bot, Check, Flag, User, type LucideIcon } from 'lucide-react'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
  type SceneProps,
} from '../../presentation-kit/index.ts'
import { entitiesAt, type Entity, type Glyph } from './entities.ts'

export interface SampleState {
  /** Number of the step being shown; entities with `since <= stage` exist. */
  stage: number
}

const GLYPHS: Record<Glyph, LucideIcon> = { user: User, bot: Bot, check: Check, flag: Flag }

function EntityView({ entity }: { entity: Entity }) {
  const { id, role } = entity
  if (entity.kind === 'arrow') {
    return <Arrow id={id} from={entity.from} to={entity.to} bend={entity.bend} head={entity.head} data-role={role} />
  }
  const { x, y, w, h, text, sub, parts, state } = entity
  const icon = entity.glyph ? GLYPHS[entity.glyph] : undefined
  const common = { id, x, y, w, h, 'data-role': role, 'data-dashed': entity.dashed ? '' : undefined }
  switch (entity.kind) {
    case 'box':
      return (
        <Box {...common} icon={icon} label={text}>
          {sub ? <span data-presentation-box-sub="">{sub}</span> : null}
          {parts?.map((part) => (
            <span key={part} data-card-part={part}>
              {part}
            </span>
          ))}
        </Box>
      )
    case 'chip':
      return <SymbolChip {...common} icon={icon} label={text} data-state={state} />
    case 'label':
      return <Label {...common}>{text}</Label>
    case 'frame':
      return <Frame {...common} />
    case 'emphasis':
      return <Emphasis {...common} />
  }
}

/** The one scene all nine steps share; steps only change `payload.stage`. */
export function SampleScene({ payload }: SceneProps<SampleState>) {
  return (
    <SceneLayer>
      {entitiesAt(payload.stage).map((entity) => (
        <Appear key={entity.id}>
          <EntityView entity={entity} />
        </Appear>
      ))}
    </SceneLayer>
  )
}
