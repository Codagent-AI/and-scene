import type { ReactNode } from 'react'
import { Check, CircleHelp, Flag, Image, Layers, MessageCircle, SlidersHorizontal, User, Bot, ShieldCheck } from 'lucide-react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { ENTITY_IDS, GEOMETRY as G, INTRO, slotX, type EntityId } from './entities'

export interface SamplePayload {
  /** 1-based step number whose entities are on screen. */
  step: number
}

const rowY = G.cardY + G.cardH / 2
const linkBetween = (slot: number) => ({
  from: [slotX(slot) + G.cardW, rowY] as const,
  to: [slotX(slot + 1), rowY] as const,
})

const card = (slot: number) => ({ x: slotX(slot), y: G.cardY, w: G.cardW, h: G.cardH })

function StepCard({ id, slot }: { id: string; slot: number }) {
  return (
    <Box id={id} className="sample-card" Icon={Image} {...card(slot)}>
      <strong>title</strong>
      <span>caption</span>
    </Box>
  )
}

const NODES: Record<EntityId, ReactNode> = {
  you: <Box id="you" className="sample-actor" Icon={User} {...G.you}>you</Box>,
  prompt: <Box id="prompt" className="sample-bubble" Icon={MessageCircle} {...G.prompt}>a topic</Box>,
  skill: <Box id="skill" className="sample-actor" Icon={Bot} {...G.skill}>skill</Box>,
  talk: <Arrow id="talk" from={[258, 58]} to={[702, 58]} bidirectional />,
  question: <SymbolChip id="question" className="sample-chip" Icon={CircleHelp} {...G.question}>question</SymbolChip>,
  tray: <Box id="tray" className="sample-tray" {...G.tray} />,
  'tray-label': <Label id="tray-label" className="sample-small" {...G.trayLabel}>/your-presentation</Label>,
  'card-1': <StepCard id="card-1" slot={0} />,
  'link-1': <Arrow id="link-1" {...linkBetween(0)} />,
  'link-label': <Label id="link-label" className="sample-small sample-center" {...G.linkLabel}>what morphs</Label>,
  'card-2': <StepCard id="card-2" slot={1} />,
  'card-3': <StepCard id="card-3" slot={2} />,
  'card-4': <StepCard id="card-4" slot={3} />,
  'link-2': <Arrow id="link-2" {...linkBetween(1)} />,
  'link-3': <Arrow id="link-3" {...linkBetween(2)} />,
  ghost: <Box id="ghost" className="sample-card sample-ghost" Icon={Layers} {...card(4)}>tbd</Box>,
  control: <SymbolChip id="control" className="sample-chip" Icon={SlidersHorizontal} {...G.control}>partial ↔ full</SymbolChip>,
  socket: <Box id="socket" className="sample-socket" {...G.socket}>scene kit</Box>,
  verify: <Box id="verify" className="sample-card sample-verify" Icon={ShieldCheck} {...card(5)}>verify</Box>,
  'verify-link': <Arrow id="verify-link" {...linkBetween(4)} />,
  check: <SymbolChip id="check" className="sample-check" Icon={Check} {...G.check} />,
  'modify-arc': <Arrow id="modify-arc" from={[781, 92]} bend={[600, 120]} to={[366, 172]} dashed />,
  'modify-label': <Label id="modify-label" className="sample-small" {...G.modifyLabel}>modify</Label>,
  'edited-ring': <Emphasis id="edited-ring" className="sample-ring" {...G.editedRing} />,
  'edited-flag': <SymbolChip id="edited-flag" className="sample-chip" Icon={Flag} {...G.editedFlag}>edited</SymbolChip>,
  'reveal-frame': <Frame id="reveal-frame" className="sample-reveal" {...G.revealFrame} />,
  'reveal-label': <Label id="reveal-label" className="sample-small sample-center" {...G.revealLabel}>made by the skill</Label>,
}

/** One persistent scene; only the payload changes between steps, so entities morph in place. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer>
      {ENTITY_IDS.filter((id) => INTRO[id] <= payload.step).map((id) => (
        <Appear key={id}>{NODES[id]}</Appear>
      ))}
    </SceneLayer>
  )
}
