import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT } from '../constants'
export function Label({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} exit={EXIT} data-presentation-node="label" data-entity-id={id} {...props} />
}
