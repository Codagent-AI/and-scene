import { SlidersHorizontal } from 'lucide-react'
import { Arrow, Box } from '../../../presentation-kit'
import { E, SLOT, slotX } from '../entities'

export function Beat5() {
  return (
    <>
      <Box id={E.ghost} className="htp-ghost" style={{ left: slotX(4), top: SLOT.top, width: SLOT.w, height: SLOT.h }}>
        <span>unspecified</span>
      </Box>
      <Arrow
        id={E.ghostLink}
        from={{ x: slotX(3) + SLOT.w + 3, y: SLOT.top + 50 }}
        to={{ x: slotX(4) - 3, y: SLOT.top + 50 }}
        headSize={6}
        className="htp-arrow htp-arrow-link htp-arrow-ghost"
      />
      <Box
        id={E.depthControl}
        Icon={SlidersHorizontal}
        className="htp-control"
        style={{ left: 30, top: 78, width: 130, height: 24 }}
      >
        <span>partial ↔ full</span>
      </Box>
    </>
  )
}

