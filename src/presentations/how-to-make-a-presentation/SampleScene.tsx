import type { CSSProperties, ReactNode } from 'react'
import { ArrowLeftRight, Bot, Check, Flag, User } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit/index.ts'
import { entitiesAt, LINKS, RECTS, type EntityId, type Rect } from './entities.ts'

export interface SamplePayload {
  /** 1-based step whose accumulated entities are on screen. */
  step: number
}

const place = ({ x, y, w, h }: Rect): CSSProperties => ({ left: x, top: y, width: w, height: h })

const CARD_PARTS = ['title', 'caption', 'visual'] as const

function StepCard({ id, ghost }: { id: 'card1' | 'card2' | 'card3' | 'ghost'; ghost?: boolean }) {
  return (
    <Box id={id} className="how-to-card" data-kind={ghost ? 'ghost' : 'card'} style={place(RECTS[id])}>
      {ghost ? (
        <Label className="how-to-part" style={{ left: 0, right: 0, top: 40, textAlign: 'center' }}>
          unspecified
        </Label>
      ) : (
        CARD_PARTS.map((part, i) => (
          <Label key={part} className="how-to-part" data-part={part} style={{ left: 10, top: 10 + i * 28 }}>
            {part}
          </Label>
        ))
      )}
    </Box>
  )
}

function Chip({ id, children }: { id: 'chip12' | 'chip23' | 'questionChip' | 'modifyChip'; children: string }) {
  return (
    <SymbolChip id={id} className="how-to-chip" style={place(RECTS[id])}>
      {children}
    </SymbolChip>
  )
}

const RENDER: Record<EntityId, () => ReactNode> = {
  you: () => (
    <Box id="you" className="how-to-actor" Icon={User} style={place(RECTS.you)}>
      you
    </Box>
  ),
  prompt: () => (
    <Box id="prompt" className="how-to-bubble" style={place(RECTS.prompt)}>
      prompt
    </Box>
  ),
  skill: () => (
    <Box id="skill" className="how-to-actor" Icon={Bot} style={place(RECTS.skill)}>
      skill
    </Box>
  ),
  convoArrow: () => <Arrow id="convoArrow" className="how-to-arrow" {...LINKS.convoArrow} />,
  questionChip: () => <Chip id="questionChip">question</Chip>,
  tray: () => <Box id="tray" className="how-to-tray" style={place(RECTS.tray)} />,
  card1: () => <StepCard id="card1" />,
  card2: () => <StepCard id="card2" />,
  card3: () => <StepCard id="card3" />,
  link12: () => <Arrow id="link12" className="how-to-arrow" {...LINKS.link12} />,
  chip12: () => <Chip id="chip12">morph</Chip>,
  link23: () => <Arrow id="link23" className="how-to-arrow" {...LINKS.link23} />,
  chip23: () => <Chip id="chip23">morph</Chip>,
  ghost: () => <StepCard id="ghost" ghost />,
  control: () => (
    <SymbolChip id="control" className="how-to-control" Icon={ArrowLeftRight} style={place(RECTS.control)}>
      partial ↔ full
    </SymbolChip>
  ),
  socket: () => (
    <Box id="socket" className="how-to-socket" style={place(RECTS.socket)}>
      shared scene kit
    </Box>
  ),
  linkVerify: () => <Arrow id="linkVerify" className="how-to-arrow" {...LINKS.linkVerify} />,
  verify: () => (
    <Box id="verify" className="how-to-verify" style={place(RECTS.verify)}>
      <Label className="how-to-part" data-part="verify" style={{ left: 10, top: 10 }}>
        verify
      </Label>
      <Label className="how-to-part" data-part="build" style={{ left: 10, top: 38 }}>
        build
      </Label>
      <Label className="how-to-part" data-part="render" style={{ left: 10, top: 66 }}>
        render
      </Label>
    </Box>
  ),
  passChip: () => (
    <SymbolChip id="passChip" className="how-to-pass" Icon={Check} data-state="pass" style={place(RECTS.passChip)} />
  ),
  modifyArc: () => <Arrow id="modifyArc" className="how-to-arrow" data-kind="modify" {...LINKS.modifyArc} />,
  modifyChip: () => <Chip id="modifyChip">modify</Chip>,
  flag: () => (
    <Emphasis id="flag" className="how-to-flag" data-target="card2" style={place(RECTS.flag)}>
      <Flag data-presentation-glyph="" aria-hidden="true" /> edited
    </Emphasis>
  ),
  frame: () => <Frame id="frame" className="how-to-frame" style={place(RECTS.frame)} />,
  frameLabel: () => (
    <Label id="frameLabel" className="how-to-frame-label" style={{ ...place(RECTS.frameLabel), textAlign: 'center' }}>
      built by the skill
    </Label>
  ),
}

/** The one continuously evolving scene; each step only reveals more of it. */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer className="how-to-scene" data-step={payload.step}>
      <AnimatePresence>
        {entitiesAt(payload.step).map((id) => (
          <Appear key={id} data-entity-wrapper={id}>
            {RENDER[id]()}
          </Appear>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}
