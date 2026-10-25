import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { nodeAttrs, placement, type NodeProps } from './base.ts'

/** An emphasis marker (ring, flag, highlight). Looks come from presentation CSS. */
export function Emphasis({ id, at, style, allowOverlap, children, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...nodeAttrs('emphasis', id, allowOverlap)}
      {...rest}
      style={{ pointerEvents: 'none', ...placement(at, style) }}
    >
      {children}
    </motion.div>
  )
}
