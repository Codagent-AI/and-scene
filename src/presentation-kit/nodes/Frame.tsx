import { motion, type HTMLMotionProps } from 'motion/react'

export function Frame({ entityId, className, ...props }: HTMLMotionProps<'div'> & { entityId: string }) {
  return <motion.div layoutId={entityId} data-scene-node="frame" data-entity-id={entityId} className={className} {...props} />
}
