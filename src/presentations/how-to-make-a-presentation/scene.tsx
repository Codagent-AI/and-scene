import { Blocks, Check, Pencil, ShieldCheck, Sparkles, User } from 'lucide-react'
import {
  AnimatePresence,
  Appear,
  Arrow,
  Box,
  Emphasis,
  Frame,
  Label,
  SceneLayer,
  SymbolChip,
} from '../../presentation-kit'
import type { SceneProps } from '../../presentation-kit'
import { ENTITIES } from './entities'
import type { EntityKey, SampleState } from './entities'

const CARD_Y = 168
const CARD_W = 96
const CARD_H = 100
const cardX = [48, 184, 320, 456]
const GHOST_X = 592
const VERIFY_X = 728
const MID = CARD_Y + CARD_H / 2

function StepCard(props: { entity: EntityKey; x: number }) {
  return (
    <Box id={ENTITIES[props.entity].id} x={props.x} y={CARD_Y} width={CARD_W} height={CARD_H} className="htmp-card">
      <span data-htmp-part="title">title</span>
      <span data-htmp-part="caption">caption</span>
      <span data-htmp-part="visual">visual</span>
    </Box>
  )
}

const render: Record<EntityKey, () => React.ReactNode> = {
  you: () => (
    <Box id={ENTITIES.you.id} x={30} y={20} width={120} height={56} Icon={User} className="htmp-actor">
      you
    </Box>
  ),
  prompt: () => (
    <Label id={ENTITIES.prompt.id} x={30} y={88} width={150} height={30} className="htmp-bubble">
      a topic…
    </Label>
  ),
  skill: () => (
    <Box id={ENTITIES.skill.id} x={730} y={20} width={120} height={56} Icon={Sparkles} className="htmp-actor">
      skill
    </Box>
  ),
  dialogue: () => (
    <Arrow id={ENTITIES.dialogue.id} from={{ x: 160, y: 48 }} to={{ x: 720, y: 48 }} bidirectional className="htmp-arrow" />
  ),
  question: () => (
    <SymbolChip id={ENTITIES.question.id} x={395} y={18} width={90} height={22} className="htmp-chip">
      question?
    </SymbolChip>
  ),
  tray: () => <Box id={ENTITIES.tray.id} x={30} y={140} width={820} height={160} className="htmp-tray" />,
  trayLabel: () => (
    <Label id={ENTITIES.trayLabel.id} x={44} y={146} width={120} height={16} className="htmp-tray-label">
      route · steps
    </Label>
  ),
  card1: () => <StepCard entity="card1" x={cardX[0]} />,
  morphLink: () => (
    <Arrow id={ENTITIES.morphLink.id} from={{ x: 148, y: MID }} to={{ x: 180, y: MID }} className="htmp-arrow" />
  ),
  morphChip: () => (
    <SymbolChip id={ENTITIES.morphChip.id} x={104} y={274} width={100} height={18} className="htmp-chip">
      what morphs
    </SymbolChip>
  ),
  card2: () => <StepCard entity="card2" x={cardX[1]} />,
  card3: () => <StepCard entity="card3" x={cardX[2]} />,
  card4: () => <StepCard entity="card4" x={cardX[3]} />,
  link23: () => (
    <Arrow id={ENTITIES.link23.id} from={{ x: cardX[1] + CARD_W + 4, y: MID }} to={{ x: cardX[2] - 4, y: MID }} className="htmp-arrow" />
  ),
  link34: () => (
    <Arrow id={ENTITIES.link34.id} from={{ x: cardX[2] + CARD_W + 4, y: MID }} to={{ x: cardX[3] - 4, y: MID }} className="htmp-arrow" />
  ),
  ghost: () => (
    <Box id={ENTITIES.ghost.id} x={GHOST_X} y={CARD_Y} width={CARD_W} height={CARD_H} className="htmp-card htmp-ghost">
      <span data-htmp-part="title">unspecified</span>
    </Box>
  ),
  link4Ghost: () => (
    <Arrow id={ENTITIES.link4Ghost.id} from={{ x: cardX[3] + CARD_W + 4, y: MID }} to={{ x: GHOST_X - 4, y: MID }} className="htmp-arrow" />
  ),
  depth: () => (
    <Box id={ENTITIES.depth.id} x={190} y={84} width={150} height={30} className="htmp-control">
      partial ↔ full
    </Box>
  ),
  sceneKit: () => (
    <Box id={ENTITIES.sceneKit.id} x={340} y={296} width={200} height={40} Icon={Blocks} className="htmp-socket">
      scene kit
    </Box>
  ),
  verify: () => (
    <Box id={ENTITIES.verify.id} x={VERIFY_X} y={CARD_Y} width={CARD_W} height={CARD_H} Icon={ShieldCheck} className="htmp-card htmp-verify">
      <span data-htmp-part="title">build</span>
      <span data-htmp-part="caption">render</span>
    </Box>
  ),
  linkVerify: () => (
    <Arrow id={ENTITIES.linkVerify.id} from={{ x: GHOST_X + CARD_W + 4, y: MID }} to={{ x: VERIFY_X - 4, y: MID }} className="htmp-arrow" />
  ),
  verifyCheck: () => (
    <SymbolChip id={ENTITIES.verifyCheck.id} x={VERIFY_X + CARD_W - 14} y={CARD_Y - 12} width={26} height={26} className="htmp-pass">
      <Check aria-label="pass" size={16} />
    </SymbolChip>
  ),
  modify: () => (
    <Arrow id={ENTITIES.modify.id} from={{ x: 790, y: 82 }} to={{ x: 372, y: 164 }} className="htmp-arrow htmp-arrow-modify" />
  ),
  modifyChip: () => (
    <SymbolChip id={ENTITIES.modifyChip.id} x={560} y={90} width={80} height={22} className="htmp-chip">
      <Pencil aria-hidden size={12} /> modify
    </SymbolChip>
  ),
  edited: () => <Emphasis id={ENTITIES.edited.id} x={314} y={162} width={108} height={112} className="htmp-ring" />,
  editedFlag: () => (
    <Label id={ENTITIES.editedFlag.id} x={330} y={144} width={76} height={16} className="htmp-flag">
      edited
    </Label>
  ),
  frame: () => (
    <Frame id={ENTITIES.frame.id} x={2} y={2} width={876} height={376} className="htmp-frame">
      <span className="htmp-frame-label">you are looking at one</span>
    </Frame>
  ),
}

const ORDER = Object.keys(ENTITIES) as EntityKey[]

/** One evolving scene: entities accumulate step by step and are never rearranged. */
export function SampleScene({ payload }: SceneProps<SampleState>) {
  return (
    <SceneLayer>
      <AnimatePresence>
        {ORDER.filter((key) => ENTITIES[key].since <= payload.upTo).map((key) => (
          <Appear key={ENTITIES[key].id}>{render[key]()}</Appear>
        ))}
      </AnimatePresence>
    </SceneLayer>
  )
}
