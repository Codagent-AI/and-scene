import { motion, type HTMLMotionProps } from 'motion/react'
export function Emphasis({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} data-presentation-node="emphasis" data-entity-id={id} {...props} />
}
