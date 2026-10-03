import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

// Shared layout-morph, enter, and exit behavior for identity-bearing entities.
export function MotionNode({ id, kind, className, ...props }: HTMLMotionProps<'div'> & { id: string; kind: string; className: string }) {
  return <motion.div layout layoutId={id} className={className} data-presentation-node={kind} data-entity-id={id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { opacity: { duration: ENTER_T, delay: ENTER_DELAY } } }} exit={{ opacity: 0, transition: { duration: ENTER_T } }} transition={{ layout: LAYOUT_T }} {...props} />
}
