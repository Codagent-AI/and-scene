import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { rectStyle, type NodeProps } from './common.ts'

export type BoxProps = NodeProps & { Icon?: LucideIcon }

/** Generic entity container with an optional glyph. Supplies no visual treatment. */
export function Box({ id, rect, style, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-entity={id}
      data-presentation-node="box"
      style={rectStyle(rect, style)}
    >
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
