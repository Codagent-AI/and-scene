import { Check, Plug, Sparkles, User } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Arrow, Box, Emphasis, Frame, Label, SceneLayer, SymbolChip, type SceneProps } from '../../presentation-kit'
import { E, SLOT_SIZE, SLOT_Y, slotX, type EntityId } from './entities'

export interface ScenePayload {
  /** Entities on screen, in stacking order. Entities only ever accumulate. */
  visible: readonly EntityId[]
  /** Entities introduced by this step: only these fade in. Continuing entities just morph. */
  entering: readonly EntityId[]
  /** Entities carrying an emphasis flag on this step. */
  flagged?: readonly EntityId[]
}

const card = (id: EntityId, slot: number, flagged: readonly EntityId[], appear: boolean) => (
  <Box id={id} appear={appear} emphasis={flagged.includes(id)} x={slotX(slot)} y={SLOT_Y} width={SLOT_SIZE} height={SLOT_SIZE}>
    <span data-part="title">title</span>
    <span data-part="caption">caption</span>
    <span data-part="visual">visual</span>
  </Box>
)

const link = (id: EntityId, labelId: EntityId, slot: number, appear: boolean, label = 'morph') => (
  <>
    <Arrow id={id} appear={appear} from={{ x: slotX(slot) + SLOT_SIZE + 4, y: 198 }} to={{ x: slotX(slot + 1) - 4, y: 198 }} />
    <SymbolChip id={labelId} appear={appear} x={slotX(slot) + SLOT_SIZE + 2} y={172} width={36} height={16}>
      <span>{label}</span>
    </SymbolChip>
  </>
)

function render(id: EntityId, flagged: readonly EntityId[], appear: boolean): ReactNode {
  switch (id) {
    case E.you:
      return <Box id={id} appear={appear} Icon={User} iconSize={22} x={40} y={20} width={130} height={64}><span>you</span></Box>
    case E.prompt:
      return <Box id={id} appear={appear} kind="bubble" x={190} y={10} width={120} height={32}><span>prompt</span></Box>
    case E.skill:
      return <Box id={id} appear={appear} Icon={Sparkles} iconSize={22} x={710} y={20} width={130} height={64}><span>skill</span></Box>
    case E.talk:
      return <Arrow id={id} appear={appear} from={{ x: 178, y: 58 }} to={{ x: 702, y: 58 }} bidirectional />
    case E.question:
      return <SymbolChip id={id} appear={appear} x={390} y={24} width={100} height={26}><span>question</span></SymbolChip>
    case E.tray:
      return <Box id={id} appear={appear} kind="tray" x={30} y={136} width={820} height={134} />
    case E.card1:
      return card(id, 0, flagged, appear)
    case E.card2:
      return card(id, 1, flagged, appear)
    case E.card3:
      return card(id, 2, flagged, appear)
    case E.card4:
      return card(id, 3, flagged, appear)
    case E.link1:
      return link(id, E.link1Label, 0, appear)
    case E.link2:
      return link(id, E.link2Label, 1, appear)
    case E.link3:
      return link(id, E.link3Label, 2, appear)
    case E.ghost:
      return (
        <Box id={id} appear={appear} kind="ghost" x={slotX(4)} y={SLOT_Y} width={SLOT_SIZE} height={SLOT_SIZE}>
          <span>unspecified step</span>
        </Box>
      )
    case E.control:
      return <SymbolChip id={id} appear={appear} x={40} y={94} width={130} height={24}><span>partial ↔ full</span></SymbolChip>
    case E.socket:
      return (
        <Box id={id} appear={appear} Icon={Plug} iconSize={14} x={330} y={258} width={220} height={52}>
          <span>scene kit</span>
          <span>boxes · arrows · motion</span>
        </Box>
      )
    case E.verify:
      return (
        <Box id={id} appear={appear} x={slotX(5)} y={SLOT_Y} width={SLOT_SIZE} height={SLOT_SIZE}>
          <span>verify</span>
          <span>build</span>
          <span>render</span>
        </Box>
      )
    case E.link4:
      // verification is chained after the step cards: the last tray slot before verify links into it
      return link(id, E.link4Label, 4, appear, 'check')
    case E.pass:
      return (
        <SymbolChip id={id} appear={appear} Icon={Check} iconSize={14} x={slotX(5) + 20} y={224} width={60} height={22} data-presentation-allow-overlap="">
          <span>pass</span>
        </SymbolChip>
      )
    case E.modify:
      return <Arrow id={id} appear={appear} from={{ x: 775, y: 90 }} to={{ x: 420, y: 146 }} bend={30} />
    case E.modifyLabel:
      return <SymbolChip id={id} appear={appear} x={560} y={108} width={60} height={22}><span>modify</span></SymbolChip>
    case E.edited:
      return <Emphasis id={id} appear={appear} x={324} y={146} width={104} height={104} />
    case E.editedFlag:
      return <SymbolChip id={id} appear={appear} x={344} y={114} width={60} height={22}><span>edited</span></SymbolChip>
    case E.frame:
      return <Frame id={id} appear={appear} x={4} y={2} width={872} height={342} />
    case E.reveal:
      return <Label id={id} appear={appear} x={240} y={320} width={400} height={18}><span>an example of the skill's own output</span></Label>
  }
}

/** One persistent scene: every step re-renders it with a longer `visible` list. */
export function SampleScene({ payload }: SceneProps<ScenePayload>) {
  const flagged = payload.flagged ?? []
  return (
    <SceneLayer>
      {payload.visible.map((id) => (
        <Fragment key={id}>{render(id, flagged, payload.entering.includes(id))}</Fragment>
      ))}
    </SceneLayer>
  )
}
