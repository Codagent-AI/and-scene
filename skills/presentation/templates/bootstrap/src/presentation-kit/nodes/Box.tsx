import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  layoutId: string
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box({ layoutId, Icon, children, ...props }: BoxProps) {
  return (
    <motion.div layout layoutId={layoutId} data-presentation-box="true" {...props}>
      {Icon ? <Icon aria-hidden="true" data-presentation-box-glyph="true" /> : null}
      {children}
    </motion.div>
  )
}
