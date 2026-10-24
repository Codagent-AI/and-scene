import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T } from '../constants.ts'
import { placementStyle, type NodeHooks } from './placement.ts'

export interface BoxProps extends NodeHooks {
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box({ id, at, className, style, variant, Icon, children }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      className={className}
      style={placementStyle(at, style)}
      data-presentation-node="box"
      data-presentation-entity={id}
      data-presentation-variant={variant}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
