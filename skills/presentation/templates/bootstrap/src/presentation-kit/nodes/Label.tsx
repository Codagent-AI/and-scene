import { motion, type HTMLMotionProps } from 'motion/react'
export function Label({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} data-presentation-node="label" data-entity-id={id} {...props} />
}
