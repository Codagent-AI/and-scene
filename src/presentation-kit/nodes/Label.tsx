import { motion, type HTMLMotionProps } from 'motion/react'

export function Label({ entityId, className, ...props }: HTMLMotionProps<'span'> & { entityId: string }) {
  return <motion.span layoutId={entityId} data-scene-node="label" data-entity-id={entityId} className={className} {...props} />
}
