import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_T, EASE } from '../constants'
import { appearProps, exitProps, nodeHooks, placement } from './shared'
import type { NodeProps } from './types'

export type BoxProps = NodeProps & {
  /** Optional glyph rendered before the children (icon-as-component). */
  Icon?: LucideIcon
}

export function Box({ layoutId, at, appear, variant, style, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...nodeHooks('box', layoutId, variant)}
      {...appearProps(appear)}
      {...exitProps}
      {...rest}
      style={{ ...placement(at), ...style }}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
