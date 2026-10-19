import { Check, Flag, Image, SlidersHorizontal } from 'lucide-react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit/index.ts'
import type { SceneProps } from '../../presentation-kit/index.ts'
import { FLAGGED_CARD, entitiesAt } from './entities.ts'
import type { Entity } from './entities.ts'

export interface Payload {
  /** 1-based step number whose entities are on screen. */
  stage: number
}

function render(e: Entity, stage: number) {
  switch (e.kind) {
    case 'node':
      if (e.role === 'verify') {
        return (
          <Box layoutId={e.id} x={e.x} y={e.y} w={e.w} h={e.h} data-role="verify">
            <span data-part="title">verify</span>
            <span data-part="check">build</span>
            <span data-part="check">render</span>
            <Check data-part="pass" data-presentation-pass="" aria-label="pass" />
          </Box>
        )
      }
      return e.role === 'tray'
        ? <Label layoutId={e.id} x={e.x} y={e.y} w={e.w} h={e.h} data-role={e.role}>{e.text}</Label>
        : <Box layoutId={e.id} x={e.x} y={e.y} w={e.w} h={e.h} data-role={e.role}>{e.text}</Box>
    case 'card':
      return (
        <Box layoutId={e.id} x={e.x} y={e.y} w={e.w} h={e.h} Icon={Image} emphasis={e.id === FLAGGED_CARD && stage >= 8} data-role="card">
          <span data-part="title">Step {e.n}</span>
          <span data-part="caption">caption</span>
        </Box>
      )
    case 'chip':
      return (
        <SymbolChip
          layoutId={e.id} x={e.x} y={e.y} w={e.w} h={e.h} data-role={e.role}
          Icon={e.role === 'depth' ? SlidersHorizontal : e.role === 'flag' ? Flag : undefined}
          data-presentation-allow-overlap={e.overlap ? '' : undefined}
        >
          {e.text}
        </SymbolChip>
      )
    case 'arrow':
      return <Arrow layoutId={e.id} from={e.a} to={e.b} via={e.via} bidirectional={e.both} data-role={e.role} />
    case 'frame':
      return <Frame layoutId={e.id} x={e.x} y={e.y} w={e.w} h={e.h} label={e.text} data-role="frame" />
  }
}

/** One persistent scene: only `payload.stage` changes between steps. */
export function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      {entitiesAt(payload.stage).map((e) => (
        <Appear key={e.id} enter={e.from === payload.stage}>
          {render(e, payload.stage)}
        </Appear>
      ))}
    </SceneLayer>
  )
}
