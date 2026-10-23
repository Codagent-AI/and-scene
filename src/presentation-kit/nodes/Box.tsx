import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { rectStyle } from '../geometry.ts'
import type { Rect } from '../types.ts'

export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  /** Placement inside the design canvas. */
  rect?: Rect
}

export interface BoxProps extends NodeProps {
  /** Optional glyph rendered before the children (icon-as-component). */
  Icon?: LucideIcon
}

/** Generic container entity. Carries `layoutId` for in-place morphs; supplies no look. */
export function Box({ rect, Icon, style, children, ...rest }: BoxProps) {
  return (
    <motion.div data-presentation-box="" layout {...rest} style={{ ...rectStyle(rect), ...style }}>
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
