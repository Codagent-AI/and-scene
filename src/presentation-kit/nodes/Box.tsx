import { motion, type HTMLMotionProps } from 'motion/react'
export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id'> { entityId: string; children?: React.ReactNode }
export function Box({ entityId, children, className, ...props }: BoxProps) {
  return <motion.div {...props} layout layoutId={entityId} className={['scene-box', className].filter(Boolean).join(' ')} data-presentation-node="box" data-entity-id={entityId}>{children}</motion.div>
}
