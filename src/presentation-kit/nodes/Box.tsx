import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { boxStyle, LAYOUT_TRANSITION, type NodeProps } from './shared'

export interface BoxProps extends NodeProps {
  Icon?: LucideIcon
  /** Marks a dashed/unspecified variant for presentation CSS to target. */
  variant?: string
}

/** Positioned container; carries a `layoutId` so it morphs between steps. */
export function Box({ id, Icon, variant, className, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="box"
      data-presentation-id={id}
      data-presentation-variant={variant}
      className={className}
      style={boxStyle({ id, ...rest })}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
