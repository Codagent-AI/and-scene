import { motion, type HTMLMotionProps } from 'motion/react'
export interface EmphasisProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Emphasis({ entityId, children, className, ...props }: EmphasisProps) {
  return <motion.div {...props} layout layoutId={entityId} className={['scene-emphasis', className].filter(Boolean).join(' ')} data-presentation-node="emphasis" data-entity-id={entityId}>{children}</motion.div>
}
