import { motion, type HTMLMotionProps } from 'motion/react'
export function Frame({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} data-presentation-node="frame" data-entity-id={id} {...props} />
}
