import { motion, type HTMLMotionProps } from 'motion/react'
export function Arrow({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} data-presentation-node="arrow" data-entity-id={id} aria-hidden="true" {...props} />
}
