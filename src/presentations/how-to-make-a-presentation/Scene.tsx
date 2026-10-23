import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip } from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import type { EntitySpec } from './entities'
import type { SamplePayload } from './types'

function renderEntity(spec: EntitySpec) {
  const { id, kind, className, Icon, text, parts, from, to, via, both, ...box } = spec
  const common = { id, className, appear: true, ...box }
  switch (kind) {
    case 'arrow':
      return <Arrow key={id} id={id} className={className} appear from={from!} to={to!} via={via} both={both} />
    case 'frame':
      return <Frame key={id} {...common} />
    case 'emphasis':
      return <Emphasis key={id} {...common} />
    case 'label':
      return <Label key={id} {...common}>{text}</Label>
    case 'chip':
      return <SymbolChip key={id} Icon={Icon} {...common}>{text}</SymbolChip>
    case 'box':
      return (
        <Box key={id} Icon={Icon} {...common}>
          {text}
          {parts?.map((part) => <span key={part} data-part={part}>{part}</span>)}
        </Box>
      )
  }
}

/** One persistent scene: it renders whichever entities the active step lists. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return <SceneLayer>{payload.entities.map(renderEntity)}</SceneLayer>
}
