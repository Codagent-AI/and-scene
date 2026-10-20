import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T, EASE } from '../constants.ts'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  /** Stable entity identity; morphs in place across steps. */
  layoutId: string
  /** Optional glyph, supplied as a component. */
  Icon?: LucideIcon
}

export function Box({ layoutId, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-box=""
      data-presentation-id={layoutId}
      {...rest}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
