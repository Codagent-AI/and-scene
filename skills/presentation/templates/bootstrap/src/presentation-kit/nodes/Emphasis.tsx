import { motion, type HTMLMotionProps } from 'motion/react'

export function Emphasis({ entityId, className, ...props }: HTMLMotionProps<'div'> & { entityId: string }) {
  return <motion.div layoutId={entityId} data-scene-node="emphasis" data-entity-id={entityId} className={className} {...props} />
}
