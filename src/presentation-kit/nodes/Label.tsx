import { motion, type HTMLMotionProps } from 'motion/react'
export interface LabelProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Label({ entityId, children, className, ...props }: LabelProps) {
  return <motion.div {...props} layout layoutId={entityId} className={['scene-label', className].filter(Boolean).join(' ')} data-presentation-node="label" data-entity-id={entityId}>{children}</motion.div>
}
