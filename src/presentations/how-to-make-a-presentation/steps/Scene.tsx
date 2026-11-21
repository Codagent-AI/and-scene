import { BadgeCheck, Flag, MessageSquare, Plug, Sparkles, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Appear, Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip,
} from '../../../presentation-kit'
import type { SceneProps } from '../../../presentation-kit'
import { entities, layoutId } from '../entities'
import type { EntityId } from '../entities'

export interface SamplePayload {
  entityIds: readonly EntityId[]
}

const label = (text: string) => <Label>{text}</Label>

function ArrowLine({ width }: { width: number }) {
  return (
    <Arrow viewBox={`0 0 ${width} 14`} aria-hidden="true">
      <path d={`M1 7H${width - 3}m-6-5l6 5-6 5`} />
    </Arrow>
  )
}

const diagrams: Record<EntityId, ReactNode> = {
  you: <Box icon={UserRound}>You</Box>,
  prompt: <SymbolChip><MessageSquare aria-hidden="true" /> A topic</SymbolChip>,
  skill: <Box icon={Sparkles}>Skill</Box>,
  conversation: (
    <Arrow viewBox="0 0 364 20" aria-hidden="true">
      <path d="M3 10h358M10 4l-7 6 7 6m344-12 7 6-7 6" />
    </Arrow>
  ),
  question: label('Question ↔ answer'),
  tray: <div className="cards-tray" aria-hidden="true" />,
  first: (
    <Box>
      <span className="card-detail">Title</span>
      <span className="card-detail">Caption</span>
      <span className="card-detail">Visual</span>
    </Box>
  ),
  firstLink: <ArrowLine width={40} />,
  morph: label('morph'),
  second: <Box>Next beat</Box>,
  secondLink: <ArrowLine width={23} />,
  third: <Box>New state</Box>,
  ghostLink: <ArrowLine width={23} />,
  ghost: <Box>More?</Box>,
  depth: <SymbolChip>Partial ↔ Full</SymbolChip>,
  kit: <Box icon={Plug}>Shared scene kit</Box>,
  checkLink: <ArrowLine width={24} />,
  verify: (
    <Box>
      <span>Verify</span>
      <span className="verify-detail">Build + render</span>
      <BadgeCheck aria-label="Passed" />
    </Box>
  ),
  modify: (
    <Arrow viewBox="0 0 171 87" aria-hidden="true">
      <path d="M169 2C120 12 148 50 82 61 42 68 10 59 3 83m0 0 11-6M3 83l1-12" />
    </Arrow>
  ),
  modifyLabel: label('modify'),
  edited: <Emphasis><Flag aria-label="Edited" /></Emphasis>,
  reveal: <Frame aria-hidden="true" />,
  revealLabel: label('This scene'),
}

export default function SampleScene({ payload }: SceneProps<SamplePayload>) {
  return (
    <SceneLayer className="sample-scene">
      {payload.entityIds.map((id) => (
        <Appear
          key={id}
          layoutId={layoutId(id)}
          style={entities[id]}
          className={`scene-item scene-${id}`}
          data-sample-entity={id}
        >
          {diagrams[id]}
        </Appear>
      ))}
    </SceneLayer>
  )
}
