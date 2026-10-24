import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export function Emphasis({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} transition={{ layout: LAYOUT_T }} data-presentation-node="emphasis" data-entity-id={id} {...props} />
}
