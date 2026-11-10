import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface NodeProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode
  entityId: string
}
export function Node({ entityId, children, ...props }: NodeProps) {
  return (
    <motion.div
      layout
      layoutId={entityId}
      data-presentation-entity={entityId}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
