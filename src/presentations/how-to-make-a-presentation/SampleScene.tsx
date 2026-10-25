import { Check, Pencil, Shuffle, SlidersHorizontal, Sparkles, User, Wrench } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'
import {
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
  type Rect,
  type SceneProps,
} from '../../presentation-kit/index.ts'
import { E, type EntityId, type SampleState } from './entities.ts'

const CARD_Y = 185
const cardRect = (i: number): Rect => ({ x: 56 + 130 * i, y: CARD_Y, w: 100, h: 90 })
const FILL = { width: '100%', height: '100%' }

const stepCard = (id: EntityId) => (
  <Box id={id} className="card" data-kind="step-card" style={FILL}>
    <span data-part="title">title</span>
    <span data-part="caption">caption</span>
    <span data-part="visual" aria-hidden="true" />
  </Box>
)

interface Slot {
  id: EntityId
  at: Rect
  node: ReactNode
  /** The entity deliberately overlaps another one. */
  overlap?: boolean
}

const SLOTS: Slot[] = [
  { id: E.tray, at: { x: 40, y: 170, w: 800, h: 120 }, node: <Box id={E.tray} className="tray" data-kind="tray" style={FILL} /> },
  { id: E.you, at: { x: 40, y: 20, w: 150, h: 64 }, node: <Box id={E.you} Icon={User} className="node" data-kind="you" style={FILL}>you</Box> },
  { id: E.prompt, at: { x: 40, y: 94, w: 150, h: 40 }, node: <Box id={E.prompt} className="bubble" data-kind="prompt" style={FILL}>my topic</Box> },
  { id: E.skill, at: { x: 690, y: 20, w: 150, h: 64 }, node: <Box id={E.skill} Icon={Sparkles} className="node" data-kind="skill" style={FILL}>skill</Box> },
  { id: E.question, at: { x: 350, y: 14, w: 180, h: 30 }, node: <SymbolChip id={E.question} className="chip" data-kind="question" style={FILL}>what is the topic?</SymbolChip> },
  { id: E.depth, at: { x: 200, y: 14, w: 130, h: 30 }, node: <SymbolChip id={E.depth} Icon={SlidersHorizontal} className="chip" data-kind="depth" style={FILL}>partial / full</SymbolChip> },
  { id: E.card1, at: cardRect(0), node: stepCard(E.card1) },
  { id: E.card2, at: cardRect(1), node: stepCard(E.card2) },
  { id: E.card3, at: cardRect(2), node: stepCard(E.card3) },
  { id: E.card4, at: cardRect(3), node: stepCard(E.card4) },
  { id: E.ghost, at: cardRect(4), node: <Box id={E.ghost} className="card ghost" data-kind="ghost-card" style={FILL}><span data-part="title">?</span></Box> },
  { id: E.verify, at: { x: 706, y: CARD_Y, w: 100, h: 90 }, node: <Box id={E.verify} Icon={Wrench} className="node" data-kind="verify" style={FILL}>verify</Box> },
  { id: E.pass, at: { x: 774, y: CARD_Y + 6, w: 24, h: 24 }, overlap: true, node: <SymbolChip id={E.pass} Icon={Check} tone="pass" className="chip" data-kind="pass" style={FILL} /> },
  { id: E.socket, at: { x: 310, y: 306, w: 260, h: 44 }, node: <Box id={E.socket} className="socket" data-kind="scene-kit" style={FILL}>scene kit: boxes, arrows, motion</Box> },
  { id: E.editedRing, at: { x: 310, y: 179, w: 112, h: 102 }, overlap: true, node: <Emphasis id={E.editedRing} className="ring" data-kind="edited-ring" style={FILL} /> },
  { id: E.edited, at: { x: 398, y: 164, w: 26, h: 26 }, overlap: true, node: <SymbolChip id={E.edited} Icon={Pencil} tone="edited" className="chip" data-kind="edited" style={FILL} /> },
  { id: E.morph1, at: { x: 164, y: 206, w: 14, h: 14 }, node: <SymbolChip id={E.morph1} Icon={Shuffle} className="chip morph" data-kind="morph" style={FILL} /> },
  { id: E.morph2, at: { x: 294, y: 206, w: 14, h: 14 }, node: <SymbolChip id={E.morph2} Icon={Shuffle} className="chip morph" data-kind="morph" style={FILL} /> },
  { id: E.morph3, at: { x: 424, y: 206, w: 14, h: 14 }, node: <SymbolChip id={E.morph3} Icon={Shuffle} className="chip morph" data-kind="morph" style={FILL} /> },
  { id: E.frame, at: { x: 8, y: 6, w: 864, h: 368 }, overlap: true, node: <Frame id={E.frame} className="frame" data-kind="frame" style={FILL} /> },
  { id: E.frameLabel, at: { x: 60, y: 346, w: 220, h: 22 }, node: <Label id={E.frameLabel} className="frame-label" data-kind="frame-label" style={FILL}>an example of its own output</Label> },
]

interface Line {
  id: EntityId
  from: { x: number; y: number }
  to: { x: number; y: number }
  curve?: { x: number; y: number }
  bidirectional?: boolean
}

const LINES: Line[] = [
  { id: E.conversation, from: { x: 192, y: 52 }, to: { x: 688, y: 52 }, bidirectional: true },
  { id: E.link1, from: { x: 156, y: 230 }, to: { x: 184, y: 230 } },
  { id: E.link2, from: { x: 286, y: 230 }, to: { x: 314, y: 230 } },
  { id: E.link3, from: { x: 416, y: 230 }, to: { x: 444, y: 230 } },
  { id: E.link4, from: { x: 546, y: 230 }, to: { x: 574, y: 230 } },
  { id: E.verifyLink, from: { x: 676, y: 230 }, to: { x: 704, y: 230 } },
  { id: E.plug, from: { x: 440, y: 306 }, to: { x: 440, y: 290 } },
  { id: E.modify, from: { x: 765, y: 86 }, curve: { x: 560, y: 110 }, to: { x: 366, y: 183 } },
]

/**
 * One persistent scene: every step only changes the payload, so entities are
 * never redrawn. Newcomers fade in (Appear); continuing ones just stay put.
 */
export function SampleScene({ payload }: SceneProps<SampleState>) {
  const shown = new Set<EntityId>(payload.shown)
  const entering = new Set<EntityId>(payload.entering)
  return (
    <SceneLayer className="sample-scene">
      <AnimatePresence>
        {SLOTS.filter((s) => shown.has(s.id)).map((s) => (
          <Appear key={s.id} id={`${s.id}/slot`} at={s.at} enter={entering.has(s.id)} allowOverlap={s.overlap}>
            {s.node}
          </Appear>
        ))}
      </AnimatePresence>
      {LINES.filter((l) => shown.has(l.id)).map((l) => (
        <Arrow key={l.id} className="arrow" {...l} />
      ))}
    </SceneLayer>
  )
}
