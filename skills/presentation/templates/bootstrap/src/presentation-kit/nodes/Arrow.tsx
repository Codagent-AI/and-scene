import { motion, type HTMLMotionProps } from 'motion/react'

export function Arrow({ entityId, className, ...props }: HTMLMotionProps<'div'> & { entityId: string }) {
  return <motion.div layoutId={entityId} data-scene-node="arrow" data-entity-id={entityId} aria-hidden="true" className={className} {...props} />
}
