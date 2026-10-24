import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export function entityNode(kind: string) {
  return function Entity({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
    return <motion.div layout layoutId={id} transition={{ layout: LAYOUT_T }} data-presentation-node={kind} data-entity-id={id} {...props} />
  }
}
