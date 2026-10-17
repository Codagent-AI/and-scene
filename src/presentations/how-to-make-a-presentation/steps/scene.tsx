import { Appear } from '../../../presentation-kit/nodes/Appear.tsx'
import { Arrow } from '../../../presentation-kit/nodes/Arrow.tsx'
import { Box } from '../../../presentation-kit/nodes/Box.tsx'
import { Emphasis } from '../../../presentation-kit/nodes/Emphasis.tsx'
import { Frame } from '../../../presentation-kit/nodes/Frame.tsx'
import { Label } from '../../../presentation-kit/nodes/Label.tsx'
import { SceneLayer } from '../../../presentation-kit/nodes/SceneLayer.tsx'
import { SymbolChip } from '../../../presentation-kit/nodes/SymbolChip.tsx'
import type { SceneProps } from '../../../presentation-kit/types.ts'
import { Image } from 'lucide-react'
import { visibleAt } from '../entities.ts'
import type { Entity } from '../entities.ts'

function Rendered({ e }: { e: Entity }) {
  const className = `ent ent-${e.role}`
  switch (e.kind) {
    case 'box':
      return <Box id={e.id} at={e.at} className={className} Icon={e.Icon} label={e.text} />
    case 'label':
      return <Label id={e.id} at={e.at} className={className}>{e.text}</Label>
    case 'chip':
      return (
        <SymbolChip id={e.id} at={e.at} className={className} Icon={e.Icon} state={e.state} aria-label={e.state === 'pass' ? 'passed' : undefined}>
          {e.text}
        </SymbolChip>
      )
    case 'frame':
      return <Frame id={e.id} at={e.at} className={className} />
    case 'emphasis':
      return <Emphasis id={e.id} at={e.at} className={className} />
    case 'arrow':
      return <Arrow id={e.id} from={e.from!} to={e.to!} bend={e.bend} bidirectional={e.bidirectional} className={className} />
    case 'card':
      return (
        <Box id={e.id} at={e.at} className={className}>
          <span className="part part-title">title</span>
          <span className="part part-caption">caption</span>
          <span className="part part-visual"><Image aria-hidden="true" size={16} />visual</span>
          <span className="part part-name">{e.text}</span>
        </Box>
      )
  }
}

/** One persistent scene: entities accumulate by step and never move once introduced. */
export function SampleScene({ stepIndex }: SceneProps<null>) {
  return (
    <SceneLayer>
      {visibleAt(stepIndex).map((e) => (
        <Appear key={e.id}>
          <Rendered e={e} />
        </Appear>
      ))}
    </SceneLayer>
  )
}
