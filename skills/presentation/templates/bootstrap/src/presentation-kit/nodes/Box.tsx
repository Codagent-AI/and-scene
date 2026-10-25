import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { nodeAttrs, placement, type NodeProps } from './base.ts'

export type BoxProps = NodeProps & { Icon?: LucideIcon }

/** A box that keeps its identity (layoutId) across steps. */
export function Box({ id, at, style, allowOverlap, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...nodeAttrs('box', id, allowOverlap)}
      {...rest}
      style={placement(at, style)}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
