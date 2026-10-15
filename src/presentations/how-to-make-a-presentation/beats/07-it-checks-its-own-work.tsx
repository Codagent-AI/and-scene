import { Check, ShieldCheck } from 'lucide-react'
import { Appear, Arrow, Box } from '../../../presentation-kit'
import { E, SLOT, slotX } from '../entities'

/** Verify is chained after the cards in the same tray row; its checks resolve to a pass badge. */
export function Beat7() {
  return (
    <>
      <Box id={E.verify} Icon={ShieldCheck} className="htp-verify" style={{ left: slotX(5), top: SLOT.top, width: SLOT.w, height: SLOT.h }}>
        <span className="htp-verify-title">verify</span>
        <span className="htp-part htp-part-check">build</span>
        <span className="htp-part htp-part-check">render</span>
      </Box>
      <Arrow
        id={E.verifyLink}
        from={{ x: slotX(4) + SLOT.w + 3, y: SLOT.top + 50 }}
        to={{ x: slotX(5) - 3, y: SLOT.top + 50 }}
        headSize={6}
        className="htp-arrow htp-arrow-link"
      />
      <Appear delay={0.35}>
        <div
          data-presentation-id={E.verifyPass}
          data-presentation-allow-overlap=""
          className="htp-pass"
          style={{ left: slotX(5) + SLOT.w - 30, top: SLOT.top + SLOT.h - 30 }}
        >
          <Check aria-label="pass" />
        </div>
      </Appear>
    </>
  )
}

