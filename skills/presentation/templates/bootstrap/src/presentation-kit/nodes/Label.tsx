import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export function Label({ id, ...props }: HTMLMotionProps<'span'> & { id: string }) {
  return <motion.span layout layoutId={id} transition={{ layout: LAYOUT_T }} data-presentation-node="label" data-entity-id={id} {...props} />
}
