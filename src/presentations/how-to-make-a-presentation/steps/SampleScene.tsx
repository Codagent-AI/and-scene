import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { ENTITIES } from '../entities'
import type { EntitySpec } from '../entities'

export interface SampleState {
  /** One-based step whose state the scene shows. */
  step: number
}

function renderEntity(entity: EntitySpec, step: number) {
  const common = { id: entity.id, appear: true as const }
  switch (entity.kind) {
    case 'box':
      return (
        <Box key={entity.id} {...common} at={entity.at} className={entity.className} emphasis={entity.id === 'card-2' && step >= 8}
          data-presentation-flag={entity.id === 'card-2' && step >= 8 ? 'edited' : undefined}
          data-presentation-state={entity.id === 'verify' && step >= 7 ? 'pass' : undefined}>
          {entity.lines.map((line) => (
            <span key={line} data-presentation-part="">{line}</span>
          ))}
        </Box>
      )
    case 'label':
      return <Label key={entity.id} {...common} at={entity.at} className={entity.className}>{entity.text}</Label>
    case 'chip':
      return (
        <SymbolChip key={entity.id} {...common} at={entity.at} className={entity.className} symbol={entity.symbol} emphasis={entity.id === 'verify-pass'}>
          {entity.text}
        </SymbolChip>
      )
    case 'arrow':
      return (
        <Arrow key={entity.id} {...common} className={entity.className} from={entity.from} to={entity.to} via={entity.via} bidirectional={entity.bidirectional} />
      )
    case 'frame':
      return <Frame key={entity.id} {...common} at={entity.at} className={entity.className} />
  }
}

/** One persistent scene: entities accumulate and keep the place where they first landed. */
export function SampleScene({ payload }: SceneProps<SampleState>) {
  return (
    <SceneLayer>
      {ENTITIES.filter((entity) => entity.since <= payload.step).map((entity) =>
        renderEntity(entity, payload.step),
      )}
    </SceneLayer>
  )
}
