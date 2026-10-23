import { Check } from 'lucide-react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip } from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { EDGES, ENTITIES, entity, type EntityDef } from '../entities'

export interface SamplePayload {
  /** 1-based step number whose entities are visible. */
  n: number
}

const geometry = (e: EntityDef) => ({ x: e.x, y: e.y, width: e.width, height: e.height })

const CARD_COPY: Record<string, string> = {
  'step-card-1': 'You',
  'step-card-2': 'Skill',
  'step-card-3': 'Scene',
}

function Card({ id }: { id: string }) {
  return (
    <Box id={id} {...geometry(entity(id))} className="card">
      <span className="card-title">title</span>
      <span className="card-caption">caption</span>
      <span className="card-visual">visual · {CARD_COPY[id]}</span>
    </Box>
  )
}

/** Renders one entity; each is keyed by its stable id so it persists or exits across steps. */
function EntityView({ e }: { e: EntityDef }) {
  const g = geometry(e)
  switch (e.id) {
    case 'you':
      return <Box id={e.id} {...g} className="actor">you</Box>
    case 'skill':
      return <Box id={e.id} {...g} className="actor">skill</Box>
    case 'prompt':
      return <Label id={e.id} {...g} className="bubble">a topic, and mild overconfidence</Label>
    case 'question':
      return <SymbolChip id={e.id} {...g} className="chip" symbol="question?" />
    case 'tray':
      return <Frame id={e.id} {...g} className="tray" />
    case 'ghost-card':
      return <Box id={e.id} {...g} className="card ghost">unspecified step</Box>
    case 'depth-control':
      return <SymbolChip id={e.id} {...g} className="chip depth" symbol="partial ↔ full" />
    case 'scene-kit':
      return <Box id={e.id} {...g} className="socket">shared scene kit</Box>
    case 'verify':
      return (
        <Box id={e.id} {...g} className="card verify">
          <span className="card-title">verify</span>
          <span className="card-caption">build + render</span>
        </Box>
      )
    case 'verify-check':
      return <SymbolChip id={e.id} {...g} className="chip pass" Icon={Check} />
    case 'route':
      return <Label id={e.id} {...g} className="chip route">/route</Label>
    case 'edited-flag':
      return (
        <SymbolChip
          id={e.id}
          {...g}
          className="chip flag"
          symbol="edited"
          data-presentation-allow-overlap
        />
      )
    case 'frame':
      return <Frame id={e.id} {...g} className="reveal-frame" />
    case 'frame-label':
      return <Label id={e.id} {...g} className="reveal-label">this deck was made by the skill</Label>
    default:
      return e.id.startsWith('step-card-') ? (
        <Card id={e.id} />
      ) : (
        <Label id={e.id} {...g} className="morph-label">morphs</Label>
      )
  }
}

/** One evolving scene: entities accumulate from step to step and never move. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const { n } = payload
  return (
    <SceneLayer>
      {ENTITIES.filter((e) => n >= e.since).map((e) => (
        <Appear key={e.id}>
          <EntityView e={e} />
        </Appear>
      ))}
      {EDGES.filter((e) => n >= e.since).map((e) => (
        <Appear key={e.id}>
          <Arrow id={e.id} from={e.from} to={e.to} bend={e.bend} bidirectional={e.bidirectional} className="edge" />
        </Appear>
      ))}
    </SceneLayer>
  )
}
