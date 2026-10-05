import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id'> { entityId: string; children?: React.ReactNode }
export function Box({ entityId, children, className, ...props }: BoxProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.25, delay: LAYOUT_T } }} exit={{ opacity: 0, transition: { duration: 0.25 } }} className={['scene-box', className].filter(Boolean).join(' ')} data-presentation-node="box" data-entity-id={entityId}>{children}</motion.div>
}
