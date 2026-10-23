import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_TRANSITION } from '../constants.ts'
import { rectStyle } from '../geometry.ts'
import type { NodeProps } from './Box.tsx'

/** Small symbol entity: a glyph, a character, or both. */
export function SymbolChip({
  rect,
  style,
  Icon,
  children,
  ...rest
}: NodeProps & { Icon?: LucideIcon }) {
  return (
    <motion.div data-presentation-symbol-chip="" layout transition={LAYOUT_TRANSITION} {...rest} style={{ ...rectStyle(rect), ...style }}>
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
