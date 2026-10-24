import { FileText, Check, Clapperboard, Palette, Pencil, Puzzle, Sparkles, User } from 'lucide-react'
import { Fragment, type ReactElement } from 'react'
import { Appear, Arrow, Box, Frame, Emphasis, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { E, INTRODUCED_AT, type EntityName } from './entities'

export interface SamplePayload {
  /** 1-based step this payload shows. */
  step: number
}

const CARD_X = (slot: number) => 32 + 104 * slot
const CARD_Y = 172
const CARD_W = 68
const CARD_H = 104
const LINK_Y = CARD_Y + 52
const TRAY = { x: 20, y: 144, w: 520, h: 164 }
const TRAY_BOTTOM = TRAY.y + TRAY.h
const SOCKET = { x: 20, y: TRAY_BOTTOM + 22, w: 220, h: 34 }
const PLUG_X = 130

function StepCard({ id, slot, title, caption, Icon }: { id: string; slot: number; title: string; caption: string; Icon: typeof FileText }) {
  return (
    <Box id={id} at={{ x: CARD_X(slot), y: CARD_Y, w: CARD_W, h: CARD_H }} data-card="">
      <span data-card-part="title">{title}</span>
      <span data-card-part="caption">{caption}</span>
      <span data-card-part="visual"><Icon aria-hidden /></span>
    </Box>
  )
}

function entityElement(name: EntityName): ReactElement {
  switch (name) {
    case 'you': return <Box id={E.you} Icon={User} at={{ x: 20, y: 46, w: 140, h: 56 }}>you</Box>
    case 'prompt': return <SymbolChip id={E.prompt} at={{ x: 20, y: 8, w: 140, h: 30 }}>“a topic”</SymbolChip>
    case 'skill': return <Box id={E.skill} Icon={Sparkles} at={{ x: 400, y: 46, w: 140, h: 56 }}>skill</Box>
    case 'convo': return <Arrow id={E.convo} from={[160, 74]} to={[400, 74]} twoWay />
    case 'question': return <SymbolChip id={E.question} at={{ x: 230, y: 38, w: 100, h: 28 }}>question?</SymbolChip>
    case 'control': return <SymbolChip id={E.control} at={{ x: 20, y: 106, w: 140, h: 26 }} data-docked-on="you">partial ↔ full</SymbolChip>
    case 'tray': return <Box id={E.tray} at={{ x: TRAY.x, y: TRAY.y, w: TRAY.w, h: TRAY.h }} data-tray="" />
    case 'trayLabel': return <Label id={E.trayLabel} at={{ x: 330, y: TRAY.y + 6, w: 200, h: 16 }}>the story, step by step</Label>
    case 'card1': return <StepCard id={E.card1} slot={0} title="Topic" caption="the subject" Icon={FileText} />
    case 'card2': return <StepCard id={E.card2} slot={1} title="Look" caption="the style" Icon={Palette} />
    case 'card3': return <StepCard id={E.card3} slot={2} title="Beat" caption="what next" Icon={Clapperboard} />
    case 'link1': return <Arrow id={E.link1} from={[CARD_X(0) + CARD_W, LINK_Y]} to={[CARD_X(1), LINK_Y]} />
    case 'link2': return <Arrow id={E.link2} from={[CARD_X(1) + CARD_W, LINK_Y]} to={[CARD_X(2), LINK_Y]} />
    case 'link3': return <Arrow id={E.link3} from={[CARD_X(2) + CARD_W, LINK_Y]} to={[CARD_X(3), LINK_Y]} />
    case 'morph1': return <Label id={E.morph1} at={{ x: CARD_X(0) + CARD_W, y: LINK_Y - 20, w: 36, h: 14 }} data-link-label="">morph</Label>
    case 'morph2': return <Label id={E.morph2} at={{ x: CARD_X(1) + CARD_W, y: LINK_Y - 20, w: 36, h: 14 }} data-link-label="">morph</Label>
    case 'ghost':
      return (
        <Box id={E.ghost} at={{ x: CARD_X(3), y: CARD_Y, w: CARD_W, h: CARD_H }} data-ghost="">
          <span data-card-part="title">?</span>
          <span data-card-part="caption">not set yet</span>
        </Box>
      )
    case 'socket': return <Box id={E.socket} Icon={Puzzle} at={SOCKET} data-socket="">shared scene kit</Box>
    case 'plug': return <Arrow id={E.plug} from={[PLUG_X, SOCKET.y]} to={[PLUG_X, TRAY_BOTTOM]} />
    case 'verify':
      return (
        <Box id={E.verify} at={{ x: CARD_X(4), y: CARD_Y, w: 88, h: CARD_H }} data-verify="">
          <span data-card-part="title">verify</span>
          <span data-card-part="caption">build · render</span>
        </Box>
      )
    case 'verifyLink': return <Arrow id={E.verifyLink} from={[CARD_X(3) + CARD_W, LINK_Y]} to={[CARD_X(4), LINK_Y]} />
    case 'check': return <SymbolChip id={E.check} Icon={Check} at={{ x: CARD_X(4) + 88 - 28, y: CARD_Y + 4, w: 24, h: 24 }} data-state="pass" aria-label="build and render passed" />
    case 'modify': return <Arrow id={E.modify} from={[300, 74]} to={[CARD_X(1) + CARD_W / 2, CARD_Y]} bend={40} />
    case 'flag': return <SymbolChip id={E.flag} Icon={Pencil} at={{ x: CARD_X(1) - 6, y: CARD_Y + CARD_H + 8, w: 84, h: 20 }}>edited</SymbolChip>
    case 'ring': return <Emphasis id={E.ring} at={{ x: CARD_X(1) - 6, y: CARD_Y - 6, w: CARD_W + 12, h: CARD_H + 12 }} />
    case 'frame': return <Frame id={E.frame} at={{ x: 4, y: 2, w: 552, h: 366 }} />
    case 'frameLabel': return <Label id={E.frameLabel} at={{ x: 250, y: SOCKET.y + 6, w: 298, h: 22 }}>made with the skill it describes</Label>
  }
}

const NAMES = Object.keys(E) as EntityName[]

/** One persistent scene: later steps only add entities (or change their state). */
export function SampleScene({ payload }: SceneProps<SamplePayload>) {
  const { step } = payload
  return (
    <SceneLayer>
      {NAMES.filter((name) => INTRODUCED_AT[name] <= step).map((name) => {
        const element = entityElement(name)
        // Entities present from the start need no entrance; later ones fade in as newcomers.
        return INTRODUCED_AT[name] === 1 ? <Fragment key={name}>{element}</Fragment> : <Appear key={name}>{element}</Appear>
      })}
    </SceneLayer>
  )
}
