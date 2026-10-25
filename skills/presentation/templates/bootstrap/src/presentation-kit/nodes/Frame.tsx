import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { nodeAttrs, placement, type NodeProps } from './base.ts'

/** A grouping region drawn around other entities. Its outline comes from presentation CSS. */
export function Frame({ id, at, style, allowOverlap, children, ...rest }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...nodeAttrs('frame', id, allowOverlap)}
      {...rest}
      style={{ pointerEvents: 'none', ...placement(at, style) }}
    >
      {children}
    </motion.div>
  )
}
