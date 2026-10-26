import { motion, type HTMLMotionProps } from 'motion/react'
import type { ComponentType, ReactNode } from 'react'

interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  layoutId: string
  Icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  children?: ReactNode
}

export function Box({ layoutId, Icon, children, className, ...props }: BoxProps) {
  return (
    <motion.div
      {...props}
      layout
      layoutId={layoutId}
      className={['presentation-box', className].filter(Boolean).join(' ')}
      data-presentation-box
      data-layout-id={layoutId}
    >
      {Icon ? <Icon aria-hidden size={16} /> : null}
      {children}
    </motion.div>
  )
}
