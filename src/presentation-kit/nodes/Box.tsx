import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { LAYOUT_T, EASE } from '../constants.ts'
import { placementStyle, type DomPassthrough, type NodeProps, type Placement } from './shared.ts'

export interface BoxProps extends NodeProps, Placement, DomPassthrough {
  /** Optional glyph rendered before the children. */
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box({ id, x, y, w, h, className, style, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-node="box"
      data-presentation-entity={id}
    >
      {Icon && <Icon data-presentation-icon="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
