import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'
import { ENTITIES } from './entities.ts'
import type { EntityDef, EntityId } from './entities.ts'

export interface SamplePayload {
  /** Every entity on the canvas in this step; entities accumulate from step to step. */
  visible: readonly EntityId[]
}

const OVERLAP = { 'data-presentation-allow-overlap': '' }

function Entity({ def }: { def: EntityDef }) {
  const hooks = { 'data-sample': def.variant, ...(def.overlap ? OVERLAP : null) }
  switch (def.kind) {
    case 'box':
      return (
        <Box id={def.id} x={def.x} y={def.y} w={def.w} h={def.h} icon={def.icon} label={def.label} {...hooks}>
          {def.parts ? (
            <>
              <span data-sample-part="title">title</span>
              <span data-sample-part="caption">caption</span>
              <span data-sample-part="visual">visual</span>
            </>
          ) : null}
        </Box>
      )
    case 'chip':
      return (
        <SymbolChip id={def.id} x={def.x} y={def.y} w={def.w} h={def.h} symbol={def.symbol} {...hooks}>
          {def.text ? <span data-sample-text="">{def.text}</span> : null}
        </SymbolChip>
      )
    case 'link': {
      const at = def.labelAt ?? [(def.from[0] + def.to[0]) / 2 - 28, (def.from[1] + def.to[1]) / 2 - 22]
      return (
        <>
          <Arrow id={def.id} from={def.from} to={def.to} bidirectional={def.bidirectional} bend={def.bend} {...hooks} />
          {def.label ? (
            <Label id={`${def.id}:label`} x={at[0]} y={at[1]} w={56} h={16} data-sample="link-label">
              {def.label}
            </Label>
          ) : null}
        </>
      )
    }
    case 'emphasis':
      return (
        <Emphasis id={def.id} x={def.x} y={def.y} w={def.w} h={def.h} {...hooks}>
          <span data-sample-text="">{def.text}</span>
        </Emphasis>
      )
    case 'frame':
      return <Frame id={def.id} x={def.x} y={def.y} w={def.w} h={def.h} label={def.label} {...hooks} />
  }
}

/** The one evolving scene: each step only changes which entities are visible. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer>
      {payload.visible.map((id) => (
        <Appear key={id} delay={ENTITIES[id].delay}>
          <Entity def={ENTITIES[id]} />
        </Appear>
      ))}
    </SceneLayer>
  )
}
