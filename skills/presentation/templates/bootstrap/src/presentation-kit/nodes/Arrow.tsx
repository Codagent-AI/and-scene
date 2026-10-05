import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'
export interface ArrowProps extends HTMLMotionProps<'div'> { entityId: string; children?: React.ReactNode }
export function Arrow({ entityId, children = '→', className, ...props }: ArrowProps) {
  return <motion.div {...props} layout layoutId={entityId} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.25, delay: LAYOUT_T } }} exit={{ opacity: 0, transition: { duration: 0.25 } }} className={['scene-arrow', className].filter(Boolean).join(' ')} data-presentation-node="arrow" data-entity-id={entityId} aria-hidden="true">{children}</motion.div>
}
