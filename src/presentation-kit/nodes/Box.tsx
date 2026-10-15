import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'children' | 'layoutId'> {
  /** Stable entity identity; used as the shared layoutId. */
  id: string
  children?: ReactNode
  /** Optional glyph, passed as a component (icon-as-component). */
  Icon?: LucideIcon
}

export function Box({ id, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={LAYOUT_T}
      data-presentation-node="box"
      data-presentation-id={id}
    >
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </motion.div>
  )
}
