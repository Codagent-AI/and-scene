import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT } from '../constants'
export function Emphasis({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} exit={EXIT} data-presentation-node="emphasis" data-entity-id={id} {...props} />
}
