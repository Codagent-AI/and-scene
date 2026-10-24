import { FileText, Check, Clapperboard, Palette, Pencil, Puzzle, Sparkles, User } from 'lucide-react'
import { Fragment, type ReactElement } from 'react'
import { Appear, Arrow, Box, Frame, Emphasis, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { E, INTRODUCED_AT, type EntityName } from './entities'

export interface SamplePayload {
  /** 1-based step this payload shows. */
  step: number
}

const CARD_X = (slot: number) => 60 + 160 * slot
const CARD_Y = 176
const LINK_Y = 226

function StepCard({ id, slot, title, caption, Icon }: { id: string; slot: number; title: string; caption: string; Icon: typeof FileText }) {
  return (
    <Box id={id} at={{ x: CARD_X(slot), y: CARD_Y, w: 110, h: 100 }} data-card="">
      <span data-card-part="title">{title}</span>
      <span data-card-part="caption">{caption}</span>
      <span data-card-part="visual"><Icon aria-hidden /></span>
    </Box>
  )
}

function entityElement(name: EntityName): ReactElement {
  switch (name) {
    case 'you': return <Box id={E.you} Icon={User} at={{ x: 40, y: 50, w: 150, h: 60 }}>you</Box>
    case 'prompt': return <SymbolChip id={E.prompt} at={{ x: 40, y: 8, w: 150, h: 30 }}>“a topic”</SymbolChip>
    case 'skill': return <Box id={E.skill} Icon={Sparkles} at={{ x: 690, y: 50, w: 150, h: 60 }}>skill</Box>
    case 'convo': return <Arrow id={E.convo} from={[190, 80]} to={[690, 80]} twoWay />
    case 'question': return <SymbolChip id={E.question} at={{ x: 385, y: 44, w: 110, h: 26 }}>question?</SymbolChip>
    case 'control': return <SymbolChip id={E.control} at={{ x: 40, y: 114, w: 150, h: 24 }} data-docked-on="you">partial ↔ full</SymbolChip>
    case 'tray': return <Box id={E.tray} at={{ x: 40, y: 150, w: 800, h: 150 }} data-tray="" />
    case 'trayLabel': return <Label id={E.trayLabel} at={{ x: 52, y: 154, w: 200, h: 14 }}>the story, step by step</Label>
    case 'card1': return <StepCard id={E.card1} slot={0} title="Topic" caption="what it is about" Icon={FileText} />
    case 'card2': return <StepCard id={E.card2} slot={1} title="Look" caption="how it feels" Icon={Palette} />
    case 'card3': return <StepCard id={E.card3} slot={2} title="Beat" caption="what happens next" Icon={Clapperboard} />
    case 'link1': return <Arrow id={E.link1} from={[CARD_X(0) + 110, LINK_Y]} to={[CARD_X(1), LINK_Y]} />
    case 'link2': return <Arrow id={E.link2} from={[CARD_X(1) + 110, LINK_Y]} to={[CARD_X(2), LINK_Y]} />
    case 'link3': return <Arrow id={E.link3} from={[CARD_X(2) + 110, LINK_Y]} to={[CARD_X(3), LINK_Y]} />
    case 'morph1': return <Label id={E.morph1} at={{ x: CARD_X(0) + 110, y: LINK_Y - 22, w: 50, h: 14 }} data-link-label="">morph</Label>
    case 'morph2': return <Label id={E.morph2} at={{ x: CARD_X(1) + 110, y: LINK_Y - 22, w: 50, h: 14 }} data-link-label="">morph</Label>
    case 'ghost':
      return (
        <Box id={E.ghost} at={{ x: CARD_X(3), y: CARD_Y, w: 110, h: 100 }} data-ghost="">
          <span data-card-part="title">?</span>
          <span data-card-part="caption">not spelled out yet</span>
        </Box>
      )
    case 'socket': return <Box id={E.socket} Icon={Puzzle} at={{ x: 300, y: 324, w: 190, h: 40 }} data-socket="">shared scene kit</Box>
    case 'plug': return <Arrow id={E.plug} from={[395, 324]} to={[395, 300]} />
    case 'verify':
      return (
        <Box id={E.verify} at={{ x: CARD_X(4), y: CARD_Y, w: 120, h: 100 }} data-verify="">
          <span data-card-part="title">verify</span>
          <span data-card-part="caption">build · render</span>
        </Box>
      )
    case 'verifyLink': return <Arrow id={E.verifyLink} from={[CARD_X(3) + 110, LINK_Y]} to={[CARD_X(4), LINK_Y]} />
    case 'check': return <SymbolChip id={E.check} Icon={Check} at={{ x: CARD_X(4) + 90, y: CARD_Y + 6, w: 24, h: 24 }} data-state="pass" aria-label="build and render passed" />
    case 'modify': return <Arrow id={E.modify} from={[560, 80]} to={[CARD_X(1) + 55, CARD_Y]} bend={60} />
    case 'flag': return <SymbolChip id={E.flag} Icon={Pencil} at={{ x: CARD_X(1) + 10, y: 280, w: 90, h: 18 }}>edited</SymbolChip>
    case 'ring': return <Emphasis id={E.ring} at={{ x: CARD_X(1) - 6, y: CARD_Y - 6, w: 122, h: 112 }} />
    case 'frame': return <Frame id={E.frame} at={{ x: 4, y: 2, w: 872, h: 376 }} />
    case 'frameLabel': return <Label id={E.frameLabel} at={{ x: 520, y: 350, w: 340, h: 20 }}>made with the skill it describes</Label>
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
