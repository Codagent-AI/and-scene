import { Check, Plug, Sparkles, User } from 'lucide-react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit/index.ts'
import { stageEntities, type BoxEntity, type Entity } from '../entities.ts'

export interface ScenePayload {
  /** 1-based step; the scene shows every entity introduced up to it. */
  stage: number
}

const CARD_PARTS = ['title', 'caption', 'visual'] as const

function renderEntity(e: Entity) {
  if (e.kind === 'arrow') {
    return <Arrow data-role={e.role} from={e.from} to={e.to} via={e.via} bidirectional={e.bidirectional} />
  }
  const common = {
    layoutId: e.id,
    rect: e.rect,
    'data-role': e.role,
    ...(e.overlap ? { 'data-presentation-allow-overlap': '' } : {}),
  }
  switch (e.kind) {
    case 'frame':
      return <Frame {...common} />
    case 'label':
      return <Label {...common}>{e.text}</Label>
    case 'chip':
      return <SymbolChip {...common} Icon={e.role === 'edited' ? undefined : Sparkles}>{e.text}</SymbolChip>
    default:
      return renderBox(e, common)
  }
}

function renderBox(e: BoxEntity, common: object) {
  switch (e.role) {
    case 'card':
      return (
        <Box {...common}>
          <span data-part="index">{e.text}</span>
          {CARD_PARTS.map((part) => (
            <span key={part} data-part={part}>{part}</span>
          ))}
        </Box>
      )
    case 'verify':
      return (
        <Box {...common}>
          <span data-part="title">verify</span>
          <span data-part="check">build</span>
          <span data-part="check">render</span>
          <span data-part="pass"><Check aria-hidden="true" /> pass</span>
        </Box>
      )
    case 'you':
      return <Box {...common} Icon={User}>{e.text}</Box>
    case 'socket':
      return <Box {...common} Icon={Plug}>{e.text}</Box>
    default:
      return <Box {...common}>{e.text}</Box>
  }
}

/** The one evolving scene: every step renders the same tree with more of it visible. */
export function Scene({ payload }: SceneProps<ScenePayload>) {
  return (
    <SceneLayer>
      {stageEntities(payload.stage).map((e) => (
        <Appear key={e.id}>{renderEntity(e)}</Appear>
      ))}
    </SceneLayer>
  )
}
