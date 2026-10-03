import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT } from '../constants'
export function Arrow({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} exit={EXIT} data-presentation-node="arrow" data-entity-id={id} aria-hidden="true" {...props} />
}
