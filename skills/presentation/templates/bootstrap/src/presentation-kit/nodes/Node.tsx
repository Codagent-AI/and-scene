import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_T, LAYOUT_T } from '../constants'

export type NodeProps = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children?: ReactNode
  layoutId: string
  [attribute: `data-${string}`]: unknown
}

// This base supplies shared identity and animation, never visual treatments.
export function Node({ kind, ...props }: NodeProps & { kind: string }) {
  return <motion.div layout initial={false} exit={{ opacity: 0 }}
    transition={{ layout: { duration: LAYOUT_T, ease: EASE }, opacity: { duration: ENTER_T } }}
    {...props} data-presentation-node={kind} />
}
