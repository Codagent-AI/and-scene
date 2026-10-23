import { Check, Layers, MessageCircleQuestion, Shuffle, Sparkles, User } from 'lucide-react'
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
  type SceneProps,
} from '../../presentation-kit/index.ts'
import { ENTITIES, entityId, type EntityId } from './entities.ts'

export interface ScenePayload {
  /** Index of the active step; entities with a later first step are absent. */
  index: number
}

const CARD_Y = 170
const CARD_SIZE = 110
const CARD_X = [60, 220, 380] as const

function StepCard({ id, x, n }: { id: EntityId; x: number; n: number }) {
  return (
    <Box id={entityId(id)} x={x} y={CARD_Y} w={CARD_SIZE} h={CARD_SIZE} data-kind="step-card">
      <span data-part="heading">step {n}</span>
      <span data-part="title">title</span>
      <span data-part="caption">caption</span>
      <span data-part="visual">visual</span>
    </Box>
  )
}

function link(id: EntityId, chipId: EntityId, fromX: number) {
  const y = CARD_Y + CARD_SIZE / 2
  return [
    <Arrow key={id} id={entityId(id)} from={{ x: fromX, y }} to={{ x: fromX + 50, y }} />,
    <SymbolChip key={chipId} id={entityId(chipId)} x={fromX + 7} y={y - 30} w={36} h={22} aria-label="what morphs">
      <Shuffle aria-hidden="true" data-presentation-icon="" />
    </SymbolChip>,
  ]
}

const NODES: Record<EntityId, () => ReactNode> = {
  you: () => (
    <Box id={entityId('you')} x={40} y={14} w={150} h={56} Icon={User}>
      you
    </Box>
  ),
  prompt: () => (
    <Box id={entityId('prompt')} x={40} y={80} w={150} h={30} data-kind="bubble">
      prompt
    </Box>
  ),
  skill: () => (
    <Box id={entityId('skill')} x={690} y={14} w={150} h={56} Icon={Sparkles}>
      skill
    </Box>
  ),
  askArrow: () => (
    <Arrow id={entityId('askArrow')} from={{ x: 190, y: 42 }} to={{ x: 690, y: 42 }} bidirectional />
  ),
  questionChip: () => (
    <SymbolChip id={entityId('questionChip')} x={380} y={8} w={120} h={24}>
      <MessageCircleQuestion aria-hidden="true" data-presentation-icon="" /> question
    </SymbolChip>
  ),
  tray: () => <Box id={entityId('tray')} x={40} y={140} w={800} h={160} data-kind="tray" />,
  routeLabel: () => (
    <Label id={entityId('routeLabel')} x={56} y={146} w={180} h={18}>
      /your-presentation
    </Label>
  ),
  card1: () => <StepCard id="card1" x={CARD_X[0]} n={1} />,
  link1: () => link('link1', 'link1Chip', CARD_X[0] + CARD_SIZE)[0],
  link1Chip: () => link('link1', 'link1Chip', CARD_X[0] + CARD_SIZE)[1],
  card2: () => <StepCard id="card2" x={CARD_X[1]} n={2} />,
  card3: () => <StepCard id="card3" x={CARD_X[2]} n={3} />,
  link2: () => link('link2', 'link2Chip', CARD_X[1] + CARD_SIZE)[0],
  link2Chip: () => link('link2', 'link2Chip', CARD_X[1] + CARD_SIZE)[1],
  ghostCard: () => (
    <Box id={entityId('ghostCard')} x={540} y={CARD_Y} w={CARD_SIZE} h={CARD_SIZE} data-kind="ghost-card">
      <span data-part="title">unspecified</span>
    </Box>
  ),
  depthControl: () => (
    <SymbolChip
      id={entityId('depthControl')}
      x={100}
      y={56}
      w={110}
      h={22}
      data-kind="depth-control"
      data-presentation-allow-overlap=""
    >
      partial ↔ full
    </SymbolChip>
  ),
  sceneKit: () => (
    <Box
      id={entityId('sceneKit')}
      x={380}
      y={296}
      w={160}
      h={56}
      Icon={Layers}
      data-kind="socket"
      data-presentation-allow-overlap=""
    >
      scene kit
    </Box>
  ),
  verify: () => (
    <Box id={entityId('verify')} x={700} y={CARD_Y} w={CARD_SIZE} h={CARD_SIZE} data-kind="verify">
      <span data-part="title">verify</span>
      <span data-part="check">build</span>
      <span data-part="check">render</span>
    </Box>
  ),
  link3: () => (
    <Arrow id={entityId('link3')} from={{ x: 650, y: 225 }} to={{ x: 700, y: 225 }} />
  ),
  verifyPass: () => (
    <SymbolChip id={entityId('verifyPass')} x={752} y={252} w={24} h={24} data-state="pass" aria-label="pass">
      <Check aria-hidden="true" data-presentation-icon="" />
    </SymbolChip>
  ),
  modifyArc: () => (
    <Arrow id={entityId('modifyArc')} from={{ x: 190, y: 62 }} to={{ x: 260, y: 166 }} bend={40} />
  ),
  modifyLabel: () => (
    <Label id={entityId('modifyLabel')} x={232} y={96} w={110} h={20}>
      modify
    </Label>
  ),
  editedRing: () => <Emphasis id={entityId('editedRing')} x={212} y={162} w={126} h={126} />,
  editedChip: () => (
    <SymbolChip id={entityId('editedChip')} x={290} y={146} w={52} h={20}>
      edited
    </SymbolChip>
  ),
  outerFrame: () => <Frame id={entityId('outerFrame')} x={8} y={4} w={864} h={372} />,
  revealLabel: () => (
    <Label id={entityId('revealLabel')} x={600} y={350} w={250} h={22}>
      built with this skill
    </Label>
  ),
}

/** One evolving scene: the same instance renders every step. */
export function HowToScene({ payload }: SceneProps<ScenePayload>) {
  const ids = Object.keys(ENTITIES) as EntityId[]
  return (
    <SceneLayer>
      {ids
        .filter((id) => ENTITIES[id] <= payload.index)
        .map((id) => (
          <Appear key={id}>{NODES[id]()}</Appear>
        ))}
    </SceneLayer>
  )
}
