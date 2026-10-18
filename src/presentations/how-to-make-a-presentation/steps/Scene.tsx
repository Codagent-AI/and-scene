import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { ENTITIES, type Entity } from '../entities'

export interface ScenePayload {
  /** 1-based step number: entities introduced at or before it are on screen. */
  step: number
}

function Node({ e, enter }: { e: Entity; enter: boolean }) {
  switch (e.kind) {
    case 'box':
      return (
        <Box id={e.id} enter={enter} x={e.x} y={e.y} width={e.width} height={e.height} Icon={e.Icon} label={e.label}
          hooks={{ 'data-variant': e.variant }}>
          {e.parts && (
            <span data-part-list="">
              <i data-part="title">title</i>
              <i data-part="caption">caption</i>
              <i data-part="visual">visual</i>
            </span>
          )}
          {e.lines?.map((line) => (
            <span key={line} data-line="">{line}</span>
          ))}
        </Box>
      )
    case 'label':
      return <Label id={e.id} enter={enter} x={e.x} y={e.y} width={e.width} height={e.height}>{e.text}</Label>
    case 'arrow':
      return <Arrow id={e.id} enter={enter} from={e.from} to={e.to} bend={e.bend} bidirectional={e.bidirectional} />
    case 'chip':
      return <SymbolChip id={e.id} enter={enter} x={e.x} y={e.y} width={e.width} height={e.height} Icon={e.Icon} symbol={e.text} />
    case 'emphasis':
      return (
        <Emphasis id={e.id} enter={enter} x={e.x} y={e.y} width={e.width} height={e.height}>
          {e.Icon && <e.Icon aria-hidden />}
        </Emphasis>
      )
    case 'frame':
      return <Frame id={e.id} enter={enter} x={e.x} y={e.y} width={e.width} height={e.height}><span>{e.text}</span></Frame>
  }
}

/**
 * The single evolving scene. Every step renders this same instance with a new payload, so entities
 * already on screen stay mounted and only the step's newcomers (`enter`) fade in.
 */
export function SampleScene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {ENTITIES.filter((e) => e.appearsAt <= payload.step).map((e) => (
        <Node key={e.id} e={e} enter={e.appearsAt === payload.step} />
      ))}
    </SceneLayer>
  )
}
