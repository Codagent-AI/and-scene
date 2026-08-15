import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { withBaseClass } from './classNames'

interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'children' | 'layoutId'> {
  layoutId: string
  children: ReactNode
  Icon?: LucideIcon
}

export function Box({ layoutId, children, Icon, className, ...props }: BoxProps) {
  return (
    <motion.div
      {...props}
      layout
      layoutId={layoutId}
      className={withBaseClass('presentation-box', className)}
      data-presentation-node="box"
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph /> : null}
      {children}
    </motion.div>
  )
}
