import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T, EASE } from '../constants'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'layoutId' | 'id' | 'children'> {
  children?: ReactNode
  /** Stable entity identity; used as the motion layoutId. */
  id: string
  /** Optional glyph rendered before the children. */
  icon?: LucideIcon
}

export function Box({ id, icon: Icon, children, transition, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="box"
      data-presentation-id={id}
      {...rest}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
