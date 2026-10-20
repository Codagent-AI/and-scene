import { motion } from 'motion/react'
import { Appear } from '../../presentation-kit/nodes/Appear.tsx'
import { Arrow } from '../../presentation-kit/nodes/Arrow.tsx'
import { Box } from '../../presentation-kit/nodes/Box.tsx'
import { Emphasis } from '../../presentation-kit/nodes/Emphasis.tsx'
import { Frame } from '../../presentation-kit/nodes/Frame.tsx'
import { Label } from '../../presentation-kit/nodes/Label.tsx'
import { SceneLayer } from '../../presentation-kit/nodes/SceneLayer.tsx'
import { SymbolChip } from '../../presentation-kit/nodes/SymbolChip.tsx'
import type { SceneProps } from '../../presentation-kit/types.ts'
import { ENTITIES, ids, type Entity } from './entities.ts'

export interface SamplePayload {
  /** 1-based step shown. */
  step: number
}

const rect = (e: { x: number; y: number; w: number; h: number }) => ({
  position: 'absolute' as const,
  left: e.x,
  top: e.y,
  width: e.w,
  height: e.h,
})
const fill = { width: '100%', height: '100%' }

function renderEntity(e: Entity) {
  switch (e.kind) {
    case 'box':
      return (
        <Appear key={e.id} style={rect(e)}>
          <Box layoutId={e.id} data-role={e.role} style={fill}>
            {e.text.map((t) => (
              <span key={t} data-part={t}>
                {t}
              </span>
            ))}
          </Box>
        </Appear>
      )
    case 'tray':
      // Coordinate-heavy diagrams may use raw motion elements with a stable layoutId.
      return (
        <Appear key={e.id} style={rect(e)}>
          <motion.div layoutId={ids.tray} data-role={e.role} style={fill} />
        </Appear>
      )
    case 'label':
      return (
        <Appear key={e.id} style={rect(e)}>
          <Label layoutId={e.id} data-role={e.role}>
            {e.text}
          </Label>
        </Appear>
      )
    case 'chip':
      return (
        <Appear key={e.id} style={rect(e)}>
          <SymbolChip layoutId={e.id} symbol={e.text} data-role={e.role} />
        </Appear>
      )
    case 'arrow':
      return (
        <Appear key={e.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Arrow layoutId={e.id} from={e.from} to={e.to} bidirectional={e.both} data-role={e.role} />
        </Appear>
      )
    case 'emphasis':
      return (
        <Appear key={e.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Emphasis layoutId={e.id} x={e.x} y={e.y} width={e.w} height={e.h} data-role={e.role} />
        </Appear>
      )
    case 'frame':
      return (
        <Appear key={e.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Frame layoutId={e.id} x={e.x} y={e.y} width={e.w} height={e.h} data-role={e.role} />
        </Appear>
      )
  }
}

/** One evolving scene: every step renders the entities introduced so far. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer>{ENTITIES.filter((e) => e.since <= payload.step).map(renderEntity)}</SceneLayer>
}
