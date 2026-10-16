import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LAYOUT_TRANSITION } from '../constants'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'layoutId' | 'id' | 'children'> {
  children?: ReactNode
  /** Stable entity identity; used as `layoutId` so the box morphs across steps. */
  id: string
  Icon?: LucideIcon
}

export function Box({ id, Icon, children, ...rest }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-entity={id}
      data-presentation-node="box"
      {...rest}
    >
      {Icon && <Icon aria-hidden="true" data-presentation-icon="" />}
      {children}
    </motion.div>
  )
}
