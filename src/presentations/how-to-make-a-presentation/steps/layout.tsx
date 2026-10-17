import type { ReactNode } from 'react'
import { ArrowLeftRight, Check, FilePenLine, Plug, SlidersHorizontal } from 'lucide-react'
import { Arrow, Box, Emphasis, Frame, Label, SymbolChip } from '../../../presentation-kit'
import { E } from '../entities'

const CARD_X = [30, 170, 310, 450] as const
const CARD_Y = 200
const CARD_W = 96
const CARD_H = 100
const MID_Y = CARD_Y + CARD_H / 2

function StepCard({ id, x, index }: { id: string; x: number; index: number }) {
  return (
    <Box id={id} x={x} y={CARD_Y} w={CARD_W} h={CARD_H} className="htmp-card">
      <span className="htmp-card-title">Title {index}</span>
      <span className="htmp-card-caption">Caption</span>
      <span className="htmp-card-visual">Visual</span>
    </Box>
  )
}

function Morph({ id, x }: { id: string; x: number }) {
  return (
    <SymbolChip id={id} x={x} y={MID_Y - 34} w={24} h={24} icon={ArrowLeftRight} className="htmp-morph" />
  )
}

/** Each entity enters at `from` and then stays; positions never change between beats. */
export const SAMPLE_ENTITIES: { from: number; key: string; node: ReactNode }[] = [
  {
    from: 1,
    key: E.you,
    node: <Box id={E.you} x={40} y={36} w={160} h={64} className="htmp-actor">you</Box>,
  },
  {
    from: 1,
    key: E.prompt,
    node: <Label id={E.prompt} x={40} y={108} w={160} h={28} className="htmp-bubble">a topic…</Label>,
  },
  {
    from: 2,
    key: E.skill,
    node: <Box id={E.skill} x={680} y={36} w={160} h={64} className="htmp-actor">skill</Box>,
  },
  {
    from: 2,
    key: E.conversation,
    node: <Arrow id={E.conversation} from={[208, 68]} to={[672, 68]} bidirectional className="htmp-arrow" />,
  },
  {
    from: 2,
    key: E.question,
    node: <Label id={E.question} x={380} y={38} w={120} h={22} className="htmp-chip">question?</Label>,
  },
  { from: 3, key: E.card1, node: <StepCard id={E.card1} x={CARD_X[0]} index={1} /> },
  {
    from: 3,
    key: E.link1,
    node: <Arrow id={E.link1} from={[CARD_X[0] + CARD_W + 4, MID_Y]} to={[CARD_X[1] - 4, MID_Y]} className="htmp-arrow" />,
  },
  { from: 3, key: E.morph1, node: <Morph id={E.morph1} x={CARD_X[0] + CARD_W + 10} /> },
  { from: 4, key: E.card2, node: <StepCard id={E.card2} x={CARD_X[1]} index={2} /> },
  { from: 4, key: E.card3, node: <StepCard id={E.card3} x={CARD_X[2]} index={3} /> },
  { from: 4, key: E.card4, node: <StepCard id={E.card4} x={CARD_X[3]} index={4} /> },
  {
    from: 4,
    key: E.link2,
    node: <Arrow id={E.link2} from={[CARD_X[1] + CARD_W + 4, MID_Y]} to={[CARD_X[2] - 4, MID_Y]} className="htmp-arrow" />,
  },
  {
    from: 4,
    key: E.link3,
    node: <Arrow id={E.link3} from={[CARD_X[2] + CARD_W + 4, MID_Y]} to={[CARD_X[3] - 4, MID_Y]} className="htmp-arrow" />,
  },
  { from: 4, key: E.morph2, node: <Morph id={E.morph2} x={CARD_X[1] + CARD_W + 10} /> },
  { from: 4, key: E.morph3, node: <Morph id={E.morph3} x={CARD_X[2] + CARD_W + 10} /> },
  {
    from: 5,
    key: E.ghost,
    node: <Box id={E.ghost} x={590} y={CARD_Y} w={CARD_W} h={CARD_H} className="htmp-ghost">?</Box>,
  },
  {
    from: 5,
    key: E.depth,
    node: <SymbolChip id={E.depth} x={40} y={142} w={160} h={28} icon={SlidersHorizontal} className="htmp-control">partial ↔ full</SymbolChip>,
  },
  {
    from: 6,
    key: E.plug,
    node: <SymbolChip id={E.plug} x={328} y={CARD_Y + CARD_H + 2} w={20} h={20} icon={Plug} className="htmp-plug" />,
  },
  {
    from: 6,
    key: E.socket,
    node: <Box id={E.socket} x={230} y={324} w={240} h={36} className="htmp-socket">scene kit</Box>,
  },
  {
    from: 7,
    key: E.verifyLink,
    node: <Arrow id={E.verifyLink} from={[590 + CARD_W + 4, MID_Y]} to={[726, MID_Y]} className="htmp-arrow" />,
  },
  {
    from: 7,
    key: E.verify,
    node: <Box id={E.verify} x={730} y={CARD_Y} w={120} h={CARD_H} className="htmp-verify">verify</Box>,
  },
  {
    from: 7,
    key: E.verifyPass,
    node: <SymbolChip id={E.verifyPass} x={794} y={CARD_Y + 66} w={24} h={24} icon={Check} className="htmp-pass" />,
  },
  {
    from: 8,
    key: E.route,
    node: <Label id={E.route} x={730} y={170} w={120} h={22} className="htmp-chip">/your-talk</Label>,
  },
  {
    from: 8,
    key: E.modifyArc,
    node: <Arrow id={E.modifyArc} from={[800, 108]} to={[800, 166]} curve={-28} className="htmp-arrow htmp-arrow-modify" />,
  },
  {
    from: 8,
    key: E.flagRing,
    node: <Emphasis id={E.flagRing} x={CARD_X[1] - 6} y={CARD_Y - 6} w={CARD_W + 12} h={CARD_H + 12} className="htmp-flag" />,
  },
  {
    from: 8,
    key: E.flagChip,
    node: <SymbolChip id={E.flagChip} x={CARD_X[1] + CARD_W - 14} y={CARD_Y - 18} w={24} h={24} icon={FilePenLine} className="htmp-flag-chip" />,
  },
  {
    from: 9,
    key: E.frame,
    node: <Frame id={E.frame} x={4} y={4} w={872} h={372} className="htmp-frame" />,
  },
  {
    from: 9,
    key: E.frameLabel,
    node: <Label id={E.frameLabel} x={310} y={8} w={260} h={22} className="htmp-frame-label">you are looking at one</Label>,
  },
]
