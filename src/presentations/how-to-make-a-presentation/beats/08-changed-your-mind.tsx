import { Arrow, SymbolChip } from '../../../presentation-kit'
import { E, EDITED_CARD, SLOT, slotX } from '../entities'

/** The modify arc reaches from the conversation (skill) down onto the edited card. */
export function Beat8() {
  const target = { x: slotX(EDITED_CARD) + SLOT.w / 2 + 20, y: SLOT.top - 2 }
  return (
    <>
      <Arrow id={E.modifyArc} from={{ x: 770, y: 76 }} to={target} className="htp-arrow htp-arrow-modify" />
      <SymbolChip id={E.modifyChip} symbol="modify" className="htp-chip htp-chip-modify" style={{ left: 480, top: 76, width: 64 }} />
      <SymbolChip
        id={E.editedFlag}
        symbol="edited"
        className="htp-chip htp-chip-edited"
        style={{ left: slotX(EDITED_CARD) + 28, top: SLOT.top + SLOT.h + 8, width: 56 }}
      />
    </>
  )
}

