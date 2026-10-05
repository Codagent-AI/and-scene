import { motion, type HTMLMotionProps } from 'motion/react'
export interface ArrowProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Arrow({ entityId, children = '→', className, ...props }: ArrowProps) {
  return <motion.div {...props} layout layoutId={entityId} className={['scene-arrow', className].filter(Boolean).join(' ')} data-presentation-node="arrow" data-entity-id={entityId} aria-hidden="true">{children}</motion.div>
}
