import { Box, SymbolChip, Arrow } from '../../presentation-kit'
import type { LucideIcon } from 'lucide-react'
import { E, SLOT, slotX } from './entities'

interface StepCardProps {
  index: number
  Icon: LucideIcon
  edited?: boolean
}

/** A step card: title, caption, visual — the three parts every step carries. */
export function StepCard({ index, Icon, edited }: StepCardProps) {
  return (
    <Box
      id={E.card(index)}
      Icon={Icon}
      className="htp-card"
      data-edited={edited ? 'true' : undefined}
      style={{ left: slotX(index), top: SLOT.top, width: SLOT.w, height: SLOT.h }}
    >
      <span className="htp-card-n">Step {index + 1}</span>
      <span className="htp-part htp-part-title">title</span>
      <span className="htp-part htp-part-caption">caption</span>
      <span className="htp-part htp-part-visual">visual</span>
    </Box>
  )
}

const LINK_WORDS = ['position', 'label', 'size']

/** Link between card `i` and `i + 1`: an arrow plus the chip naming what morphs. */
export function CardLink({ index }: { index: number }) {
  const gapStart = slotX(index) + SLOT.w
  const gapEnd = slotX(index + 1)
  const mid = (gapStart + gapEnd) / 2
  return (
    <>
      <Arrow
        id={E.link(index)}
        from={{ x: gapStart + 3, y: SLOT.top + 50 }}
        to={{ x: gapEnd - 3, y: SLOT.top + 50 }}
        headSize={6}
        className="htp-arrow htp-arrow-link"
      />
      <SymbolChip
        id={E.linkChip(index)}
        symbol={LINK_WORDS[index % LINK_WORDS.length]}
        className="htp-chip htp-chip-morph"
        style={{ left: mid - 30, top: SLOT.top + SLOT.h + 8, width: 60 }}
      />
    </>
  )
}
