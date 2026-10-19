import { Fragment, type ReactNode } from 'react'
import {
  Check,
  CircleDashed,
  Flag,
  Hammer,
  HelpCircle,
  Image as ImageIcon,
  MonitorPlay,
  Plug,
  ShieldCheck,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  User,
  MessageSquare,
} from 'lucide-react'
import { Appear, Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { ENTITY_ORDER, INTRODUCED_AT, RECTS, SEGMENTS, type EntityId, type RectId, type SegmentId } from '../entities'

/** Per-step diagram state: which entities are on screen and which are emphasized. */
export interface TalkPayload {
  present: readonly EntityId[]
  emphasized: readonly EntityId[]
}

function CardParts() {
  return (
    <div data-card-parts="">
      <span data-card-part="title">title</span>
      <span data-card-part="caption">caption</span>
      <span data-card-part="visual">
        <ImageIcon aria-hidden="true" />
      </span>
    </div>
  )
}

function renderEntity(id: EntityId, emphasized: boolean): ReactNode {
  if (id in SEGMENTS) {
    const seg = SEGMENTS[id as SegmentId]
    return (
      <Arrow
        id={id}
        from={seg.from}
        to={seg.to}
        twoWay={id === 'convo-arrow'}
        dashed={id === 'link-4-ghost' || id === 'modify-arc'}
      />
    )
  }
  const r = RECTS[id as RectId]
  const cardNo = id.slice(5)
  switch (id) {
    case 'you':
      return <Box id={id} {...r} Icon={User} label="you" />
    case 'prompt':
      return <Box id={id} {...r} Icon={MessageSquare} label="prompt" />
    case 'skill':
      return <Box id={id} {...r} Icon={Sparkles} label="skill" />
    case 'question-chip':
      return <SymbolChip id={id} {...r} Icon={HelpCircle} />
    case 'question-label':
      return <Label id={id} {...r}>one question at a time</Label>
    case 'depth':
      return <Box id={id} {...r} Icon={SlidersHorizontal} label="partial ↔ full" />
    case 'tray':
      return <Box id={id} {...r} label="step cards" />
    case 'morph-chip':
      return <SymbolChip id={id} {...r} Icon={Shuffle} />
    case 'morph-label':
      return <Label id={id} {...r}>morphs</Label>
    case 'ghost':
      return <Box id={id} {...r} Icon={CircleDashed} label="unspecified" />
    case 'socket':
      return <Box id={id} {...r} Icon={Plug} label="scene-kit" />
    case 'kit-label':
      return <Label id={id} {...r}>presentation-kit (shared scene kit)</Label>
    case 'verify':
      return <Box id={id} {...r} Icon={ShieldCheck} label="verify" />
    case 'verify-build':
      return <SymbolChip id={id} {...r} symbol={<><Hammer aria-hidden="true" />build</>} />
    case 'verify-render':
      return <SymbolChip id={id} {...r} symbol={<><MonitorPlay aria-hidden="true" />render</>} />
    case 'verify-pass':
      return <SymbolChip id={id} {...r} Icon={Check} />
    case 'modify-label':
      return <Label id={id} {...r}>modify</Label>
    case 'flag':
      return <SymbolChip id={id} {...r} Icon={Flag} />
    case 'frame':
      return <Frame id={id} {...r} label="this talk, built by the skill" />
    default:
      return (
        <Box id={id} {...r} label={`step ${cardNo}`} emphasis={emphasized}>
          <CardParts />
        </Box>
      )
  }
}

/**
 * One persistent scene for the whole talk. Entities introduced after the opening beat are
 * wrapped in Appear permanently (a static, per-entity decision), so a newcomer fades in once
 * on mount and is never remounted when it later becomes a continuing entity.
 */
export function TalkScene({ payload }: SceneProps<TalkPayload>) {
  const present = new Set<EntityId>(payload.present)
  const emphasized = new Set<EntityId>(payload.emphasized)
  return (
    <SceneLayer>
      {ENTITY_ORDER.filter((id) => present.has(id)).map((id) => {
        const node = renderEntity(id, emphasized.has(id))
        return INTRODUCED_AT[id] > 0 ? (
          <Appear key={id}>{node}</Appear>
        ) : (
          <Fragment key={id}>{node}</Fragment>
        )
      })}
    </SceneLayer>
  )
}
