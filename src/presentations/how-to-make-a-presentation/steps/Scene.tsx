import type { ReactNode } from 'react'
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
import { Arrow, Box, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../../presentation-kit'
import { ENTITY_ORDER, RECTS, SEGMENTS, type EntityId, type RectId, type SegmentId } from '../entities'

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

function renderEntity(id: EntityId, emphasized: boolean, enter: boolean): ReactNode {
  if (id in SEGMENTS) {
    const seg = SEGMENTS[id as SegmentId]
    return (
      <Arrow key={id} enter={enter} id={id}
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
      return <Box key={id} enter={enter} id={id} {...r} Icon={User} label="you" />
    case 'prompt':
      return <Box key={id} enter={enter} id={id} {...r} Icon={MessageSquare} label="prompt" />
    case 'skill':
      return <Box key={id} enter={enter} id={id} {...r} Icon={Sparkles} label="skill" />
    case 'question-chip':
      return <SymbolChip key={id} enter={enter} id={id} {...r} Icon={HelpCircle} />
    case 'question-label':
      return <Label key={id} enter={enter} id={id} {...r}>one question at a time</Label>
    case 'depth':
      return <Box key={id} enter={enter} id={id} {...r} Icon={SlidersHorizontal} label="partial ↔ full" />
    case 'tray':
      return <Box key={id} enter={enter} id={id} {...r} label="step cards" />
    case 'morph-chip':
      return <SymbolChip key={id} enter={enter} id={id} {...r} Icon={Shuffle} />
    case 'morph-label':
      return <Label key={id} enter={enter} id={id} {...r}>morphs</Label>
    case 'ghost':
      return <Box key={id} enter={enter} id={id} {...r} Icon={CircleDashed} label="unspecified" />
    case 'socket':
      return <Box key={id} enter={enter} id={id} {...r} Icon={Plug} label="scene-kit" />
    case 'kit-label':
      return <Label key={id} enter={enter} id={id} {...r}>presentation-kit (shared scene kit)</Label>
    case 'verify':
      return <Box key={id} enter={enter} id={id} {...r} Icon={ShieldCheck} label="verify" />
    case 'verify-build':
      return <SymbolChip key={id} enter={enter} id={id} {...r} symbol={<><Hammer aria-hidden="true" />build</>} />
    case 'verify-render':
      return <SymbolChip key={id} enter={enter} id={id} {...r} symbol={<><MonitorPlay aria-hidden="true" />render</>} />
    case 'verify-pass':
      return <SymbolChip key={id} enter={enter} id={id} {...r} Icon={Check} />
    case 'modify-label':
      return <Label key={id} enter={enter} id={id} {...r}>modify</Label>
    case 'flag':
      return <SymbolChip key={id} enter={enter} id={id} {...r} Icon={Flag} />
    case 'frame':
      return <Frame key={id} enter={enter} id={id} {...r} label="this talk, built by the skill" />
    default:
      return (
        <Box key={id} enter={enter} id={id} {...r} label={`step ${cardNo}`} emphasis={emphasized}>
          <CardParts />
        </Box>
      )
  }
}

/**
 * One persistent scene for the whole talk. Continuing entities are plain keyed nodes that
 * morph in place; only entities absent from the previously displayed step get the newcomer
 * `enter` fade, so direct jumps and backward moves classify newcomers correctly.
 */
export function TalkScene({ payload, previous }: SceneProps<TalkPayload>) {
  const present = new Set<EntityId>(payload.present)
  const shown = new Set<EntityId>(previous?.present)
  const emphasized = new Set<EntityId>(payload.emphasized)
  return (
    <SceneLayer>
      {ENTITY_ORDER.filter((id) => present.has(id)).map((id) =>
        renderEntity(id, emphasized.has(id), previous !== undefined && !shown.has(id)),
      )}
    </SceneLayer>
  )
}
